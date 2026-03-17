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

  async create(createAuctionDto: CreateAuctionDto) {
    const { artworkId, startingPrice, minimumIncrement, startTime, endTime } =
      createAuctionDto;

    // 1. Validar artwork existente
    const artwork = await this.prisma.artwork.findUnique({
      where: { id: artworkId },
    });

    if (!artwork) {
      throw new NotFoundException("Artwork not found");
    }

    // 2. Validar que no tenga ya una subasta
    const existingAuction = await this.prisma.auction.findUnique({
      where: { artworkId },
    });

    if (existingAuction) {
      throw new BadRequestException("This artwork already has an auction");
    }

    // 3. Validar fechas
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      throw new BadRequestException("End time must be after start time");
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
      },
    });

    if (!auction) {
      throw new NotFoundException("Auction not found");
    }

    return this.syncAuctionStatus(auction);
  }

  async finishAuction(id: number) {
    const auction = await this.prisma.auction.findUnique({
      where: { id },
    });

    if (!auction) {
      throw new NotFoundException("Auction not found");
    }

    return this.prisma.auction.update({
      where: { id },
      data: {
        status: AuctionStatus.FINISHED,
      },
    });
  }

  async update(id: number, updateAuctionDto: UpdateAuctionDto) {
    const auction = await this.prisma.auction.findUnique({
      where: { id },
      include: { bids: true },
    });

    if (!auction) {
      throw new NotFoundException("Auction not found");
    }

    if (auction.status === "FINISHED") {
      throw new BadRequestException("Cannot update a finished auction");
    }

    const { artworkId, startTime, endTime } = updateAuctionDto;

    if (startTime || endTime) {
      const start = startTime ? new Date(startTime) : auction.startTime;
      const end = endTime ? new Date(endTime) : auction.endTime;

      if (end <= start) {
        throw new BadRequestException("End time must be after start time");
      }
    }

    if (artworkId && artworkId !== auction.artworkId) {
      const artwork = await this.prisma.artwork.findUnique({
        where: { id: artworkId },
      });

      if (!artwork) {
        throw new NotFoundException("Artwork not found");
      }

      const existingAuction = await this.prisma.auction.findUnique({
        where: { artworkId },
      });

      if (existingAuction) {
        throw new BadRequestException("This artwork already has an auction");
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

  async remove(id: number) {
    const auction = await this.prisma.auction.findUnique({
      where: { id },
      include: { bids: true },
    });

    if (!auction) {
      throw new NotFoundException("Auction not found");
    }

    if (auction.bids.length > 0) {
      throw new BadRequestException("Cannot delete auction with existing bids");
    }

    return this.prisma.auction.delete({
      where: { id },
    });
  }

  async finish(id: number) {
    const auction = await this.prisma.auction.findUnique({
      where: { id },
    });

    if (!auction) {
      throw new NotFoundException("Auction not found");
    }

    if (auction.status === AuctionStatus.FINISHED) {
      throw new BadRequestException("Auction is already finished");
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
