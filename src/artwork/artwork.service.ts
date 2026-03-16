import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateArtworkDto } from "./dto/create-artwork.dto";
import { UpdateArtworkDto } from "./dto/update-artwork.dto";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ArtworkService {
  constructor(private prisma: PrismaService) {}

  create(createArtworkDto: CreateArtworkDto) {
    return this.prisma.artwork.create({
      data: createArtworkDto,
    });
  }

  findAll() {
    return this.prisma.artwork.findMany({
      include: {
        auction: true,
      },
    });
  }

  async findOne(id: number) {
    const artwork = await this.prisma.artwork.findUnique({
      where: { id },
      include: {
        auction: true,
      },
    });

    if (!artwork) {
      throw new NotFoundException("Artwork not found");
    }

    return artwork;
  }

  async update(id: number, updateArtworkDto: UpdateArtworkDto) {
    const artwork = await this.prisma.artwork.findUnique({
      where: { id },
    });

    if (!artwork) {
      throw new NotFoundException("Artwork not found");
    }

    return this.prisma.artwork.update({
      where: { id },
      data: updateArtworkDto,
    });
  }

  async remove(id: number) {
    const artwork = await this.prisma.artwork.findUnique({
      where: { id },
      include: {
        auction: true,
      },
    });

    if (!artwork) {
      throw new NotFoundException("Artwork not found");
    }

    if (artwork.auction) {
      throw new BadRequestException(
        "Cannot delete artwork because it has an auction associated",
      );
    }

    return this.prisma.artwork.delete({
      where: { id },
    });
  }
}
