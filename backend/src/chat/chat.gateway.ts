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

    // Track connected clients
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

        // Send active conversations summary to admin
        const summaries = await this.chatService.getActiveConversations();
        client.emit('active_chats_summary', summaries);
    }

    @SubscribeMessage('join_chat')
    async handleUserJoin(client: Socket, payload: { userId: string; name: string }) {
        this.connectedUsers.set(payload.userId, client.id);

        // Load history for user
        const history = await this.chatService.getHistory(payload.userId);
        client.emit('chat_history', history);

        // Notify admins about new user or update
        this.server.emit('new_chat_request', {
            userId: payload.userId,
            name: payload.name,
            timestamp: new Date()
        });
    }

    @SubscribeMessage('send_message')
    async handleUserMessage(client: Socket, payload: { userId: string; message: string; name: string }) {
        // Save to DB
        await this.chatService.saveMessage({
            userId: payload.userId,
            message: payload.message,
            from: 'user',
            name: payload.name
        });

        // Broadcast to admins
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
        // Save to DB
        await this.chatService.saveMessage({
            userId: payload.userId,
            message: payload.message,
            from: 'admin'
        });

        // Send to specific user if connected
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

        // Emit back to all admins (including sender) to update their view
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

        // Notify admin to remove from UI
        // In a real app with multiple admins, broadcast to 'admin' room
        this.server.emit('chat_deleted', { userId: payload.userId });
    }
}
