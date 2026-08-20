export interface RenderRequest {
  inputs: string[];
  output: string;
  duration: number;
  fps: number;
  aspectRatio: string;
  onProgress: (progress: number) => void;
  shouldCancel: () => Promise<boolean>;
}

export interface VideoProvider {
  readonly name: string;
  render(request: RenderRequest): Promise<void>;
}

export const VIDEO_PROVIDER = Symbol('VIDEO_PROVIDER');
