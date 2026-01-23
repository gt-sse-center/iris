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
  zoomLevel?: number;
  panOffset?: { x: number; y: number };
}

const ReactRGBLayer: React.FC<ReactRGBLayerProps> = ({
  view,
  width,
  height,
  zIndex,
  imageId,
  className = '',
  style = {},
  zoomLevel = 1.0,
  panOffset = { x: 0, y: 0 },
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
    // Use the same URL pattern as legacy ViewManager
    const baseUrl = useSegmentationStore.getState().apiUrls?.main || '/';
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
    
    // Clear canvas using canvas dimensions (not image dimensions) to respect current zoom/pan
    const w = window as any;
    const imageShape = w.getImageShapeFromStore ? w.getImageShapeFromStore() : null;
    
    // CRITICAL FIX: Save current transformation before clearing
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to identity for clearing
    
    if (imageShape) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
      console.warn('⚠️ [IRIS Migration] ReactRGBLayer: No image shape available from React store or legacy vars');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    ctx.restore(); // Restore the zoom/pan transformation
    
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
    if (imageShape) {
      ctx.drawImage(image, 0, 0, imageShape[1], imageShape[0]); // width, height
    } else {
      console.warn('⚠️ [IRIS Migration] ReactRGBLayer: No image shape available for image drawing - using canvas dimensions');
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    }
    
    // Trigger mask visibility update if needed
    if (w.segmentationStore) {
      const showMask = w.segmentationStore.getState().showMask;
      if (w.show_mask) {
        w.show_mask(showMask);
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
  
  // Re-render when filters or zoom/pan change
  useEffect(() => {
    renderImage();
  }, [renderImage, zoomLevel, panOffset]);
  
  // Handle canvas size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Set canvas internal dimensions to match viewport dimensions (like legacy)
      // Legacy uses: [canvas.width, canvas.height] = vm.calculateViewWidthHeight();
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
        
        // Get image shape from React store
        const imageShape = (window as any).getImageShapeFromStore ? 
          (window as any).getImageShapeFromStore() : null;
        
        if (imageShape) {
          // CRITICAL: Only set base transformation on canvas initialization, not on every render
          // Check if this canvas already has a transformation applied by legacy zoom
          const currentTransform = ctx.getTransform();
          const isIdentityTransform = [
            currentTransform.a, currentTransform.b, currentTransform.c,
            currentTransform.d, currentTransform.e, currentTransform.f
          ].every((val, idx) => val === [1, 0, 0, 1, 0, 0][idx]);
          
          // Only set base transformation if no zoom/pan has been applied yet
          if (isIdentityTransform) {
            const scaleX = canvas.width / imageShape[1];  // canvas width / image width
            const scaleY = canvas.height / imageShape[0]; // canvas height / image height
            ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
          }
        } else {
          console.warn('⚠️ [IRIS Migration] ReactRGBLayer: No image shape available for canvas transformation - using identity transform');
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
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    display: 'block',
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