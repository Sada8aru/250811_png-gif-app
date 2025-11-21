declare module "gif.js" {
  type GIFEvent = "finished" | "progress" | "error";

  type GIFOptions = {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    repeat?: number;
    workerScript?: string;
  };

  type GIFAddFrameOptions = {
    delay?: number;
    copy?: boolean;
  };

  export default class GIF {
    constructor(options?: GIFOptions);
    addFrame(image: CanvasImageSource | OffscreenCanvas, options?: GIFAddFrameOptions): void;
    on(event: "finished", cb: (blob: Blob) => void): void;
    on(event: "progress", cb: (progress: number) => void): void;
    on(event: "error", cb: (error: Error) => void): void;
    render(): void;
  }
}
