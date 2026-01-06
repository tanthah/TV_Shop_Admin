import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true,
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // Theo dõi các khách hàng đã kết nối
    private connectedUsers = new Map<string, string>(); // userId -> socketId
    private connectedAdmins = new Set<string>();

    constructor(private chatService: ChatService) { }

    handleConnection(client: Socket) {
        // console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        // console.log(`Client disconnected: ${client.id}`);
        this.connectedAdmins.delete(client.id);

        let disconnectedUserId: string | null = null;
        this.connectedUsers.forEach((socketId, userId) => {
            if (socketId === client.id) {
                disconnectedUserId = userId;
            }
        });
        if (disconnectedUserId) {
            this.connectedUsers.delete(disconnectedUserId);
        }
    }

    @SubscribeMessage('admin_join_chat')
    async handleAdminJoin(client: Socket) {
        this.connectedAdmins.add(client.id);

        // Gửi tóm tắt các cuộc gọi chuyện đang hoạt động cho admin
        const summaries = await this.chatService.getActiveConversations();
        client.emit('active_chats_summary', summaries);
    }

    @SubscribeMessage('join_chat')
    async handleUserJoin(client: Socket, payload: { userId: string; name: string }) {
        this.connectedUsers.set(payload.userId, client.id);

        // Tải lịch sử cho người dùng
        const history = await this.chatService.getHistory(payload.userId);
        client.emit('chat_history', history);

        // Thông báo cho admin về người dùng mới hoặc cập nhật
        this.server.emit('new_chat_request', {
            userId: payload.userId,
            name: payload.name,
            timestamp: new Date()
        });
    }

    @SubscribeMessage('send_message')
    async handleUserMessage(client: Socket, payload: { userId: string; message: string; name: string }) {
        // Lưu vào DB
        await this.chatService.saveMessage({
            userId: payload.userId,
            message: payload.message,
            from: 'user',
            name: payload.name
        });

        // Phát sóng cho admin
        this.server.emit('receive_message', {
            userId: payload.userId,
            message: payload.message,
            from: 'user',
            name: payload.name,
            timestamp: new Date()
        });
    }

    @SubscribeMessage('admin_reply')
    async handleAdminReply(client: Socket, payload: { userId: string; message: string }) {
        // Lưu vào DB
        await this.chatService.saveMessage({
            userId: payload.userId,
            message: payload.message,
            from: 'admin'
        });

        // Gửi cho người dùng cụ thể nếu đã kết nối
        const userSocketId = this.connectedUsers.get(payload.userId);
        const msgPayload = {
            userId: 'admin',
            message: payload.message,
            from: 'admin',
            timestamp: new Date()
        };

        if (userSocketId) {
            this.server.to(userSocketId).emit('receive_message', msgPayload);
        }

        // Phát lại cho tất cả admin (bao gồm cả người gửi) để cập nhật chế độ xem của họ
        this.server.emit('receive_message', {
            userId: payload.userId,
            message: payload.message,
            from: 'admin',
            timestamp: new Date()
        });
    }

    @SubscribeMessage('admin_request_history')
    async handleAdminRequestHistory(client: Socket, payload: { userId: string }) {
        const history = await this.chatService.getHistory(payload.userId);
        client.emit('chat_history', { userId: payload.userId, history });
    }

    @SubscribeMessage('mark_as_read')
    async handleMarkAsRead(client: Socket, payload: { userId: string }) {
        await this.chatService.markAsRead(payload.userId);
    }

    @SubscribeMessage('delete_chat')
    async handleDeleteChat(client: Socket, payload: { userId: string }) {
        await this.chatService.deleteHistory(payload.userId);

        // Thông báo cho admin để xóa khỏi UI
        // Trong ứng dụng thực tế với nhiều admin, phát sóng đến phòng 'admin'
        this.server.emit('chat_deleted', { userId: payload.userId });
    }
}
