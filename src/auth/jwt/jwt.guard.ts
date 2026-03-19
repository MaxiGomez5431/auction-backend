import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

interface JwtPayload {
  sub: string;
  email: string;
  username: string | null;
  isVerified: boolean;
  isAdmin: boolean;
}

// 2. Actualizar la interfaz de la request autenticada
export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    username: string | null;
    isVerified: boolean;
    isAdmin: boolean;
  };
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // 1. Obtener el header de autorización
    const authHeader = request.headers.authorization;

    // 2. Verificar que existe el header
    if (!authHeader) {
      throw new UnauthorizedException("No proveyó token de autenticación");
    }

    // 3. Verificar el formato (debe ser "Bearer token")
    const [type, token] = authHeader.split(" ");
    if (type !== "Bearer" || !token) {
      throw new UnauthorizedException(
        "Formato de token inválido. Use: Bearer <token>",
      );
    }

    try {
      // 4. Verificar y decodificar el token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      // 5. Adjuntar el usuario al request para usarlo después
      request.user = {
        id: parseInt(payload.sub),
        email: payload.email,
        username: payload.username,
        isVerified: payload.isVerified,
        isAdmin: payload.isAdmin,
      };

      return true;
    } catch (error: any) {
      // 6. Manejar diferentes tipos de error
      if (error instanceof Error && error.name === "TokenExpiredError") {
        throw new UnauthorizedException("Token expirado");
      }
      if (error instanceof Error && error.name === "JsonWebTokenError") {
        throw new UnauthorizedException("Token no valido");
      }
      throw new UnauthorizedException("Error al verificar el token");
    }
  }
}
