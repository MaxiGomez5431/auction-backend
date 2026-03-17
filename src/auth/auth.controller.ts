import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtGuard } from "./jwt/jwt.guard";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password, body.username);
  }

  @Post("login")
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Get("verify-token")
  @UseGuards(JwtGuard) // Protege la ruta con JWT
  verifyToken(@Req() req: Request) {
    // Si llegas aquí, el token es válido
    return {
      valid: true,
      message: "Valid token",
      user: req.user, // Información del usuario del token
      timestamp: new Date().toISOString(),
    };
  }
}
