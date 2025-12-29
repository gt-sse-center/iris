/**
 * React Preview Layer Component
 * 
 * This component replaces the legacy PreviewLayer class.
 * It handles drawing preview (cursor, tool preview, mask area boundaries).
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import ReactBaseLayer, { ReactBaseLayerProps } from './ReactBaseLayer';
import { createCoordinateTransform, updateCursorCoords, addTrackTransforms, CoordinateTransform } from '../../../utils/coordinateTransform';

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
  
  // Render preview function
  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get legacy vars for cursor and tool data
    const w = window as any;
    if (!w.vars?.cursor_image || !w.vars?.tool || !w.vars?.image_shape) {
      return;
    }
    
    // Clear canvas using image dimensions (like legacy)
    const win = window as any;
    if (win.vars?.image_shape) {
      ctx.clearRect(0, 0, win.vars.image_shape[1], win.vars.image_shape[0]);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Get tool offset (from legacy get_tool_offset function)
    let offset = { x: 0, y: 0 };
    if (win.get_tool_offset) {
      offset = win.get_tool_offset();
    }
    
    // The cursor coordinates are already in image space, and the canvas transformation
    // will be applied automatically when we draw. We just need to draw at the image coordinates.
    const cursorX = win.vars.cursor_image[0] + offset.x;
    const cursorY = win.vars.cursor_image[1] + offset.y;
    
    // Tool size should also be in image coordinates - the canvas transform will scale it
    const toolWidth = win.vars.tool.size;
    const toolHeight = win.vars.tool.size;
    
    // Draw tool cursor preview
    ctx.fillStyle = "rgba(150, 150, 150, 0.5)";
    ctx.fillRect(cursorX, cursorY, toolWidth, toolHeight);
    
    // Draw mask area boundaries
    if (win.vars.mask_area && win.vars.mask_shape) {
      ctx.beginPath();
      
      // Line width depends on number of views
      if (win.vars.config?.views && Object.keys(win.vars.config.views).length < 2) {
        ctx.lineWidth = 3;
      } else {
        ctx.lineWidth = 2;
      }
      
      ctx.strokeStyle = "red";
      ctx.setLineDash([5, 15]);
      
      // Mask area coordinates are in image space - let canvas transform handle the scaling
      const maskX = win.vars.mask_area[0];
      const maskY = win.vars.mask_area[1];
      const maskWidth = win.vars.mask_shape[0];
      const maskHeight = win.vars.mask_shape[1];
      
      ctx.rect(maskX, maskY, maskWidth, maskHeight);
      ctx.stroke();
    }
  }, []);
  
  // Handle canvas size changes and coordinate transformation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Set canvas internal dimensions to match viewport dimensions (like legacy)
      // Legacy uses: [canvas.width, canvas.height] = vm.calculateViewWidthHeight();
      canvas.width = width;
      canvas.height = height;
      
      const w = window as any;
      if (w.vars?.image_shape) {
        const imageWidth = w.vars.image_shape[1];  // width is image_shape[1]
        const imageHeight = w.vars.image_shape[0]; // height is image_shape[0]
        
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
          // image_shape[0] = height, image_shape[1] = width
          // We need to scale canvas dimensions to image dimensions
          const scaleX = canvas.width / w.vars.image_shape[1];  // canvas width / image width
          const scaleY = canvas.height / w.vars.image_shape[0]; // canvas height / image height
          ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
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