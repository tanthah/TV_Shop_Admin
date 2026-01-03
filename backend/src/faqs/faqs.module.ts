import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FaqsController } from './faqs.controller';
import { FaqsService } from './faqs.service';
import { FAQ, FAQSchema } from '../schemas/faq.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: FAQ.name, schema: FAQSchema }])
    ],
    controllers: [FaqsController],
    providers: [FaqsService],
})
export class FaqsModule { }
