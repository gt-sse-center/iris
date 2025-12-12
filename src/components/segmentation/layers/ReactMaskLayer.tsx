/**
 * React Mask Layer Component
 * 
 * This component replaces the legacy MaskLayer class.
 * It handles mask rendering and visibility.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useSegmentationStore } from '../../../stores/segmentationStore';
import ReactBaseLayer, { ReactBaseLayerProps } from './ReactBaseLayer';
import { addTrackTransforms } from '../../../utils/coordinateTransform';

interface ReactMaskLayerProps extends Omit<ReactBaseLayerProps, 'children'> {
  // Additional props specific to mask layer
}

const ReactMaskLayer: React.FC<ReactMaskLayerProps> = ({
  view,
  width,
  height,
  zIndex,
  className = '',
  style = {},
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Get mask visibility from store
  const { showMask } = useSegmentationStore();
  
  // Render mask function - matches legacy MaskLayer exactly
  const renderMask = useCallback((bbox?: [number, number, number, number]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get legacy vars for mask data
    const w = window as any;
    if (!w.vars?.hidden_mask || !w.vars?.mask_area || !w.vars?.image_shape) {
      return;
    }
    
    // Use image coordinates exactly like legacy - let canvas transform handle scaling
    if (bbox === undefined) {
      // No specific coordinates given, redraw the whole mask
      // Clear using image dimensions (like legacy)
      ctx.clearRect(0, 0, w.vars.image_shape[1], w.vars.image_shape[0]);
      
      // Draw mask at mask_area position in image coordinates (like legacy)
      ctx.drawImage(
        w.vars.hidden_mask,
        w.vars.mask_area[0], w.vars.mask_area[1]
      );
    } else {
      // Redraw specific area - use image coordinates (like legacy)
      ctx.clearRect(
        bbox[0] + w.vars.mask_area[0],
        bbox[1] + w.vars.mask_area[1],
        bbox[2], bbox[3]
      );
      
      // Draw specific area of mask (like legacy)
      ctx.drawImage(
        w.vars.hidden_mask,
        bbox[0], bbox[1], bbox[2], bbox[3],
        bbox[0] + w.vars.mask_area[0], bbox[1] + w.vars.mask_area[1],
        bbox[2], bbox[3]
      );
    }
  }, []);
  
  // Handle canvas size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
      
      // Disable image smoothing for pixel-perfect rendering
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;
        ctx.shadowColor = '';
        
        // Add full canvas transformation tracking (enables zoom/pan)
        // This creates getWorldCoords and getCanvasCoords that handle zoom/pan properly
        addTrackTransforms(ctx);
        
        // Add coordinate transformation functions for React canvas
        const w = window as any;
        if (w.vars?.image_shape) {
          // CRITICAL: Set the initial transformation matrix to match legacy system
          // Legacy uses image_shape[0] (height) for both X and Y scaling to maintain aspect ratio
          const scale = canvas.width / w.vars.image_shape[0];
          ctx.setTransform(scale, 0, 0, scale, 0, 0);
        }
      }
      
      // Re-render after size change
      renderMask();
    }
  }, [width, height, renderMask]);
  
  // Handle mask visibility changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.display = showMask ? 'block' : 'none';
    }
  }, [showMask]);
  
  // Expose render function for legacy compatibility
  useEffect(() => {
    const w = window as any;
    if (!w.reactMaskLayers) {
      w.reactMaskLayers = [];
    }
    
    const layerInterface = {
      render: renderMask,
      view: view,
      type: 'mask',
      container: canvasRef.current,
    };
    
    w.reactMaskLayers.push(layerInterface);
    
    return () => {
      const index = w.reactMaskLayers.indexOf(layerInterface);
      if (index > -1) {
        w.reactMaskLayers.splice(index, 1);
      }
    };
  }, [renderMask, view]);
  
  // Listen for zoom/transform changes and re-render
  useEffect(() => {
    const handleTransformChange = () => {
      renderMask();
    };
    
    // Listen for legacy zoom/transform events
    window.addEventListener('iris-transform-change', handleTransformChange);
    
    return () => {
      window.removeEventListener('iris-transform-change', handleTransformChange);
    };
  }, [renderMask]);
  
  // Listen for legacy mask render calls
  useEffect(() => {
    const handleLegacyRender = (event: CustomEvent) => {
      const bbox = event.detail?.bbox;
      renderMask(bbox);
    };
    
    window.addEventListener('react-mask-render', handleLegacyRender as EventListener);
    
    return () => {
      window.removeEventListener('react-mask-render', handleLegacyRender as EventListener);
    };
  }, [renderMask]);
  
  const canvasStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: showMask ? 'block' : 'none',
    objectFit: 'fill',
    ...style,
  };
  
  return (
    <ReactBaseLayer
      view={view}
      width={width}
      height={height}
      zIndex={zIndex}
      className={`react-mask-layer ${className}`}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={canvasStyle}
        className="view-canvas mask-canvas"
      />
    </ReactBaseLayer>
  );
};

export default ReactMaskLayer;