import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { CreateBidDto } from "./dto/create-bid.dto";
import { PrismaService } from "src/prisma/prisma.service";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    isVerified: boolean;
    isAdmin: boolean;
  };
}

@Injectable()
export class BidService {
  constructor(private prisma: PrismaService) {}

  async create(createBidDto: CreateBidDto, req: AuthenticatedRequest) {
    // 1. Verifies that the user is authenticated
    if (!req.user) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    // 2. Verifies that the user is verified
    if (!req.user.isVerified) {
      throw new ForbiddenException(
        "Usuario no verificado. No puede realizar ofertas.",
      );
    }

    // 3. Buscar la subasta incluyendo la oferta actual (si existe)
    const auction = await this.prisma.auction.findUnique({
      where: { id: createBidDto.auctionId },
      include: {
        artwork: true,
        currentBid: true, // ← Incluimos la oferta actual directamente
      },
    });

    // 4. Verificar que la subasta existe
    if (!auction) {
      throw new NotFoundException(
        `Subasta con ID ${createBidDto.auctionId} no encontrada`,
      );
    }

    // 5. Verificar que la subasta está activa
    if (auction.status !== "ACTIVE") {
      throw new BadRequestException(
        `La subasta no está activa. Estado actual: ${auction.status}`,
      );
    }

    // 7. Determinar el monto actual y el incremento mínimo
    const currentHighestBid =
      auction.currentBid?.amount || auction.startingPrice;
    const minIncrement = auction.minimumIncrement;

    // 8. Calcular el monto mínimo permitido
    const minimumAllowedAmount = currentHighestBid + minIncrement;

    // 9. Verificar que el monto de la oferta supera el mínimo requerido
    if (createBidDto.amount < minimumAllowedAmount) {
      throw new BadRequestException(
        `La puja debe ser al menos ${minimumAllowedAmount} ` +
          `(puja actual: ${currentHighestBid} + incremento mínimo: ${minIncrement})`,
      );
    }

    // 11. Crear la oferta en una transacción para asegurar consistencia
    const result = await this.prisma.$transaction(async (prisma) => {
      // Crear la nueva oferta
      const newBid = await prisma.bid.create({
        data: {
          amount: createBidDto.amount,
          auctionId: createBidDto.auctionId,
          userId: parseInt(req.user!.id),
        },
      });

      // Actualizar la subasta con la nueva oferta como currentBid
      const updatedAuction = await prisma.auction.update({
        where: { id: createBidDto.auctionId },
        data: {
          currentBidId: newBid.id,
        },
        include: {
          currentBid: true,
        },
      });

      return { newBid, updatedAuction };
    });

    // 12. Devolver la oferta creada con información adicional
    return {
      success: true,
      message: "Puja realizada exitosamente",
      bid: {
        id: result.newBid.id,
        amount: result.newBid.amount,
        auctionId: result.newBid.auctionId,
        userId: result.newBid.userId,
        createdAt: result.newBid.createdAt,
      },
      auction: {
        id: auction.id,
        artworkTitle: auction.artwork.title,
        currentPrice: result.newBid.amount,
        nextMinimumBid: result.newBid.amount + minIncrement,
        currentBidId: result.updatedAuction.currentBidId,
      },
    };
  }
}
