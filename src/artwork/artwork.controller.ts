import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ArtworkService } from "./artwork.service";
import { CreateArtworkDto } from "./dto/create-artwork.dto";
import { UpdateArtworkDto } from "./dto/update-artwork.dto";
import { AuthenticatedRequest, JwtGuard } from "src/auth/jwt/jwt.guard";

@Controller("artwork")
export class ArtworkController {
  constructor(private readonly artworkService: ArtworkService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(
    @Body() createArtworkDto: CreateArtworkDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.artworkService.create(createArtworkDto, {
      id: req.user.id,
      isVerified: req.user.isVerified,
      isAdmin: req.user.isAdmin,
    });
  }

  @Get()
  findAll() {
    return this.artworkService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.artworkService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateArtworkDto: UpdateArtworkDto) {
    return this.artworkService.update(+id, updateArtworkDto);
  }

  @Delete(":id")
  @UseGuards(JwtGuard)
  remove(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.artworkService.remove(+id, {
      id: req.user.id,
      isAdmin: req.user.isAdmin,
    });
  }
}
