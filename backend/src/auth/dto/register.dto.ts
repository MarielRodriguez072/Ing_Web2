import { IsEmail, IsString, MinLength, Matches, IsIn } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[a-zA-Z])(?=.*[0-9])/, { message: 'La contraseña debe contener al menos una letra y un número' })
  password: string;

  @IsString()
  @IsIn(['cliente', 'asesor'])
  role: 'cliente' | 'asesor';
}
