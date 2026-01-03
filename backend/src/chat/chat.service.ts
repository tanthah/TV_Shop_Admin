
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument } from './schemas/chat.schema';

@Injectable()
export class ChatService {
    constructor(@InjectModel(Chat.name) private chatModel: Model<ChatDocument>) { }

    async saveMessage(data: { userId: string; message: string; from: 'user' | 'admin' | 'bot'; name?: string }) {
        const newChat = new this.chatModel(data);
        return newChat.save();
    }

    async getHistory(userId: string) {
        return this.chatModel.find({ userId }).sort({ createdAt: 1 }).exec();
    }

    async getActiveConversations() {
        // Aggregate to find unique users and their latest message
        // This is a simple version; user might want full list
        const distinctUsers = await this.chatModel.distinct('userId');
        // For each user, get info. Optimized approach would use aggregate.
        // For now, let's keep it simple or use aggregate if possible.

        return await this.chatModel.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$userId",
                    userId: { $first: "$userId" },
                    name: { $first: "$name" },
                    lastMessage: { $first: "$message" },
                    timestamp: { $first: "$createdAt" },
                    unread: { $sum: { $cond: [{ $and: [{ $eq: ["$read", false] }, { $eq: ["$from", "user"] }] }, 1, 0] } }
                }
            },
            { $sort: { timestamp: -1 } }
        ]);
    }

    async markAsRead(userId: string) {
        return this.chatModel.updateMany({ userId, from: 'user', read: false }, { read: true });
    }

    async deleteHistory(userId: string) {
        return this.chatModel.deleteMany({ userId });
    }
}
