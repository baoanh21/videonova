import { BadRequestException } from '@nestjs/common';
import { validateImageBuffer } from '../src/common/files/image-validation';

describe('upload image validation', () => {
  it('detects actual PNG bytes independently of the extension', () => {
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0]);
    expect(validateImageBuffer(png)).toEqual({ mime: 'image/png', ext: 'png' });
  });

  it('rejects arbitrary content advertised as an image', () => {
    expect(() => validateImageBuffer(Buffer.from('not an image'))).toThrow(BadRequestException);
  });
});
