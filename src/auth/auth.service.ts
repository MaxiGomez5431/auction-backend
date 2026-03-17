import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, username?: string) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new UnauthorizedException("Email already exists");
    }

    return this.prisma.user.create({
      data: {
        email,
        username: username,
        password: hashedPassword,
      },
    });
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async verifyUserById(
    userId: number,
    authenticatedUser: { id: number; isAdmin: boolean },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!authenticatedUser || !authenticatedUser.isAdmin) {
      throw new UnauthorizedException("Only admins can verify users");
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
      select: {
        id: true,
        email: true,
        username: true,
        isVerified: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    return {
      message: "User verified successfully",
      user: updatedUser,
    };
  }
}
