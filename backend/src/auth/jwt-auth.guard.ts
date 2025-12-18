import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) throw new UnauthorizedException('Missing token');
    try {
      const secret = this.configService.get<string>('JWT_SECRET') || 'your_secret_key';
      const decoded = await this.jwtService.verifyAsync(token, { secret });
      req.user = { id: decoded.sub };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

