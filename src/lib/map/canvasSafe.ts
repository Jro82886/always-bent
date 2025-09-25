export function isCanvasReadable(canvas: HTMLCanvasElement) {
  try {
    // a tiny read that throws if tainted
    canvas.getContext('2d')!.getImageData(0, 0, 1, 1);
    return true;
  } catch {
    return false;
  }
}
