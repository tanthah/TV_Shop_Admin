import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FaqCategoriesController } from './faq-categories.controller';
import { FaqCategoriesService } from './faq-categories.service';
import { FAQCategory, FAQCategorySchema } from '../schemas/faq-category.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: FAQCategory.name, schema: FAQCategorySchema }]),
    ],
    controllers: [FaqCategoriesController],
    providers: [FaqCategoriesService],
})
export class FaqCategoriesModule { }
