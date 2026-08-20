import { BadRequestException } from '@nestjs/common';

const signatures: Array<{ mime: string; ext: string; matches: (b: Buffer) => boolean }> = [
  {
    mime: 'image/jpeg',
    ext: 'jpg',
    matches: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: 'image/png',
    ext: 'png',
    matches: (b) =>
      b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  },
  {
    mime: 'image/webp',
    ext: 'webp',
    matches: (b) =>
      b.length >= 12 &&
      b.toString('ascii', 0, 4) === 'RIFF' &&
      b.toString('ascii', 8, 12) === 'WEBP',
  },
];

export function validateImageBuffer(buffer: Buffer): { mime: string; ext: string } {
  const type = signatures.find((item) => item.matches(buffer));
  if (!type) throw new BadRequestException('Only valid JPEG, PNG, or WebP images are accepted');
  return { mime: type.mime, ext: type.ext };
}
