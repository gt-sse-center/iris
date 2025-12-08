import React from 'react';
import ToolButton from './ToolButton';
import { ImageNavigationDropdown } from './ImageNavigationDropdown';

interface NavigationToolsProps {
  onExportGeoTIFF: () => void;
}

const NavigationTools: React.FC<NavigationToolsProps> = ({ onExportGeoTIFF }) => {
  const currentImageId = (window as any).vars?.image_id || '';

  const handleNavigateToImage = (imageId: string) => {
    const w = window as any;
    console.log('Navigating to image:', imageId);
    
    // Check if user has unsaved changes
    const shouldShowDialogue = w.segmentationStore 
      ? w.segmentationStore.getState().showDialogueBeforeNextImage
      : false;
    
    if (shouldShowDialogue) {
      // User has unsaved changes - show confirmation dialog
      if (w.dialogue_before_next_image) {
        // Store the target image ID for after the dialog
        w.pendingNavigationImageId = imageId;
        w.dialogue_before_next_image();
      } else {
        console.warn('dialogue_before_next_image not available');
      }
    } else {
      // No unsaved changes - navigate directly
      const url = `/segmentation/?image_id=${encodeURIComponent(imageId)}`;
      if (w.goto_url) {
        w.goto_url(url);
      } else {
        window.location.href = url;
      }
    }
  };

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
      <ImageNavigationDropdown
        currentImageId={currentImageId}
        onNavigate={handleNavigateToImage}
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
