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

  create(
    createArtworkDto: CreateArtworkDto,
    user: { id: number; isVerified: boolean; isAdmin: boolean },
  ) {
    if (!user.isAdmin) {
      throw new BadRequestException(
        "El usuario no es administrador y no puede crear una obra de arte",
      );
    }

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
      throw new NotFoundException("Obra no encontrada");
    }

    return artwork;
  }

  async update(id: number, updateArtworkDto: UpdateArtworkDto) {
    const artwork = await this.prisma.artwork.findUnique({
      where: { id },
    });

    if (!artwork) {
      throw new NotFoundException("Obra no encontrada");
    }

    return this.prisma.artwork.update({
      where: { id },
      data: updateArtworkDto,
    });
  }

  async remove(id: number, user: { id: number; isAdmin: boolean }) {
    if (!user.isAdmin) {
      throw new BadRequestException(
        "El usuario no es administrador y no puede eliminar una obra de arte",
      );
    }

    const artwork = await this.prisma.artwork.findUnique({
      where: { id },
      include: {
        auction: true,
      },
    });

    if (!artwork) {
      throw new NotFoundException("Obra no encontrada");
    }

    if (artwork.auction) {
      throw new BadRequestException(
        "No se puede eliminar la obra de arte porque tiene una subasta asociada",
      );
    }

    return this.prisma.artwork.delete({
      where: { id },
    });
  }
}
