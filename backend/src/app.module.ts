import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RegisterModule } from './register/register.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { CommentsModule } from './comments/comments.module';
import { CouponsModule } from './coupons/coupons.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './settings/settings.module';
import { CategoriesModule } from './categories/categories.module';
import { FaqsModule } from './faqs/faqs.module';
import { ChatModule } from './chat/chat.module';
import { FaqCategoriesModule } from './faq-categories/faq-categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/UTE_Shop'),
    AuthModule,
    RegisterModule,
    OrdersModule,
    ProductsModule,
    UsersModule,
    CommentsModule,
    CouponsModule,
    NotificationsModule,
    SettingsModule,
    CategoriesModule,
    FaqsModule,
    ChatModule,
    FaqCategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

