/**
 * React Preview Layer Component
 * 
 * This component replaces the legacy PreviewLayer class.
 * It handles drawing preview (cursor, tool preview, mask area boundaries).
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import ReactBaseLayer, { ReactBaseLayerProps } from './ReactBaseLayer';
import { createCoordinateTransform, updateCursorCoords, addTrackTransforms, CoordinateTransform } from '../../../utils/coordinateTransform';
import { useSegmentationStore } from '../../../stores/segmentationStore';

interface ReactPreviewLayerProps extends Omit<ReactBaseLayerProps, 'children'> {
  // Additional props specific to preview layer
  zoomLevel?: number;
  panOffset?: { x: number; y: number };
}

const ReactPreviewLayer: React.FC<ReactPreviewLayerProps> = ({
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
  const [transform, setTransform] = useState<CoordinateTransform | null>(null);
  
  // Get tool size from React store (primary source)
  const toolSize = useSegmentationStore((state) => state.toolSize);
  
  // Get tool shape from React store (primary source)
  const toolShape = useSegmentationStore((state) => state.toolShape);
  
  // Get cursor image from React store (primary source)
  const cursorImage = useSegmentationStore((state) => state.cursorImage);
  
  // Render preview function
  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get legacy vars for cursor and tool data
    const w = window as any;
    
    // Get cursor image from React store with fallback to legacy vars
    const cursorImage = (window as any).getCursorImageFromStore ? 
      (window as any).getCursorImageFromStore() : w.vars?.cursor_image;
    
    // Get image shape from React store with fallback to legacy vars
    const imageShape = (window as any).getImageShapeFromStore ? 
      (window as any).getImageShapeFromStore() : w.vars?.image_shape;
    
    if (!cursorImage) {
      console.warn('⚠️ [IRIS Migration] ReactPreviewLayer: No cursor image available from React store or legacy vars');
      return;
    }
    
    if (!imageShape) {
      console.warn('⚠️ [IRIS Migration] ReactPreviewLayer: No image shape available from React store or legacy vars');
      return;
    }
    
    // Clear canvas using image dimensions (like legacy)
    ctx.clearRect(0, 0, imageShape[1], imageShape[0]); // width, height
    
    // Get tool offset (from legacy get_tool_offset function)
    let offset = { x: 0, y: 0 };
    if (w.get_tool_offset) {
      offset = w.get_tool_offset();
    }
    
    // The cursor coordinates are already in image space, and the canvas transformation
    // will be applied automatically when we draw. We just need to draw at the image coordinates.
    const cursorX = cursorImage[0] + offset.x;
    const cursorY = cursorImage[1] + offset.y;
    
    // CRITICAL FIX: The tool size needs to be in image coordinates, not screen coordinates
    // Since we apply a canvas transformation, we need to account for the scaling
    // Legacy uses: canvas.width / vars.image_shape[0] for both X and Y scaling
    const scale = canvas.width / imageShape[0];
    
    // The tool size should be consistent in screen pixels, so we need to inverse-scale it
    // to account for the canvas transformation
    const toolWidth = toolSize / scale;
    const toolHeight = toolSize / scale;
    
    // Draw tool cursor preview based on shape
    ctx.fillStyle = "rgba(150, 150, 150, 0.5)";
    
    if (toolShape === 'round') {
      // Draw circular cursor
      const radius = toolWidth / 2;
      const centerX = cursorX + radius;
      const centerY = cursorY + radius;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Draw square cursor (default)
      ctx.fillRect(cursorX, cursorY, toolWidth, toolHeight);
    }
    
    // Draw mask area boundaries
    const maskArea = window.getMaskAreaFromStore ? window.getMaskAreaFromStore() : w.vars?.mask_area;
    const maskShape = window.getMaskShapeFromStore ? window.getMaskShapeFromStore() : w.vars?.mask_shape;
    
    if (maskArea && maskShape) {
      ctx.beginPath();
      
      // Line width depends on number of views
      if (w.vars.config?.views && Object.keys(w.vars.config.views).length < 2) {
        ctx.lineWidth = 3;
      } else {
        ctx.lineWidth = 2;
      }
      
      ctx.strokeStyle = "red";
      ctx.setLineDash([5, 15]);
      
      // Mask area coordinates are in image space - let canvas transform handle the scaling
      const maskX = maskArea[0];
      const maskY = maskArea[1];
      const maskWidth = maskShape[0];
      const maskHeight = maskShape[1];
      
      ctx.rect(maskX, maskY, maskWidth, maskHeight);
      ctx.stroke();
    } else {
      console.warn('[IRIS Migration] ReactPreviewLayer: No mask area or mask shape available for rendering');
    }
    
    // Add warning when falling back to legacy vars
    if (!window.getMaskAreaFromStore && w.vars?.mask_area) {
      console.warn('⚠️ [IRIS Migration] ReactPreviewLayer: Using legacy vars.mask_area fallback - React store not available');
    }
  }, [toolSize, toolShape, cursorImage]); // Re-render when toolSize, toolShape, or cursorImage changes
  
  // Handle canvas size changes and coordinate transformation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Set canvas internal dimensions to match viewport dimensions (like legacy)
      // Legacy uses: [canvas.width, canvas.height] = vm.calculateViewWidthHeight();
      canvas.width = width;
      canvas.height = height;
      
      const w = window as any;
      
      // Get image shape from React store with fallback to legacy vars
      const imageShape = (window as any).getImageShapeFromStore ? 
        (window as any).getImageShapeFromStore() : w.vars?.image_shape;
      
      if (imageShape) {
        const imageWidth = imageShape[1];  // width is image_shape[1]
        const imageHeight = imageShape[0]; // height is image_shape[0]
        
        const newTransform = createCoordinateTransform(
          canvas.width, canvas.height,
          imageWidth, imageHeight
        );
        setTransform(newTransform);
        
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
          // Get image shape from React store with fallback to legacy vars
          const imageShape = (window as any).getImageShapeFromStore ? 
            (window as any).getImageShapeFromStore() : w.vars?.image_shape;
          
          if (imageShape) {
            // Legacy uses: ctx.canvas.width / vars.image_shape[0] for BOTH X and Y scaling
            // This maintains square pixels and matches the legacy coordinate system
            const scale = canvas.width / imageShape[0]; // Use image height for both dimensions
            ctx.setTransform(scale, 0, 0, scale, 0, 0);
          } else {
            console.warn('⚠️ [IRIS Migration] ReactPreviewLayer: No image shape available for canvas transformation - using identity transform');
          }
        }
      }
      
      // Re-render after size change
      renderPreview();
    }
  }, [width, height, renderPreview]);
  
  // Add mouse event listeners with proper coordinate transformation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !transform) return;
    
    // Create wrapped mouse event handlers that update coordinates properly
    const handleMouseMove = (event: MouseEvent) => {
      try {
        updateCursorCoords(canvas, event);
        
        // Call legacy mouse_move handler
        const w = window as any;
        if (w.mouse_move) {
          w.mouse_move.call(canvas, event);
        }
      } catch (error) {
        console.error('Error in mouse move handler:', error);
      }
    };
    
    const handleMouseDown = (event: MouseEvent) => {
      try {
        updateCursorCoords(canvas, event);
        
        // Call legacy mouse_down handler
        const w = window as any;
        if (w.mouse_down) {
          w.mouse_down.call(canvas, event);
        }
      } catch (error) {
        console.error('Error in mouse down handler:', error);
      }
    };
    
    const handleMouseUp = (event: MouseEvent) => {
      try {
        // Call legacy mouse_up handler
        const w = window as any;
        if (w.mouse_up) {
          w.mouse_up.call(canvas, event);
        }
      } catch (error) {
        console.error('Error in mouse up handler:', error);
      }
    };
    
    const handleMouseEnter = (event: MouseEvent) => {
      updateCursorCoords(canvas, event);
      
      // Call legacy mouse_enter handler
      const w = window as any;
      if (w.mouse_enter) {
        w.mouse_enter.call(canvas, event);
      }
    };
    
    const handleMouseWheel = (event: WheelEvent) => {
      // Call legacy mouse_wheel handler
      const w = window as any;
      if (w.mouse_wheel) {
        w.mouse_wheel.call(canvas, event);
      }
    };
    
    // Add event listeners
    canvas.addEventListener("mousemove", handleMouseMove, { passive: false });
    canvas.addEventListener("mousedown", handleMouseDown, false);
    canvas.addEventListener("mouseup", handleMouseUp, false);
    canvas.addEventListener("mouseenter", handleMouseEnter, { passive: false });
    canvas.addEventListener("wheel", handleMouseWheel, { passive: false });
    
    return () => {
      // Cleanup event listeners
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseenter", handleMouseEnter);
      canvas.removeEventListener("wheel", handleMouseWheel);
    };
  }, [transform]);
  
  // Expose render function for legacy compatibility
  useEffect(() => {
    const w = window as any;
    if (!w.reactPreviewLayers) {
      w.reactPreviewLayers = [];
    }
    
    const layerInterface = {
      render: renderPreview,
      view: view,
      type: 'preview',
      container: canvasRef.current,
    };
    
    w.reactPreviewLayers.push(layerInterface);
    
    return () => {
      const index = w.reactPreviewLayers.indexOf(layerInterface);
      if (index > -1) {
        w.reactPreviewLayers.splice(index, 1);
      }
    };
  }, [renderPreview, view]);
  
  // Listen for zoom/transform changes and re-render
  useEffect(() => {
    const handleTransformChange = () => {
      renderPreview();
    };
    
    // Listen for legacy zoom/transform events
    window.addEventListener('iris-transform-change', handleTransformChange);
    
    return () => {
      window.removeEventListener('iris-transform-change', handleTransformChange);
    };
  }, [renderPreview]);
  
  // Listen for legacy preview render calls
  useEffect(() => {
    const handleLegacyRender = () => {
      renderPreview();
    };
    
    window.addEventListener('react-preview-render', handleLegacyRender);
    
    return () => {
      window.removeEventListener('react-preview-render', handleLegacyRender);
    };
  }, [renderPreview]);
  
  const canvasStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    display: 'block',
    // border: '1px solid black', // Temporarily remove border to test positioning
    backgroundColor: 'transparent',
    cursor: 'crosshair',
    pointerEvents: 'auto', // Allow mouse interactions
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
      className={`react-preview-layer ${className}`}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={canvasStyle}
        className="view-canvas preview-canvas"
      />
    </ReactBaseLayer>
  );
};

export default ReactPreviewLayer;