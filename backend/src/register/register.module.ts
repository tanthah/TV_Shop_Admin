import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RegisterController } from './register.controller';
import { RegisterService } from './register.service';
import { User, UserSchema } from '../schemas/user.schema';
import { SendEmailService } from '../common/send-email.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [RegisterController],
  providers: [RegisterService, SendEmailService],
})
export class RegisterModule {}
