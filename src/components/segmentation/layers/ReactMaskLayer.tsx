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
  zoomLevel?: number;
  panOffset?: { x: number; y: number };
}

const ReactMaskLayer: React.FC<ReactMaskLayerProps> = ({
  view,
  width,
  height,
  zIndex,
  className = '',
  style = {},
  zoomLevel: _zoomLevel = 1.0,
  panOffset: _panOffset = { x: 0, y: 0 },
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Get mask visibility from store
  const { showMask } = useSegmentationStore();
  
  // Render mask function - matches legacy MaskLayer exactly
  const renderMask = useCallback((bbox?: [number, number, number, number]) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('[ReactMaskLayer] renderMask: No canvas available');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('[ReactMaskLayer] renderMask: No canvas context available');
      return;
    }
    
    // Get legacy vars for mask data
    const w = window as any;
    if (!w.vars?.hidden_mask) {
      console.warn('[ReactMaskLayer] renderMask: No hidden_mask available in vars');
      return;
    }
    
    if (!w.vars?.mask_area) {
      console.warn('[ReactMaskLayer] renderMask: No mask_area available in vars');
      return;
    }
    
    if (!w.vars?.image_shape) {
      console.warn('[ReactMaskLayer] renderMask: No image_shape available in vars');
      return;
    }
    
    console.log('[ReactMaskLayer] renderMask: Rendering mask', {
      bbox,
      hiddenMaskSize: [w.vars.hidden_mask.width, w.vars.hidden_mask.height],
      maskArea: w.vars.mask_area,
      imageShape: w.vars.image_shape,
      canvasSize: [canvas.width, canvas.height]
    });
    
    // Use image coordinates exactly like legacy - let canvas transform handle scaling
    if (bbox === undefined) {
      // No specific coordinates given, redraw the whole mask
      // Get image shape from React store with fallback to legacy vars
      const imageShape = (window as any).getImageShapeFromStore ? 
        (window as any).getImageShapeFromStore() : w.vars?.image_shape;
      
      // CRITICAL FIX: Save current transformation before clearing
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to identity for clearing
      
      if (imageShape) {
        // Clear using canvas dimensions to respect zoom/pan
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        console.warn('⚠️ [IRIS Migration] ReactMaskLayer: No image shape available from React store or legacy vars');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.restore(); // Restore the zoom/pan transformation
      
      // Get mask area from React store or fallback to legacy
      const maskArea = window.getMaskAreaFromStore ? window.getMaskAreaFromStore() : w.vars?.mask_area;
      
      if (!maskArea) {
        console.error('[IRIS] ReactMaskLayer: No mask area available for rendering');
        return;
      }
      
      // Draw mask at mask_area position in image coordinates (like legacy)
      // console.log('[ReactMaskLayer] Drawing full mask at position:', maskArea);
      ctx.drawImage(
        w.vars.hidden_mask,
        maskArea[0], maskArea[1]
      );
    } else {
      // Get mask area from React store or fallback to legacy
      const maskArea = window.getMaskAreaFromStore ? window.getMaskAreaFromStore() : w.vars?.mask_area;
      
      if (!maskArea) {
        console.error('[IRIS] ReactMaskLayer: No mask area available for rendering');
        return;
      }
      
      // Redraw specific area - use image coordinates (like legacy)
      ctx.clearRect(
        bbox[0] + maskArea[0],
        bbox[1] + maskArea[1],
        bbox[2], bbox[3]
      );
      
      // Draw specific area of mask (like legacy)
      ctx.drawImage(
        w.vars.hidden_mask,
        bbox[0], bbox[1], bbox[2], bbox[3],
        bbox[0] + maskArea[0], bbox[1] + maskArea[1],
        bbox[2], bbox[3]
      );
    }
    
    // Add warning when falling back to legacy vars
    if (!window.getMaskAreaFromStore && w.vars?.mask_area) {
      console.warn('⚠️ [IRIS Migration] ReactMaskLayer: Using legacy vars.mask_area fallback - React store not available');
    }
  }, []);
  
  // Handle canvas size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // CRITICAL: Set canvas internal dimensions to match legacy system exactly
      // Legacy uses: [canvas.width, canvas.height] = vm.calculateViewWidthHeight();
      // This means canvas internal dimensions = viewport dimensions (not image dimensions)
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
        
        // CRITICAL: Set the initial transformation matrix to match legacy system exactly
        // image_shape[0] = height, image_shape[1] = width
        // We need to scale canvas dimensions to image dimensions
        const w = window as any;
        
        // Get image shape from React store with fallback to legacy vars
        const imageShape = (window as any).getImageShapeFromStore ? 
          (window as any).getImageShapeFromStore() : w.vars?.image_shape;
        
        if (imageShape) {
          // CRITICAL: Only set base transformation on canvas initialization, not on every render
          // Check if this canvas already has a transformation applied by legacy zoom
          const currentTransform = ctx.getTransform();
          const isIdentityTransform = (
            currentTransform.a === 1 && currentTransform.b === 0 &&
            currentTransform.c === 0 && currentTransform.d === 1 &&
            currentTransform.e === 0 && currentTransform.f === 0
          );
          
          // Only set base transformation if no zoom/pan has been applied yet
          if (isIdentityTransform) {
            const scaleX = canvas.width / imageShape[1];  // canvas width / image width
            const scaleY = canvas.height / imageShape[0]; // canvas height / image height
            ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
          }
        } else {
          console.warn('⚠️ [IRIS Migration] ReactMaskLayer: No image shape available for canvas transformation - using identity transform');
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
      const shouldShow = showMask;
      canvas.style.display = shouldShow ? 'block' : 'none';
      console.log('[ReactMaskLayer] Mask visibility changed:', shouldShow);
      
      // If mask is now visible, trigger a render
      if (shouldShow) {
        renderMask();
      }
    }
  }, [showMask, renderMask]);
  
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
  
  // Initial render when component mounts and when mask data becomes available
  useEffect(() => {
    // Only render if we have mask data
    const w = window as any;
    if (w.vars?.hidden_mask && w.vars?.mask_area && w.vars?.image_shape) {
      console.log('[ReactMaskLayer] Initial render with mask data available');
      renderMask();
    } else {
      console.log('[ReactMaskLayer] Waiting for mask data to become available', {
        hasHiddenMask: !!w.vars?.hidden_mask,
        hasMaskArea: !!w.vars?.mask_area,
        hasImageShape: !!w.vars?.image_shape
      });
    }
  }, [renderMask]);
  
  // Listen for mask data loading events
  useEffect(() => {
    const handleMaskLoaded = () => {
      console.log('[ReactMaskLayer] Mask data loaded event received');
      renderMask();
    };
    
    window.addEventListener('iris-mask-loaded', handleMaskLoaded);
    
    return () => {
      window.removeEventListener('iris-mask-loaded', handleMaskLoaded);
    };
  }, [renderMask]);
  
  const canvasStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    display: showMask ? 'block' : 'none',
    backgroundColor: 'transparent',
    cursor: 'crosshair',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    KhtmlUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
    userSelect: 'none',
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