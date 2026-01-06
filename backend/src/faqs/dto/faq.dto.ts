import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFAQDto {
    @IsNotEmpty()
    @IsString()
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
