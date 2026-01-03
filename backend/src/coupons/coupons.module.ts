import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Coupon, CouponSchema } from '../schemas/coupon.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Subscriber, SubscriberSchema } from '../schemas/subscriber.schema';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { AuthModule } from '../auth/auth.module';
import { SendEmailService } from '../common/send-email.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Coupon.name, schema: CouponSchema },
      { name: Subscriber.name, schema: SubscriberSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
  ],
  controllers: [CouponsController],
  providers: [CouponsService, SendEmailService],
})
export class CouponsModule { }
