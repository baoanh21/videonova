import { NotFoundException } from '@nestjs/common';
import { VideosService } from '../src/videos/videos.service';

function service(prismaOverrides: any = {}) {
  const prisma = { video: { findFirst: jest.fn(), findUnique: jest.fn() }, ...prismaOverrides };
  const storage = { put: jest.fn(), delete: jest.fn(), read: jest.fn() };
  const config = { get: jest.fn((_key: string, fallback: unknown) => fallback) };
  const queue = { add: jest.fn(), getJob: jest.fn() };
  return {
    videos: new VideosService(prisma as never, storage as never, config as never, queue as never),
    prisma,
    storage,
    queue,
  };
}

describe('VideosService ownership and job creation', () => {
  it('uses the authenticated user id in detail lookup and hides foreign videos', async () => {
    const { videos, prisma } = service();
    prisma.video.findFirst.mockResolvedValue(null);
    await expect(videos.detail('owner-id', 'video-id')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.video.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'owner-id' }) }),
    );
  });

  it('stores a validated image, atomically creates job/charge, and enqueues once', async () => {
    const created = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      userId: 'user-id',
      title: 'motion',
      prompt: 'motion',
      model: 'local-ffmpeg',
      provider: 'local-ffmpeg',
      style: 'cinematic',
      duration: 1,
      fps: 24,
      aspectRatio: '16:9',
      creditCost: 1,
      status: 'QUEUED',
      progress: 0,
      errorMessage: null,
      createdAt: new Date(),
      completedAt: null,
      assets: [],
    };
    const tx = {
      user: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ creditBalance: 9 }),
      },
      video: { create: jest.fn().mockImplementation(({ data }) => ({ ...created, id: data.id })) },
      creditTransaction: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      video: { findUnique: jest.fn().mockResolvedValue(created) },
      videoJob: { update: jest.fn().mockResolvedValue({}) },
      $transaction: jest.fn((callback) => callback(tx)),
    };
    const { videos, storage, queue } = service(prisma);
    queue.add.mockResolvedValue({ id: 'queue-job' });
    const file = {
      fieldname: 'image',
      originalname: 'fake.exe',
      size: 10,
      buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0]),
    } as Express.Multer.File;
    const result = await videos.create(
      'user-id',
      {
        prompt: 'motion',
        model: 'local-ffmpeg',
        duration: 1,
        aspect_ratio: '16:9',
        style: 'cinematic',
        enhance_quality: false,
        fps: 24,
      },
      [file],
    );
    expect(result.status).toBe('QUEUED');
    expect(storage.put).toHaveBeenCalledTimes(1);
    expect(tx.video.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ job: { create: { status: 'QUEUED' } } }),
      }),
    );
    expect(queue.add).toHaveBeenCalledTimes(1);
  });
});
