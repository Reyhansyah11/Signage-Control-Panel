import { Prisma } from '@prisma/client';

/** Satu entri playlist beserta kontennya, siap dikirim ke dashboard atau device. */
export type PlaylistItemWithContent = Prisma.PlaylistItemGetPayload<{
  include: { content: true };
}>;
