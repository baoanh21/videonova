import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import { RenderRequest, VideoProvider } from './video-provider';

const dimensions: Record<string, [number, number]> = {
  '16:9': [1280, 720],
  '9:16': [720, 1280],
  '1:1': [1080, 1080],
  '4:3': [960, 720],
  '3:4': [720, 960],
};

@Injectable()
export class LocalFfmpegProvider implements VideoProvider {
  readonly name = 'local-ffmpeg';
  private readonly executable: string;

  constructor(config: ConfigService) {
    this.executable = config.get<string>('FFMPEG_PATH', 'ffmpeg');
  }

  async render(request: RenderRequest): Promise<void> {
    if (!request.inputs.length) throw new Error('No input images');
    const [width, height] = dimensions[request.aspectRatio] ?? dimensions['16:9'];
    const segmentDuration = request.duration / request.inputs.length;
    const inputArgs = request.inputs.flatMap((input) => ['-loop', '1', '-i', input]);
    const filters = request.inputs.map((_, index) => {
      const fadeOut = Math.max(0, segmentDuration - 0.25).toFixed(3);
      return `[${index}:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1,fps=${request.fps},trim=duration=${segmentDuration.toFixed(3)},setpts=PTS-STARTPTS,fade=t=in:st=0:d=0.25,fade=t=out:st=${fadeOut}:d=0.25[v${index}]`;
    });
    const concatInputs = request.inputs.map((_, index) => `[v${index}]`).join('');
    const filterComplex = `${filters.join(';')};${concatInputs}concat=n=${request.inputs.length}:v=1:a=0[outv]`;
    const args = [
      '-hide_banner',
      '-y',
      ...inputArgs,
      '-filter_complex',
      filterComplex,
      '-map',
      '[outv]',
      '-t',
      String(request.duration),
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '23',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-an',
      request.output,
    ];
    await mkdir(dirname(request.output), { recursive: true });

    await new Promise<void>((resolve, reject) => {
      const process = spawn(this.executable, args, { windowsHide: true, shell: false });
      let stderr = '';
      let canceled = false;
      const cancelTimer = setInterval(() => {
        void request.shouldCancel().then((shouldCancel) => {
          if (shouldCancel && !process.killed) {
            canceled = true;
            process.kill('SIGTERM');
          }
        });
      }, 500);

      process.stderr.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        stderr = (stderr + text).slice(-8000);
        const matches = [...text.matchAll(/time=(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/g)];
        const match = matches.at(-1);
        if (match) {
          const seconds = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
          request.onProgress(
            Math.min(99, Math.max(1, Math.round((seconds / request.duration) * 100))),
          );
        }
      });
      process.on('error', (error) => {
        clearInterval(cancelTimer);
        reject(new Error(`Unable to start FFmpeg: ${error.message}`));
      });
      process.on('close', (code) => {
        clearInterval(cancelTimer);
        if (canceled) return reject(new Error('VIDEO_CANCELED'));
        if (code === 0) return resolve();
        reject(new Error(`FFmpeg exited with code ${String(code)}: ${stderr.slice(-2000)}`));
      });
    });
  }
}
