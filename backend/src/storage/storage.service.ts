import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'path';

@Injectable()
export class StorageService {
  private readonly root: string;

  constructor(config: ConfigService) {
    this.root = resolve(config.get<string>('STORAGE_ROOT', './storage'));
  }

  async put(key: string, content: Buffer): Promise<void> {
    const path = this.resolveKey(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, { flag: 'wx' });
  }

  async read(key: string): Promise<Buffer> {
    return readFile(this.resolveKey(key));
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolveKey(key), { force: true });
  }

  path(key: string): string {
    return this.resolveKey(key);
  }

  private resolveKey(key: string): string {
    if (!key || isAbsolute(key) || key.includes('\0')) throw new Error('Invalid storage key');
    const target = resolve(this.root, key);
    const rel = relative(this.root, target);
    if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Storage key escapes root');
    return target;
  }
}
