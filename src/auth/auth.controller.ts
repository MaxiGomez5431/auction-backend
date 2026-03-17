import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { AuthenticatedRequest, JwtGuard } from "./jwt/jwt.guard";

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
  @UseGuards(JwtGuard)
  verifyToken(@Req() req: Request) {
    return {
      valid: true,
      message: "Valid token",
      user: req.user,
      timestamp: new Date().toISOString(),
    };
  }

  @Post("admin/verify-user/:id")
  @UseGuards(JwtGuard)
  async verifyUser(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.authService.verifyUserById(parseInt(id), {
      id: parseInt(req.user.id),
      isAdmin: req.user.isAdmin,
    });
  }
}
