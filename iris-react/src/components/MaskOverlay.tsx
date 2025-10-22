import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import type { IrisClass, IrisConfig } from "../api/types";

type MaskDisplayMode = "final" | "user" | "errors";

interface MaskOverlayProps {
  config: IrisConfig;
  maskData: Uint8Array | null;
  maskShape: [number, number] | null;
  mode: MaskDisplayMode;
  showMask: boolean;
  variant?: "preview" | "overlay";
  className?: string;
  style?: CSSProperties;
}

function MaskOverlay({ config, maskData, maskShape, mode, showMask, variant = "preview", className, style }: MaskOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const classColours = useMemo(() => {
    const colours = new Map<number, [number, number, number, number]>();
    (config.classes ?? []).forEach((klass: IrisClass, index) => {
      const [r, g, b, a = 255] = klass.colour ?? [0, 0, 0, 255];
      colours.set(index, [r, g, b, a]);
    });
    return colours;
  }, [config.classes]);

  useEffect(() => {
    if (!showMask) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    if (!maskData || !maskShape || maskShape[0] <= 0 || maskShape[1] <= 0) {
      return;
    }

    if (mode !== "final") {
      return;
    }

    const [width, height] = maskShape;
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const imageData = ctx.createImageData(width, height);
    for (let i = 0; i < maskData.length; i++) {
      const classIndex = maskData[i];
      const colour = classColours.get(classIndex) ?? [0, 0, 0, 0];
      const pixelIndex = i * 4;
      imageData.data[pixelIndex] = colour[0];
      imageData.data[pixelIndex + 1] = colour[1];
      imageData.data[pixelIndex + 2] = colour[2];
      imageData.data[pixelIndex + 3] = colour[3];
    }

    ctx.putImageData(imageData, 0, 0);
  }, [classColours, maskData, maskShape, mode, showMask]);

  if (!maskData || !maskShape) {
    if (variant === "overlay") {
      return null;
    }
    return (
      <div className="mask-overlay__empty">
        No mask available yet. Draw a mask and save it to preview results here.
      </div>
    );
  }

  if (mode !== "final") {
    if (variant === "overlay") {
      return null;
    }
    return (
      <div className="mask-overlay__empty">
        Mask mode <strong>{mode}</strong> is not yet implemented in the React port.
      </div>
    );
  }

  const canvasElement = <canvas ref={canvasRef} className={className ?? "mask-overlay__canvas"} style={style} />;

  if (variant === "overlay") {
    return canvasElement;
  }

  return <div className="mask-overlay">{canvasElement}</div>;
}

export default MaskOverlay;
