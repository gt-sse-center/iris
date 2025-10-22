import { useMemo, useState } from "react";
import type { IrisConfig, IrisView } from "../api/types";
import CanvasView from "./CanvasView";
import useWindowSize from "../hooks/useWindowSize";

type MaskDisplayMode = "final" | "user" | "errors";
type ToolType = "move" | "draw" | "eraser";

type FilterState = {
  contrast: boolean;
  invert: boolean;
  brightness: number;
  saturation: number;
};

interface CanvasWorkspaceProps {
  config: IrisConfig;
  imageId: string;
  maskShape: [number, number] | null;
  maskArea: [number, number, number, number];
  maskData: Uint8Array | null;
  userMask: Uint8Array | null;
  showMask: boolean;
  maskDisplay: MaskDisplayMode;
  tool: ToolType;
  filters: FilterState;
  activeClassIndex: number;
  onMaskEdit?: (mutator: (mask: Uint8Array, user: Uint8Array) => boolean, options?: { pushHistory?: boolean }) => void;
}

function CanvasWorkspace({
  config,
  imageId,
  maskShape,
  maskArea,
  maskData,
  userMask,
  showMask,
  maskDisplay,
  tool,
  filters,
  activeClassIndex,
  onMaskEdit
}: CanvasWorkspaceProps) {
  const [currentGroup, setCurrentGroup] = useState(() => {
    const groups = Object.keys(config.view_groups ?? {});
    return groups.length ? groups[0] : "default";
  });

  const { width: windowWidth, height: windowHeight } = useWindowSize();

  const views = useMemo(() => {
    const groupViews = config.view_groups?.[currentGroup] ?? Object.keys(config.views ?? {});
    return (groupViews ?? []).map((name) => ({ name, config: config.views[name] })).filter((v) => Boolean(v.config)) as {
      name: string;
      config: IrisView;
    }[];
  }, [config.view_groups, config.views, currentGroup]);

  const viewCount = Math.max(1, views.length);
  const aspectRatio = useMemo(() => {
    if (maskShape && maskShape[1] !== 0) {
      return maskShape[0] / maskShape[1];
    }
    const shape = config.images?.shape ?? [1, 1];
    return shape[0] / shape[1];
  }, [config.images?.shape, maskShape]);

  const horizontalSpacing = 40;
  const verticalSpacing = 220;
  const allowedWidth = Math.max(200, (windowWidth - horizontalSpacing) / viewCount);
  const allowedHeight = Math.max(200, windowHeight - verticalSpacing);
  let viewWidth = allowedWidth;
  let viewHeight = viewWidth / aspectRatio;
  if (viewHeight > allowedHeight) {
    viewHeight = allowedHeight;
    viewWidth = viewHeight * aspectRatio;
  }

  return (
    <div className="canvas-workspace">
      <div className="canvas-workspace-grid">
        {views.map(({ name, config: viewConfig }) => (
          <CanvasView
            key={`${name}-${imageId}`}
            config={config}
            view={viewConfig}
            imageId={imageId}
            width={viewWidth}
            height={viewHeight}
            filters={filters}
            maskData={maskData}
            userMask={userMask}
            maskShape={maskShape}
            showMask={showMask}
            maskDisplay={maskDisplay}
            tool={tool}
            maskArea={maskArea}
            activeClassIndex={activeClassIndex}
            onMaskEdit={onMaskEdit}
          />
        ))}
      </div>
    </div>
  );
}

export default CanvasWorkspace;
