import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateAuctionDto } from "./dto/create-auction.dto";
import { UpdateAuctionDto } from "./dto/update-auction.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { AuctionStatus } from "@prisma/client";

@Injectable()
export class AuctionService {
  constructor(private prisma: PrismaService) {}

  async create(
    createAuctionDto: CreateAuctionDto,
    user: { id: number; isVerified: boolean; isAdmin: boolean },
  ) {
    const { artworkId, startingPrice, minimumIncrement, startTime, endTime } =
      createAuctionDto;

    if (!user.isAdmin) {
      throw new BadRequestException(
        "El usuario no es administrador y no puede crear una subasta",
      );
    }

    // 1. Validar artwork existente
    const artwork = await this.prisma.artwork.findUnique({
      where: { id: artworkId },
    });

    if (!artwork) {
      throw new NotFoundException("Obra no encontrada");
    }

    // 2. Validar que no tenga ya una subasta
    const existingAuction = await this.prisma.auction.findUnique({
      where: { artworkId },
    });

    if (existingAuction) {
      throw new BadRequestException("Esta obra ya tiene una subasta");
    }

    // 3. Validar fechas
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      throw new BadRequestException(
        "La hora de finalización debe ser posterior a la hora de inicio",
      );
    }

    // 4. Determinar estado inicial
    const now = new Date();

    let status: AuctionStatus = AuctionStatus.SCHEDULED;

    if (start <= now && end > now) {
      status = AuctionStatus.ACTIVE;
    }

    if (end <= now) {
      status = AuctionStatus.FINISHED;
    }

    // 5. Crear auction
    return this.prisma.auction.create({
      data: {
        artworkId,
        startingPrice,
        minimumIncrement,
        startTime: start,
        endTime: end,
        status,
      },
      include: {
        artwork: true,
        currentBid: true,
      },
    });
  }

  private calculateStatus(auction: {
    startTime: Date;
    endTime: Date;
  }): AuctionStatus {
    const now = new Date();

    if (auction.endTime <= now) return AuctionStatus.FINISHED;
    if (auction.startTime <= now) return AuctionStatus.ACTIVE;
    return AuctionStatus.SCHEDULED;
  }

  private async syncAuctionStatus(auction: {
    id: number;
    startTime: Date;
    endTime: Date;
    status: AuctionStatus;
  }) {
    // admin pripority
    if (auction.status === AuctionStatus.FINISHED) {
      return auction;
    }

    const computedStatus = this.calculateStatus(auction);

    // only update if status has changed
    if (auction.status !== computedStatus) {
      return this.prisma.auction.update({
        where: { id: auction.id },
        data: { status: computedStatus },
        include: {
          artwork: true,
          currentBid: true,
        },
      });
    }

    return auction;
  }

  async findAll() {
    const auctions = await this.prisma.auction.findMany({
      include: {
        artwork: true,
        currentBid: true,
        bids: true,
      },
    });

    return Promise.all(auctions.map((a) => this.syncAuctionStatus(a)));
  }

  async findOne(id: number) {
    const auction = await this.prisma.auction.findUnique({
      where: { id },
      include: {
        artwork: true,
        currentBid: true,
        bids: true,
      },
    });

    if (!auction) {
      throw new NotFoundException("Subasta no encontrada");
    }

    return this.syncAuctionStatus(auction);
  }

  async update(id: number, updateAuctionDto: UpdateAuctionDto) {
    const auction = await this.prisma.auction.findUnique({
      where: { id },
      include: { bids: true },
    });

    if (!auction) {
      throw new NotFoundException("Subasta no encontrada");
    }

    if (auction.status === "FINISHED") {
      throw new BadRequestException(
        "No se puede actualizar una subasta finalizada",
      );
    }

    const { artworkId, startTime, endTime } = updateAuctionDto;

    if (startTime || endTime) {
      const start = startTime ? new Date(startTime) : auction.startTime;
      const end = endTime ? new Date(endTime) : auction.endTime;

      if (end <= start) {
        throw new BadRequestException(
          "La hora de finalización debe ser posterior a la hora de inicio",
        );
      }
    }

    if (artworkId && artworkId !== auction.artworkId) {
      const artwork = await this.prisma.artwork.findUnique({
        where: { id: artworkId },
      });

      if (!artwork) {
        throw new NotFoundException("Obra no encontrada");
      }

      const existingAuction = await this.prisma.auction.findUnique({
        where: { artworkId },
      });

      if (existingAuction) {
        throw new BadRequestException("Esta obra ya tiene una subasta");
      }
    }

    return this.prisma.auction.update({
      where: { id },
      data: {
        ...updateAuctionDto,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
      },
      include: {
        artwork: true,
        currentBid: true,
      },
    });
  }

  async remove(id: number, user: { id: number; isAdmin: boolean }) {
    if (!user.isAdmin) {
      throw new BadRequestException(
        "El usuario no es administrador y no puede eliminar una subasta",
      );
    }

    const auction = await this.prisma.auction.findUnique({
      where: { id },
      include: { bids: true },
    });

    if (!auction) {
      throw new NotFoundException("Subasta no encontrada");
    }

    return this.prisma.$transaction(async (prisma) => {
      // 1. Eliminar todas las ofertas relacionadas
      await prisma.bid.deleteMany({
        where: { auctionId: id },
      });

      // 2. Eliminar la subasta
      const deletedAuction = await prisma.auction.delete({
        where: { id },
      });

      return deletedAuction;
    });
  }

  async finish(id: number, user: { id: number; isAdmin: boolean }) {
    if (!user.isAdmin) {
      throw new BadRequestException(
        "El usuario no es administrador y no puede finalizar una subasta",
      );
    }

    const auction = await this.prisma.auction.findUnique({
      where: { id },
    });

    if (!auction) {
      throw new NotFoundException("Subasta no encontrada");
    }

    if (auction.status === AuctionStatus.FINISHED) {
      throw new BadRequestException("La subasta ya está finalizada");
    }

    return this.prisma.auction.update({
      where: { id },
      data: {
        status: AuctionStatus.FINISHED,
      },
      include: {
        artwork: true,
        currentBid: true,
      },
    });
  }
}
