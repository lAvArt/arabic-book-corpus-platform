interface ReviewBboxOverlayProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ReviewBboxOverlay({ x, y, width, height }: ReviewBboxOverlayProps) {
  return (
    <div
      className="bbox"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`
      }}
    />
  );
}
