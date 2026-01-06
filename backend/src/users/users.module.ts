import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/user.schema';
import { Order, OrderSchema } from '../schemas/order.schema';
import { Comment, CommentSchema } from '../schemas/comment.schema';
import { Notification, NotificationSchema } from '../schemas/notification.schema';
import { Subscriber, SubscriberSchema } from '../schemas/subscriber.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Subscriber.name, schema: SubscriberSchema },
    ]),
    AuthModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule { }
