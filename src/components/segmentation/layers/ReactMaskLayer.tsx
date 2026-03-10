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
    
    // Get mask data from store via bridge functions
    const w = window as any;
    const hiddenMask = w.getHiddenMaskCanvasFromStore ? w.getHiddenMaskCanvasFromStore() : null;
    
    if (!hiddenMask) {
      console.warn('[ReactMaskLayer] renderMask: No hidden_mask available from store');
      return;
    }
    
    const maskArea = window.getMaskAreaFromStore ? window.getMaskAreaFromStore() : null;
    if (!maskArea) {
      console.warn('[ReactMaskLayer] renderMask: No mask_area available from store');
      return;
    }
    
    const imageShape = w.getImageShapeFromStore ? w.getImageShapeFromStore() : null;
    if (!imageShape) {
      console.warn('[ReactMaskLayer] renderMask: No image_shape available from store');
      return;
    }
    
    if ((window as any).IRIS_DEBUG) {
      console.log('[ReactMaskLayer] renderMask: Rendering mask', {
        bbox,
        hiddenMaskSize: [hiddenMask.width, hiddenMask.height],
        maskArea: maskArea,
        imageShape: imageShape,
        canvasSize: [canvas.width, canvas.height]
      });
    }
    
    // Use image coordinates exactly like legacy - let canvas transform handle scaling
    if (bbox === undefined) {
      // No specific coordinates given, redraw the whole mask
      
      // CRITICAL FIX: Save current transformation before clearing
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to identity for clearing
      
      if (imageShape) {
        // Clear using canvas dimensions to respect zoom/pan
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        console.warn('⚠️ [IRIS Migration] ReactMaskLayer: No image shape available from store');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.restore(); // Restore the zoom/pan transformation
      
      // Draw mask at mask_area position in image coordinates (like legacy)
      ctx.drawImage(
        hiddenMask,
        maskArea[0], maskArea[1]
      );
    } else {
      // Redraw specific area - use image coordinates (like legacy)
      ctx.clearRect(
        bbox[0] + maskArea[0],
        bbox[1] + maskArea[1],
        bbox[2], bbox[3]
      );
      
      // Draw specific area of mask (like legacy)
      ctx.drawImage(
        hiddenMask,
        bbox[0], bbox[1], bbox[2], bbox[3],
        bbox[0] + maskArea[0], bbox[1] + maskArea[1],
        bbox[2], bbox[3]
      );
    }
  }, []);
  
  // Handle canvas size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const updateCanvasSize = () => {
      // Get actual container dimensions instead of using fixed width/height props
      const container = canvas.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;
        
        // Get image shape to maintain aspect ratio
        const w = window as any;
        const imageShape = (window as any).getImageShapeFromStore ? 
          (window as any).getImageShapeFromStore() : w.vars?.image_shape;
        
        let actualWidth = containerWidth;
        let actualHeight = containerHeight;
        
        // Maintain aspect ratio based on image dimensions
        if (imageShape) {
          const imageWidth = imageShape[1];
          const imageHeight = imageShape[0];
          const imageAspectRatio = imageWidth / imageHeight;
          const containerAspectRatio = containerWidth / containerHeight;
          
          if (containerAspectRatio > imageAspectRatio) {
            // Container is wider than image - fit to height
            actualWidth = containerHeight * imageAspectRatio;
            actualHeight = containerHeight;
          } else {
            // Container is taller than image - fit to width
            actualWidth = containerWidth;
            actualHeight = containerWidth / imageAspectRatio;
          }
        }
        
        // Set canvas internal dimensions to maintain aspect ratio
        canvas.width = actualWidth;
        canvas.height = actualHeight;
        
        // Center the canvas in the container
        canvas.style.left = `${(containerWidth - actualWidth) / 2}px`;
        canvas.style.top = `${(containerHeight - actualHeight) / 2}px`;
        canvas.style.width = `${actualWidth}px`;
        canvas.style.height = `${actualHeight}px`;
        
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
          
          // CRITICAL: Always reset transformation when canvas size changes
          // This ensures the mask fits properly after resize
          if (imageShape) {
            const scaleX = actualWidth / imageShape[1];  // canvas width / image width
            const scaleY = actualHeight / imageShape[0]; // canvas height / image height
            ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
          } else {
            console.warn('⚠️ [IRIS Migration] ReactMaskLayer: No image shape available for canvas transformation - using identity transform');
          }
        }
        
        // Re-render after size change
        renderMask();
      }
    };
    
    // Initial size update
    updateCanvasSize();
    
    // Watch for container size changes using ResizeObserver
    const container = canvas.parentElement;
    if (container) {
      const resizeObserver = new ResizeObserver(() => {
        updateCanvasSize();
      });
      
      resizeObserver.observe(container);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [width, height, renderMask]);
  
  // Handle mask visibility changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const shouldShow = showMask;
      canvas.style.display = shouldShow ? 'block' : 'none';
      if ((window as any).IRIS_DEBUG) console.log('[ReactMaskLayer] Mask visibility changed:', shouldShow);
      
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
    // Only render if we have mask data from store
    const w = window as any;
    const hiddenMask = w.getHiddenMaskCanvasFromStore ? w.getHiddenMaskCanvasFromStore() : null;
    const maskArea = window.getMaskAreaFromStore ? window.getMaskAreaFromStore() : null;
    const imageShape = w.getImageShapeFromStore ? w.getImageShapeFromStore() : null;
    
    if (hiddenMask && maskArea && imageShape) {
      if ((window as any).IRIS_DEBUG) console.log('[ReactMaskLayer] Initial render with mask data available');
      renderMask();
    } else {
      if ((window as any).IRIS_DEBUG) {
        console.log('[ReactMaskLayer] Waiting for mask data to become available', {
          hasHiddenMask: !!hiddenMask,
          hasMaskArea: !!maskArea,
          hasImageShape: !!imageShape
        });
      }
    }
  }, [renderMask]);
  
  // Listen for mask data loading events
  useEffect(() => {
    const handleMaskLoaded = () => {
      if ((window as any).IRIS_DEBUG) console.log('[ReactMaskLayer] Mask data loaded event received');
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
        style={canvasStyle}
        className="view-canvas mask-canvas"
      />
    </ReactBaseLayer>
  );
};

export default ReactMaskLayer;