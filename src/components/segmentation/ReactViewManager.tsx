/**
 * React ViewManager Component
 * 
 * This component replaces the legacy ViewManager class with a React-based implementation.
 * It manages multiple ViewPorts and their associated layers (RGB, Mask, Preview, etc.).
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useViewManagerStore } from '../../stores/viewManagerStore';

import ReactViewPort from './ReactViewPort';

interface ReactViewManagerProps {
  className?: string;
  style?: React.CSSProperties;
}

const ReactViewManager: React.FC<ReactViewManagerProps> = ({ 
  className = '',
  style = {} 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Store subscriptions
  const {
    currentGroup,
    viewWidth,
    viewHeight,
    showControls,
    imageId,
    imageLocation,
    getCurrentViews,
    updateViewDimensions,
    setImageLocation,
  } = useViewManagerStore();
  
  const currentViews = getCurrentViews();
  
  // Update dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      updateViewDimensions();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateViewDimensions]);
  
  // Initialize dimensions on mount
  useEffect(() => {
    updateViewDimensions();
  }, [updateViewDimensions, currentViews.length]);
  
  // Handle image location changes (for Bing maps, etc.)
  const handleImageLocationChange = useCallback((newLocation: [number, number]) => {
    setImageLocation(newLocation);
  }, [setImageLocation]);
  
  // Render function for all viewports
  const renderAllViewPorts = useCallback(() => {
    // This will trigger re-render of all viewport canvases
    // Similar to the legacy vm.render() function
  }, []);
  
  // Expose render function to legacy code during migration
  useEffect(() => {
    const w = window as any;
    if (!w.reactViewManager) {
      w.reactViewManager = {};
    }
    w.reactViewManager.render = renderAllViewPorts;
  }, [renderAllViewPorts]);
  
  if (!imageId || currentViews.length === 0) {
    const w = window as any;
    const debugInfo = {
      imageId,
      currentViewsLength: currentViews.length,
      hasVars: !!w.vars,
      hasConfig: !!w.vars?.config,
      hasViews: !!w.vars?.config?.views,
      viewsType: typeof w.vars?.config?.views,
      viewsKeys: w.vars?.config?.views ? Object.keys(w.vars.config.views) : [],
    };
    
    return (
      <div 
        ref={containerRef}
        className={`react-view-manager ${className}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          color: '#666',
          fontSize: '12px',
          padding: '20px',
          ...style
        }}
      >
        <div style={{ marginBottom: '10px', fontSize: '14px' }}>
          No views configured or image not loaded
        </div>
        <details style={{ fontSize: '10px', color: '#999' }}>
          <summary>Debug Info</summary>
          <pre style={{ marginTop: '5px', fontSize: '9px' }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className={`react-view-manager ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '0px',
        width: '100%',
        ...style
      }}
    >
      {currentViews.map((view, index) => (
        <ReactViewPort
          key={`${currentGroup}-${view.name}-${index}`}
          view={view}
          index={index}
          width={viewWidth}
          height={viewHeight}
          showControls={showControls}
          imageId={imageId}
          imageLocation={imageLocation}
          onImageLocationChange={handleImageLocationChange}
        />
      ))}
    </div>
  );
};

export default ReactViewManager;