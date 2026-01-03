import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFAQDto {
    @IsEnum(['shipping', 'payment', 'return', 'loyalty', 'account', 'general'])
    category: string;

    @IsString()
    question: string;

    @IsString()
    answer: string;

    @IsNumber()
    @IsOptional()
    order?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateFAQDto extends CreateFAQDto { }
