import { PartialType } from '@nestjs/swagger';
import { CreateContentDto } from './create-content.dto';

/** Semua field opsional; aturan validasinya diwarisi dari CreateContentDto. */
export class UpdateContentDto extends PartialType(CreateContentDto) {}
