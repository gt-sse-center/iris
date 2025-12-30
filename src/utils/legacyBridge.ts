/**
 * Legacy Bridge Utilities
 * 
 * Helper functions to bridge between legacy JavaScript and React components
 * during the migration process.
 */

// Bridge function to trigger React mask layer renders from legacy code
export const triggerReactMaskRender = (bbox?: [number, number, number, number]) => {
  const event = new CustomEvent('react-mask-render', { 
    detail: { bbox } 
  });
  window.dispatchEvent(event);
};

// Bridge function to trigger React preview layer renders from legacy code
export const triggerReactPreviewRender = () => {
  const event = new CustomEvent('react-preview-render');
  window.dispatchEvent(event);
};

// Bridge function to get React layers (similar to legacy vm.getLayers)
export const getReactLayers = (type?: string) => {
  const w = window as any;
  const allLayers = [
    ...(w.reactRGBLayers || []),
    ...(w.reactMaskLayers || []),
    ...(w.reactPreviewLayers || []),
    ...(w.reactBingLayers || []),
  ];
  
  if (type) {
    return allLayers.filter((layer: any) => layer.type === type);
  }
  
  return allLayers;
};

// Bridge function to render all React layers
export const renderAllReactLayers = (layerType?: string) => {
  const layers = getReactLayers(layerType);
  layers.forEach((layer: any) => {
    if (layer.render) {
      layer.render();
    }
  });
};

// Initialize legacy bridge functions on window
if (typeof window !== 'undefined') {
  const w = window as any;
  
  // Override legacy render_mask function to also trigger React renders
  const originalRenderMask = w.render_mask;
  w.render_mask = (bbox?: [number, number, number, number]) => {
    console.log('[IRIS] Legacy bridge render_mask called with bbox:', bbox);
    
    // Call original legacy function
    if (originalRenderMask) {
      originalRenderMask(bbox);
    }
    
    // For React mask renders, we need to be careful about bbox handling
    // If bbox is provided, check if we're using a round brush
    let reactBbox = bbox;
    if (bbox && w.getToolShapeFromStore) {
      const toolShape = w.getToolShapeFromStore();
      console.log('[IRIS] Legacy bridge detected tool shape:', toolShape);
      if (toolShape === 'round') {
        // For round brushes, force full re-render to show circular shape properly
        console.log('[IRIS] Legacy bridge: forcing full re-render for round brush');
        reactBbox = undefined;
      }
    }
    
    console.log('[IRIS] Legacy bridge: triggering React render with bbox:', reactBbox);
    // Trigger React mask renders
    triggerReactMaskRender(reactBbox);
  };
  
  // Override legacy render_preview function
  const originalRenderPreview = w.render_preview;
  w.render_preview = () => {
    // Call original legacy function
    if (originalRenderPreview) {
      originalRenderPreview();
    }
    
    // Also trigger React preview renders
    triggerReactPreviewRender();
  };
  
  // Override legacy zoom function to trigger React re-renders
  const originalZoom = w.zoom;
  w.zoom = (delta: number) => {
    // Call original legacy zoom function
    if (originalZoom) {
      originalZoom(delta);
    }
    
    // Trigger React canvas re-renders after zoom
    setTimeout(() => {
      const event = new CustomEvent('iris-transform-change');
      window.dispatchEvent(event);
    }, 0);
  };
  
  // Override legacy move function to trigger React re-renders
  const originalMove = w.move;
  w.move = (dx: number, dy: number) => {
    // Call original legacy move function
    if (originalMove) {
      originalMove(dx, dy);
    }
    
    // Trigger React canvas re-renders after move
    setTimeout(() => {
      const event = new CustomEvent('iris-transform-change');
      window.dispatchEvent(event);
    }, 0);
  };
  
  // Add React layer management to legacy vm object
  if (w.vars?.vm) {
    const originalGetLayers = w.vars.vm.getLayers;
    w.vars.vm.getReactLayers = getReactLayers;
    w.vars.vm.renderReactLayers = renderAllReactLayers;
    
    // Override getLayers to include React layers
    w.vars.vm.getLayers = (type?: string, exclude = false) => {
      const legacyLayers = originalGetLayers ? originalGetLayers(type, exclude) : [];
      const reactLayers = getReactLayers(type);
      return [...legacyLayers, ...reactLayers];
    };
  }
  
  // Expose bridge functions globally for debugging
  w.reactBridge = {
    triggerReactMaskRender,
    triggerReactPreviewRender,
    getReactLayers,
    renderAllReactLayers,
  };
}