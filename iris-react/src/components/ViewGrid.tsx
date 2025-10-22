import type { IrisConfig } from "../api/types";
import { buildBackendUrl } from "../api/base";

interface ViewGridProps {
  imageId: string;
  config: IrisConfig;
  activeGroup?: string | null;
  showMask?: boolean;
}

function ViewGrid({ imageId, config, activeGroup = null }: ViewGridProps) {
  const groupOrder = activeGroup ?? Object.keys(config.view_groups ?? {})[0] ?? null;
  const viewNames =
    groupOrder && config.view_groups[groupOrder]?.length
      ? config.view_groups[groupOrder]
      : Object.keys(config.views);

  return (
    <div className="view-grid">
      {viewNames.map((viewName) => {
        const viewConfig = config.views[viewName];
        if (!viewConfig) {
          return null;
        }
        return (
          <div key={viewName} className="view-grid__item">
            <div className="view-grid__header">
              <strong>{viewConfig.name}</strong>
            </div>
            <div className="view-grid__body">
              <img
                className="view-grid__image"
                src={buildBackendUrl(`/image/${encodeURIComponent(imageId)}/${encodeURIComponent(viewName)}?ts=${Date.now()}`)}
                alt={viewConfig.name}
              />
            </div>
            {viewConfig.description && (
              <div
                className="view-grid__description"
                dangerouslySetInnerHTML={{ __html: viewConfig.description }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ViewGrid;
