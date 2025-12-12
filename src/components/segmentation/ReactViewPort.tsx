/**
 * React ViewPort Component
 * 
 * This component replaces the legacy ViewPort class.
 * It manages a single view with multiple layers (RGB, Mask, Preview, etc.).
 */

import React, { useRef, useState } from 'react';
import { ViewConfig } from '../../stores/viewManagerStore';
import { useViewManagerStore } from '../../stores/viewManagerStore';
import ReactRGBLayer from './layers/ReactRGBLayer';
import ReactMaskLayer from './layers/ReactMaskLayer';
import ReactPreviewLayer from './layers/ReactPreviewLayer';
import ReactBingLayer from './layers/ReactBingLayer';

interface ReactViewPortProps {
  view: ViewConfig;
  index: number;
  width: number;
  height: number;
  showControls: boolean;
  imageId: string;
  imageLocation: [number, number];
  onImageLocationChange: (location: [number, number]) => void;
}

const ReactViewPort: React.FC<ReactViewPortProps> = ({
  view,
  index,
  width,
  height,
  showControls,
  imageId,
  imageLocation,
  onImageLocationChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedViewName, setSelectedViewName] = useState(view.name);
  
  const {
    views,
    addView,
    removeView,
    replaceView,
    getCurrentViews,
  } = useViewManagerStore();
  
  const currentViews = getCurrentViews();
  const canRemove = currentViews.length > 1;
  
  // Handle view selection change
  const handleViewChange = (newViewName: string) => {
    setSelectedViewName(newViewName);
    replaceView(index, newViewName);
  };
  
  // Handle add view
  const handleAddView = () => {
    addView(view.name, index);
  };
  
  // Handle remove view
  const handleRemoveView = () => {
    if (canRemove) {
      removeView(index);
    }
  };
  
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: `${width}px`,
    height: `${height}px`,
    border: '1px solid #ccc',
  };
  
  const layersContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden', // Prevent content from spilling out
  };
  
  const controlsStyle: React.CSSProperties = {
    position: 'absolute',
    top: '1px',
    left: '1px',
    width: 'calc(100% - 2px)',
    height: 'calc(100% - 2px)',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    border: '1px solid black',
    visibility: showControls ? 'visible' : 'hidden',
    pointerEvents: showControls ? 'auto' : 'none',
    zIndex: 1000,
  };
  
  return (
    <div ref={containerRef} style={containerStyle}>
      {/* Layers Container */}
      <div style={layersContainerStyle}>
        {/* RGB/Image Layer */}
        {view.type === 'image' && (
          <ReactRGBLayer
            view={view}
            width={width}
            height={height}
            imageId={imageId}
            zIndex={1}
          />
        )}
        
        {/* Bing Map Layer */}
        {view.type === 'bingmap' && (
          <ReactBingLayer
            view={view}
            width={width}
            height={height}
            imageLocation={imageLocation}
            onLocationChange={onImageLocationChange}
            zIndex={1}
          />
        )}
        
        {/* Mask Layer (only for image views) */}
        {view.type === 'image' && (
          <ReactMaskLayer
            view={view}
            width={width}
            height={height}
            zIndex={2}
          />
        )}
        
        {/* Preview Layer (only for image views) */}
        {view.type === 'image' && (
          <ReactPreviewLayer
            view={view}
            width={width}
            height={height}
            zIndex={3}
          />
        )}
      </div>
      
      {/* Controls Overlay */}
      <div style={controlsStyle}>
        {/* Add View Button */}
        <button
          style={{
            position: 'absolute',
            right: '10px',
            top: '10px',
            width: '30px',
            height: '30px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
          onClick={handleAddView}
          title="Add view"
        >
          +
        </button>
        
        {/* Remove View Button */}
        {canRemove && (
          <button
            style={{
              position: 'absolute',
              right: '50px',
              top: '10px',
              width: '30px',
              height: '30px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
            onClick={handleRemoveView}
            title="Remove view"
          >
            -
          </button>
        )}
        
        {/* View Selector */}
        <select
          value={selectedViewName}
          onChange={(e) => handleViewChange(e.target.value)}
          style={{
            position: 'absolute',
            left: '10px',
            top: '10px',
            width: '130px',
            height: '30px',
            cursor: 'pointer',
          }}
        >
          {Object.values(views).map((v) => (
            <option key={v.name} value={v.name}>
              {v.name}
            </option>
          ))}
        </select>
        
        {/* View Description */}
        <p
          style={{
            position: 'absolute',
            left: '10px',
            bottom: '10px',
            right: '10px',
            margin: 0,
            fontSize: '12px',
            color: '#333',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '4px 8px',
            borderRadius: '4px',
            maxWidth: `${width - 40}px`,
            wordWrap: 'break-word',
          }}
        >
          {view.description}
        </p>
      </div>
    </div>
  );
};

export default ReactViewPort;