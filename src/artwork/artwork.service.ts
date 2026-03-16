import { Injectable } from '@nestjs/common';
import { CreateArtworkDto } from './dto/create-artwork.dto';
import { UpdateArtworkDto } from './dto/update-artwork.dto';

@Injectable()
export class ArtworkService {
  create(createArtworkDto: CreateArtworkDto) {
    return 'This action adds a new artwork';
  }

  findAll() {
    return `This action returns all artwork`;
  }

  findOne(id: number) {
    return `This action returns a #${id} artwork`;
  }

  update(id: number, updateArtworkDto: UpdateArtworkDto) {
    return `This action updates a #${id} artwork`;
  }

  remove(id: number) {
    return `This action removes a #${id} artwork`;
  }
}
