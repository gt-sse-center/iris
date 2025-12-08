import React from 'react';
import ToolButton from './ToolButton';

interface NavigationToolsProps {
  onExportGeoTIFF: () => void;
}

const NavigationTools: React.FC<NavigationToolsProps> = ({ onExportGeoTIFF }) => {
  return (
    <>
      <ToolButton
        id="tb_previous_image"
        icon="/segmentation/static/icons/previous.png"
        onClick={() => {
          const w = window as any;
          if (w.save_mask && w.prev_image) w.save_mask(w.prev_image);
        }}
      />
      <ToolButton
        id="tb_next_image"
        icon="/segmentation/static/icons/next.png"
        onClick={() => {
          const w = window as any;
          if (w.save_mask && w.next_image) w.save_mask(w.next_image);
        }}
      />
      <ToolButton
        id="tb_save_mask"
        icon="/segmentation/static/icons/save_mask.png"
        onClick={() => {
          const w = window as any;
          if (w.save_mask) w.save_mask();
        }}
      />
      <ToolButton
        id="tb_export_geotiff"
        icon="/segmentation/static/icons/export.png"
        onClick={onExportGeoTIFF}
        title="Export GeoTIFF"
      />
    </>
  );
};

export default NavigationTools;
