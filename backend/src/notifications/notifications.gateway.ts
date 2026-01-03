
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class NotificationsGateway {
    @WebSocketServer()
    server: Server;

    sendNotification(notification: any) {
        this.server.emit('new_notification', notification);
    }
}
