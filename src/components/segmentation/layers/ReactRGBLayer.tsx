/**
 * React RGB Layer Component
 * 
 * This component replaces the legacy RGBLayer class.
 * It handles image loading and rendering with filters.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSegmentationStore } from '../../../stores/segmentationStore';
import ReactBaseLayer, { ReactBaseLayerProps } from './ReactBaseLayer';
import { addTrackTransforms } from '../../../utils/coordinateTransform';

interface ReactRGBLayerProps extends Omit<ReactBaseLayerProps, 'children'> {
  imageId: string;
}

const ReactRGBLayer: React.FC<ReactRGBLayerProps> = ({
  view,
  width,
  height,
  zIndex,
  imageId,
  className = '',
  style = {},
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Get filters from segmentation store
  const { brightness, saturation, contrast, invert } = useSegmentationStore();
  
  // Load image source
  const loadImage = useCallback(() => {
    if (!imageId || !view.name) return;
    
    setIsLoading(true);
    setHasError(false);
    
    const image = new Image();
    // Use the same URL pattern as legacy ViewManager: vars.url.main + "image/" + imageId + "/" + viewName
    const w = window as any;
    const baseUrl = w.vars?.url?.main || '/';
    const imageUrl = `${baseUrl}image/${imageId}/${view.name}`;
    
    image.onload = () => {
      imageRef.current = image;
      setIsLoading(false);
      renderImage();
    };
    
    image.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      console.error(`Failed to load image: ${imageUrl}`);
    };
    
    image.src = imageUrl;
  }, [imageId, view.name]);
  
  // Render image to canvas
  const renderImage = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image || !image.complete) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas using image dimensions (like legacy)
    const win = window as any;
    if (win.vars?.image_shape) {
      ctx.clearRect(0, 0, win.vars.image_shape[1], win.vars.image_shape[0]);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Apply filters via CSS
    const filterParts: string[] = [];
    
    if (invert) {
      filterParts.push('invert(1)');
    }
    
    filterParts.push(`brightness(${brightness}%)`);
    
    if (contrast) {
      filterParts.push('contrast(200%)');
    }
    
    filterParts.push(`saturate(${saturation}%)`);
    
    canvas.style.filter = filterParts.join(' ');
    
    // Draw image at image dimensions (canvas transform will handle scaling)
    ctx.drawImage(image, 0, 0, win.vars.image_shape[1], win.vars.image_shape[0]);
    
    // Trigger mask visibility update if needed
    if (win.segmentationStore) {
      const showMask = win.segmentationStore.getState().showMask;
      if (win.show_mask) {
        win.show_mask(showMask);
      }
    }
  }, [brightness, saturation, contrast, invert]);
  
  // Listen for zoom/transform changes and re-render
  useEffect(() => {
    const handleTransformChange = () => {
      renderImage();
    };
    
    // Listen for legacy zoom/transform events
    window.addEventListener('iris-transform-change', handleTransformChange);
    
    return () => {
      window.removeEventListener('iris-transform-change', handleTransformChange);
    };
  }, [renderImage]);
  
  // Load image when component mounts or imageId/view changes
  useEffect(() => {
    loadImage();
  }, [loadImage]);
  
  // Re-render when filters change
  useEffect(() => {
    renderImage();
  }, [renderImage]);
  
  // Handle canvas size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Set canvas dimensions to match image dimensions (like legacy)
      const w = window as any;
      if (w.vars?.image_shape) {
        const imageWidth = w.vars.image_shape[1];  // width is image_shape[1]
        const imageHeight = w.vars.image_shape[0]; // height is image_shape[0]
        
        // Set canvas internal dimensions to match image dimensions
        canvas.width = imageWidth;
        canvas.height = imageHeight;
        
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
          
          // CRITICAL: Set the initial transformation matrix to match legacy system
          // Legacy uses image_shape[0] (height) for both X and Y scaling to maintain aspect ratio
          const w = window as any;
          if (w.vars?.image_shape) {
            const scale = canvas.width / w.vars.image_shape[0];
            ctx.setTransform(scale, 0, 0, scale, 0, 0);
          }
        }
      }
      
      // Re-render after size change
      renderImage();
    }
  }, [width, height, renderImage]);
  
  // Expose render function for legacy compatibility
  useEffect(() => {
    const w = window as any;
    if (!w.reactRGBLayers) {
      w.reactRGBLayers = [];
    }
    
    const layerInterface = {
      render: renderImage,
      view: view,
      type: 'rgb',
    };
    
    w.reactRGBLayers.push(layerInterface);
    
    return () => {
      const index = w.reactRGBLayers.indexOf(layerInterface);
      if (index > -1) {
        w.reactRGBLayers.splice(index, 1);
      }
    };
  }, [renderImage, view]);
  
  const canvasStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'block',
    objectFit: 'fill', // Ensure image fills the container
    ...style,
  };
  
  return (
    <ReactBaseLayer
      view={view}
      width={width}
      height={height}
      zIndex={zIndex}
      className={`react-rgb-layer ${className}`}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={canvasStyle}
        className="view-canvas"
      />
      
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#666',
            fontSize: '12px',
          }}
        >
          Loading...
        </div>
      )}
      
      {hasError && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#d32f2f',
            fontSize: '12px',
            textAlign: 'center',
          }}
        >
          Failed to load<br />
          {view.name}
        </div>
      )}
    </ReactBaseLayer>
  );
};

export default ReactRGBLayer;