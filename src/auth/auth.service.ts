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
      throw new UnauthorizedException("El email ya está registrado");
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
      throw new UnauthorizedException("Credenciales inválidas");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException("Credenciales inválidas");
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
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isVerified: user.isVerified,
        isAdmin: user.isAdmin,
      },
    };
  }

  async verifyUserById(
    userId: number,
    isVerified: boolean,
    authenticatedUser: { id: number; isAdmin: boolean },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    if (!authenticatedUser || !authenticatedUser.isAdmin) {
      throw new UnauthorizedException(
        "Solo los administradores pueden verificar usuarios",
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isVerified },
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
      message: isVerified
        ? "Usuario verificado exitosamente"
        : "Usuario desverificado exitosamente",
      user: updatedUser,
    };
  }

  async getAllUsers(requestingUser: { id: number; isAdmin: boolean }) {
    if (!requestingUser || !requestingUser.isAdmin) {
      throw new UnauthorizedException(
        "Solo los administradores pueden ver todos los usuarios",
      );
    }

    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        isVerified: true,
        isAdmin: true,
        username: true,
        createdAt: true,
      },
    });
  }

  async deleteUserById(
    userId: number,
    authenticatedUser: { id: number; isAdmin: boolean },
  ) {
    // Verificaciones de seguridad
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    if (user.id === authenticatedUser.id) {
      throw new UnauthorizedException("No puedes eliminar tu propia cuenta");
    }

    if (!authenticatedUser || !authenticatedUser.isAdmin) {
      throw new UnauthorizedException(
        "Solo los administradores pueden eliminar usuarios",
      );
    }

    // Usar una transacción para manejar todo atómicamente
    return this.prisma.$transaction(async (prisma) => {
      // 1. Encontrar todas las subastas donde este usuario tiene la currentBid
      const auctionsWithUserAsCurrentBid = await prisma.auction.findMany({
        where: {
          currentBid: {
            userId: userId,
          },
        },
        include: {
          bids: {
            where: {
              userId: {
                not: userId, // Excluir las bids del usuario a eliminar
              },
            },
            orderBy: {
              amount: "desc",
            },
            take: 1, // Solo la más alta de los otros usuarios
          },
        },
      });

      // 2. Actualizar cada subasta afectada
      for (const auction of auctionsWithUserAsCurrentBid) {
        if (auction.bids.length > 0) {
          // Hay otra bid, actualizar currentBid a la siguiente más alta
          const nextHighestBid = auction.bids[0];
          await prisma.auction.update({
            where: { id: auction.id },
            data: {
              currentBidId: nextHighestBid.id,
            },
          });
        } else {
          // No hay otras bids, establecer currentBid a null
          await prisma.auction.update({
            where: { id: auction.id },
            data: {
              currentBidId: null,
            },
          });
        }
      }

      // 3. Eliminar todas las bids del usuario
      await prisma.bid.deleteMany({
        where: { userId: userId },
      });

      // 4. Finalmente, eliminar el usuario
      const deletedUser = await prisma.user.delete({
        where: { id: userId },
      });

      return {
        message: "Usuario eliminado correctamente",
        user: deletedUser,
        updatedAuctions: auctionsWithUserAsCurrentBid.length,
      };
    });
  }
}
