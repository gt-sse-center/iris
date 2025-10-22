import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";
import type { IrisConfig, IrisView } from "../api/types";
import MaskOverlay from "./MaskOverlay";
import { buildBackendUrl } from "../api/base";

type MaskDisplayMode = "final" | "user" | "errors";

type ToolType = "move" | "draw" | "eraser";

type FilterState = {
  contrast: boolean;
  invert: boolean;
  brightness: number;
  saturation: number;
};

interface CanvasViewProps {
  config: IrisConfig;
  view: IrisView;
  imageId: string;
  width: number;
  height: number;
  filters: FilterState;
  maskData: Uint8Array | null;
  userMask: Uint8Array | null;
  maskShape: [number, number] | null;
  maskArea: [number, number, number, number];
  showMask: boolean;
  maskDisplay: MaskDisplayMode;
  tool: ToolType;
  activeClassIndex: number;
  onMaskEdit?: (mutator: (mask: Uint8Array, userMask: Uint8Array) => boolean, options?: { pushHistory?: boolean }) => void;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 8;
const BRUSH_SIZE = 8;
const ERASER_SIZE = 10;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function CanvasView({
  config,
  view,
  imageId,
  width,
  height,
  filters,
  maskData,
  maskShape,
  showMask,
  maskDisplay,
  tool
}: CanvasViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [imageSrc, setImageSrc] = useState(() => buildBackendUrl(`/image/${encodeURIComponent(imageId)}/${encodeURIComponent(view.name)}`));
  const prevOffsetRef = useRef(offset);
  const prevScaleRef = useRef(scale);

  useEffect(() => {
    setImageSrc(buildBackendUrl(`/image/${encodeURIComponent(imageId)}/${encodeURIComponent(view.name)}?ts=${Date.now()}`));
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [imageId, view.name]);

  const filterString = useMemo(() => {
    const parts = [
      `brightness(${filters.brightness}%)`,
      `saturate(${filters.saturation}%)`
    ];

    if (filters.contrast) {
      parts.push("contrast(150%)");
    }
    if (filters.invert) {
      parts.push("invert(100%)");
    }
    return parts.join(" ");
  }, [filters]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (tool !== "move") {
      return;
    }
    event.preventDefault();
    const container = containerRef.current;
    if (!container) {
      return;
    }
    container.setPointerCapture(event.pointerId);
    panStart.current = {
      x: event.clientX - offset.x,
      y: event.clientY - offset.y
    };
    setIsPanning(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isPanning || tool !== "move" || !panStart.current) {
      return;
    }
    event.preventDefault();
    const nextOffset = {
      x: event.clientX - panStart.current.x,
      y: event.clientY - panStart.current.y
    };
    setOffset(nextOffset);
  };

  const endPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isPanning) {
      return;
    }
    setIsPanning(false);
    panStart.current = null;
    const container = containerRef.current;
    if (container?.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const rect = container.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    const delta = event.deltaY;
    const factor = delta > 0 ? 0.9 : 1.1;
    const prevScale = prevScaleRef.current;
    const nextScale = clamp(prevScale * factor, MIN_SCALE, MAX_SCALE);
    const scaleChange = nextScale / prevScale;

    setOffset((prev) => {
      const newOffset = {
        x: pointerX - (pointerX - prev.x) * scaleChange,
        y: pointerY - (pointerY - prev.y) * scaleChange
      };
      prevOffsetRef.current = newOffset;
      return newOffset;
    });
    setScale(nextScale);
    prevScaleRef.current = nextScale;
  };

  useEffect(() => {
    prevOffsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    prevScaleRef.current = scale;
  }, [scale]);

  const handleDoubleClick = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const cursor = useMemo(() => {
    if (tool === "move") {
      return isPanning ? "grabbing" : "grab";
    }
    if (tool === "eraser") {
      return "cell";
    }
    return "crosshair";
  }, [isPanning, tool]);

  return (
    <div
      ref={containerRef}
      className="canvas-view"
      style={{ width, height }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPan}
      onPointerLeave={endPan}
      onPointerCancel={endPan}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="canvas-view-inner"
        style={{
          width,
          height,
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          cursor
        }}
      >
        <img
          src={imageSrc}
          alt={view.name}
          className="canvas-view-image"
          draggable={false}
          style={{ filter: filterString }}
        />
        <MaskOverlay
          config={config}
          maskData={maskData}
          maskShape={maskShape}
          mode={maskDisplay}
          showMask={showMask}
          variant="overlay"
          className="canvas-view-mask"
          style={{ width: "100%", height: "100%", pointerEvents: "none" }}
        />
      </div>
    </div>
  );
}

export default CanvasView;
