import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  username!: string;

  @ApiProperty({ example: 'password-admin', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  password!: string;
}
