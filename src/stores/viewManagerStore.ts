/**
 * View Manager Store (Zustand)
 * 
 * This store replaces the legacy ViewManager class and vars.vm object.
 * It manages the state for image views, layers, and canvas rendering.
 */

import { create } from 'zustand';

export interface ViewConfig {
  name: string;
  type: 'image' | 'bingmap';
  description: string;
  // Add other view properties as needed
}

export interface ViewGroup {
  [groupName: string]: string[]; // Array of view names
}

export interface ViewFilters {
  contrast: boolean;
  invert: boolean;
  brightness: number;
  saturation: number;
}

export interface DebugInfo {
  hasViews: boolean;
  viewsCount: number;
  currentGroup: string;
  imageId: string | null;
  imageLocation: [number, number];
  filters: ViewFilters;
  isInitialized: boolean;
  initializationError: string | null;
  // PHASE 3A: Additional debug info
  currentView: string | null;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  canvasDimensions: { width: number; height: number };
  mousePosition: { x: number; y: number };
  canvasMousePosition: [number, number];
  isMouseDown: boolean;
  isDragging: boolean;
}

export interface ViewManagerState {
  // Core state
  views: { [name: string]: ViewConfig };
  viewGroups: ViewGroup;
  currentGroup: string;
  imageId: string | null;
  imageLocation: [number, number];
  imageAspectRatio: number;
  showControls: boolean;
  
  // Image dimensions (replaces vars.image_shape)
  imageDimensions: { width: number; height: number } | null;
  
  // PHASE 3A: View Management State
  currentView: string | null;
  
  // PHASE 3A: Zoom & Pan State
  zoomLevel: number;
  panOffset: { x: number; y: number };
  zoomFactor: number;
  
  // PHASE 3A: Canvas State
  canvasDimensions: { width: number; height: number };
  mousePosition: { x: number; y: number };
  canvasMousePosition: [number, number]; // Canvas coordinates [x, y] in pixels (replaces vars.cursor_canvas)
  isMouseDown: boolean;
  isDragging: boolean;
  
  // Filters (synced with segmentationStore)
  filters: ViewFilters;
  
  // Canvas dimensions (legacy compatibility)
  viewWidth: number;
  viewHeight: number;
  
  // Debug state
  debugMode: boolean;
  isInitialized: boolean;
  initializationError: string | null;
  
  // Actions
  setViews: (views: { [name: string]: ViewConfig }) => void;
  setViewGroups: (groups: ViewGroup) => void;
  setCurrentGroup: (group: string) => void;
  setImage: (imageId: string, location: [number, number]) => void;
  setImageLocation: (location: [number, number]) => void;
  setImageAspectRatio: (ratio: number) => void;
  setShowControls: (show: boolean) => void;
  toggleControls: () => void;
  
  // Image dimensions actions (replaces vars.image_shape)
  setImageDimensions: (width: number, height: number) => void;
  getImageShape: () => [number, number] | null;
  getImageAspectRatio: () => number;
  
  // PHASE 3A: View Management Actions
  setCurrentView: (viewName: string | null) => void;
  switchToView: (viewName: string) => void;
  
  // PHASE 3A: Zoom & Pan Actions
  setZoomLevel: (level: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  panTo: (x: number, y: number) => void;
  resetView: () => void;
  
  // PHASE 3A: Canvas Actions
  updateCanvasDimensions: (dimensions: { width: number; height: number }) => void;
  updateMousePosition: (position: { x: number; y: number }) => void;
  setCanvasMousePosition: (coords: [number, number]) => void;
  setMouseDown: (isDown: boolean) => void;
  setDragging: (isDragging: boolean) => void;
  
  // PHASE 3A: Coordinate Transformation
  screenToImageCoordinates: (screenX: number, screenY: number) => { x: number; y: number };
  imageToScreenCoordinates: (imageX: number, imageY: number) => { x: number; y: number };
  
  // View management
  addView: (name: string, position?: number) => void;
  removeView: (position: number) => void;
  replaceView: (position: number, name: string) => void;
  showNextGroup: () => void;
  showGroup: (groupName: string) => void;
  getCurrentViews: () => ViewConfig[];
  
  // Layer management
  addStandardLayer: (layerType: string, filter?: (view: ViewConfig) => boolean) => void;
  getLayers: (layerType?: string) => any[];
  
  // Rendering methods
  render: () => void;
  renderMask: () => void;
  renderPreview: () => void;
  
  // Size management
  updateSize: () => void;
  
  // Canvas sizing
  calculateViewDimensions: () => [number, number];
  updateViewDimensions: () => void;
  
  // Filters
  setFilters: (filters: Partial<ViewFilters>) => void;
  resetFilters: () => void;
  
  // Debug actions
  setDebugMode: (enabled: boolean) => void;
  getDebugInfo: () => DebugInfo;
  initializeFromLegacy: () => Promise<void>;
  retryInitialization: () => void;
}

export const useViewManagerStore = create<ViewManagerState>((set, get) => ({
  // Initial state
  views: {},
  viewGroups: { default: [] },
  currentGroup: 'default',
  imageId: null,
  imageLocation: [0, 0],
  imageAspectRatio: 1,
  showControls: false,
  
  // Image dimensions (replaces vars.image_shape)
  imageDimensions: null,
  
  // PHASE 3A: View Management State
  currentView: null,
  
  // PHASE 3A: Zoom & Pan State
  zoomLevel: 1.0,
  panOffset: { x: 0, y: 0 },
  zoomFactor: 1.0,
  
  // PHASE 3A: Canvas State
  canvasDimensions: { width: 400, height: 400 },
  mousePosition: { x: 0, y: 0 },
  canvasMousePosition: [0, 0], // Canvas coordinates [x, y] in pixels (replaces vars.cursor_canvas)
  isMouseDown: false,
  isDragging: false,
  
  filters: {
    contrast: false,
    invert: false,
    brightness: 100,
    saturation: 100,
  },
  
  viewWidth: 400,
  viewHeight: 400,
  
  // Debug state
  debugMode: false,
  isInitialized: false,
  initializationError: null,
  
  // Actions
  setViews: (views) => set({ views }),
  
  setViewGroups: (viewGroups) => set({ viewGroups }),
  
  setCurrentGroup: (currentGroup) => set({ currentGroup }),
  
  setImage: (imageId, imageLocation) => {
    set({ imageId, imageLocation });
  },
  
  setImageLocation: (imageLocation) => {
    set({ imageLocation });
  },
  
  setImageAspectRatio: (imageAspectRatio) => {
    set({ imageAspectRatio });
    // Recalculate dimensions when aspect ratio changes
    get().updateViewDimensions();
  },
  
  setShowControls: (showControls) => set({ showControls }),
  
  toggleControls: () => {
    const { showControls } = get();
    set({ showControls: !showControls });
  },
  
  // Image dimensions actions (replaces vars.image_shape)
  setImageDimensions: (width, height) => {
    // Validate input
    if (typeof width !== 'number' || typeof height !== 'number' || 
        width <= 0 || height <= 0 || isNaN(width) || isNaN(height)) {
      console.error('[IRIS] setImageDimensions: Invalid dimensions', { width, height });
      return;
    }

    const aspectRatio = width / height;
    set({ 
      imageDimensions: { width, height },
      imageAspectRatio: aspectRatio
    });

    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.image_shape = [width, height];
    }

    // Update view dimensions when image dimensions change
    get().updateViewDimensions();
  },

  getImageShape: () => {
    const { imageDimensions } = get();
    return imageDimensions ? [imageDimensions.width, imageDimensions.height] : null;
  },

  getImageAspectRatio: () => {
    const { imageDimensions } = get();
    return imageDimensions ? imageDimensions.width / imageDimensions.height : 1;
  },
  
  // PHASE 3A: View Management Actions
  setCurrentView: (currentView) => {
    set({ currentView });
    
    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars?.vm) {
      w.vars.vm.current_view = currentView;
    }
  },
  
  switchToView: (viewName) => {
    const { views } = get();
    if (views[viewName]) {
      get().setCurrentView(viewName);
      
      // Trigger legacy view update if available
      const w = window as any;
      if (w.set_view) {
        w.set_view(viewName);
      }
    } else {
      console.warn(`[ViewManager] View '${viewName}' not found`);
    }
  },
  
  // PHASE 3A: Zoom & Pan Actions
  setZoomLevel: (zoomLevel) => {
    const clampedZoom = Math.max(0.1, Math.min(10.0, zoomLevel));
    set({ zoomLevel: clampedZoom, zoomFactor: clampedZoom });
    
    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars?.vm) {
      w.vars.vm.zoom_level = clampedZoom;
      w.vars.vm.zoom_factor = clampedZoom;
    }
    
    // Trigger legacy zoom update if available
    if (w.update_zoom) {
      w.update_zoom(clampedZoom);
    }
  },
  
  zoomIn: () => {
    const { zoomLevel } = get();
    const newZoom = Math.min(10.0, zoomLevel * 1.2);
    get().setZoomLevel(newZoom);
  },
  
  zoomOut: () => {
    const { zoomLevel } = get();
    const newZoom = Math.max(0.1, zoomLevel / 1.2);
    get().setZoomLevel(newZoom);
  },
  
  setPanOffset: (panOffset) => {
    set({ panOffset });
    
    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars?.vm) {
      w.vars.vm.pan_offset = panOffset;
    }
    
    // Trigger legacy pan update if available
    if (w.update_pan) {
      w.update_pan(panOffset.x, panOffset.y);
    }
  },
  
  panTo: (x, y) => {
    get().setPanOffset({ x, y });
  },
  
  resetView: () => {
    set({ 
      zoomLevel: 1.0, 
      zoomFactor: 1.0, 
      panOffset: { x: 0, y: 0 } 
    });
    
    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars?.vm) {
      w.vars.vm.zoom_level = 1.0;
      w.vars.vm.zoom_factor = 1.0;
      w.vars.vm.pan_offset = { x: 0, y: 0 };
    }
    
    // Trigger legacy reset if available
    if (w.reset_view) {
      w.reset_view();
    }
  },
  
  // PHASE 3A: Canvas Actions
  updateCanvasDimensions: (canvasDimensions) => {
    set({ 
      canvasDimensions,
      viewWidth: canvasDimensions.width,
      viewHeight: canvasDimensions.height
    });
    
    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.canvas_width = canvasDimensions.width;
      w.vars.canvas_height = canvasDimensions.height;
    }
  },
  
  updateMousePosition: (mousePosition) => {
    set({ mousePosition });
    
    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.mouse_x = mousePosition.x;
      w.vars.mouse_y = mousePosition.y;
    }
  },

  setCanvasMousePosition: (coords) => {
    // Validate coordinates
    if (!Array.isArray(coords) || coords.length !== 2 || 
        typeof coords[0] !== 'number' || typeof coords[1] !== 'number' ||
        isNaN(coords[0]) || isNaN(coords[1])) {
      console.warn('[IRIS] setCanvasMousePosition: Invalid coordinates', coords);
      return;
    }

    const coordsCopy: [number, number] = [coords[0], coords[1]];
    set({ canvasMousePosition: coordsCopy });

    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.cursor_canvas = coordsCopy;
    }
  },
  
  setMouseDown: (isMouseDown) => {
    set({ isMouseDown });
    
    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.mouse_down = isMouseDown;
    }
  },
  
  setDragging: (isDragging) => {
    set({ isDragging });
    
    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.dragging = isDragging;
    }
  },
  
  // PHASE 3A: Coordinate Transformation
  screenToImageCoordinates: (screenX, screenY) => {
    const { zoomLevel, panOffset, canvasDimensions } = get();
    
    // Transform screen coordinates to image coordinates
    const imageX = (screenX - canvasDimensions.width / 2 - panOffset.x) / zoomLevel;
    const imageY = (screenY - canvasDimensions.height / 2 - panOffset.y) / zoomLevel;
    
    return { x: imageX, y: imageY };
  },
  
  imageToScreenCoordinates: (imageX, imageY) => {
    const { zoomLevel, panOffset, canvasDimensions } = get();
    
    // Transform image coordinates to screen coordinates
    const screenX = imageX * zoomLevel + canvasDimensions.width / 2 + panOffset.x;
    const screenY = imageY * zoomLevel + canvasDimensions.height / 2 + panOffset.y;
    
    return { x: screenX, y: screenY };
  },
  
  // View management
  addView: (name, position = -1) => {
    const { viewGroups, currentGroup } = get();
    const newGroups = { ...viewGroups };
    const currentViews = [...newGroups[currentGroup]];
    
    if (position === -1) {
      currentViews.push(name);
    } else {
      currentViews.splice(position, 0, name);
    }
    
    newGroups[currentGroup] = currentViews;
    set({ viewGroups: newGroups });
  },
  
  removeView: (position) => {
    const { viewGroups, currentGroup } = get();
    const newGroups = { ...viewGroups };
    const currentViews = [...newGroups[currentGroup]];
    
    if (currentViews.length > 1) { // Don't allow removing the last view
      currentViews.splice(position, 1);
      newGroups[currentGroup] = currentViews;
      set({ viewGroups: newGroups });
    }
  },
  
  replaceView: (position, name) => {
    const { viewGroups, currentGroup } = get();
    const newGroups = { ...viewGroups };
    const currentViews = [...newGroups[currentGroup]];
    
    currentViews[position] = name;
    newGroups[currentGroup] = currentViews;
    set({ viewGroups: newGroups });
  },
  
  showNextGroup: () => {
    const { viewGroups, currentGroup } = get();
    const groups = Object.keys(viewGroups);
    const currentIndex = groups.indexOf(currentGroup);
    const nextIndex = currentIndex >= groups.length - 1 ? 0 : currentIndex + 1;
    const nextGroup = groups[nextIndex];
    
    set({ currentGroup: nextGroup });
    
    // Show message (if available)
    const w = window as any;
    if (w.show_message) {
      w.show_message(`Group: <i>${nextGroup}</i>`);
    }
  },
  
  showGroup: (groupName) => {
    const { viewGroups } = get();
    if (viewGroups[groupName]) {
      set({ currentGroup: groupName });
      
      // Show message (if available)
      const w = window as any;
      if (w.show_message) {
        w.show_message(`Group: <i>${groupName}</i>`);
      }
    } else {
      console.warn(`[ViewManager] Group '${groupName}' not found`);
    }
  },
  
  getCurrentViews: () => {
    const { views, viewGroups, currentGroup } = get();
    const viewNames = viewGroups[currentGroup] || [];
    return viewNames.map(name => views[name]).filter(Boolean);
  },
  
  // Layer management
  addStandardLayer: (layerType, filter) => {
    // This is a placeholder implementation for compatibility
    // In the legacy system, this would add layers to the canvas
    console.log(`[ViewManager] addStandardLayer: ${layerType}`, { filter });
    
    // For now, just log the operation - actual layer management
    // will be handled by React components in the new system
  },
  
  getLayers: (layerType) => {
    // This is a placeholder implementation for compatibility
    // In the legacy system, this would return canvas layers
    console.log(`[ViewManager] getLayers: ${layerType || 'all'}`);
    
    // Return empty array for now - actual layer management
    // will be handled by React components in the new system
    return [];
  },
  
  // Rendering methods
  render: () => {
    // This is a placeholder implementation for compatibility
    // In the legacy system, this would trigger canvas rendering
    console.log('[ViewManager] render: Triggering render');
    
    // Trigger legacy render if available
    const w = window as any;
    if (w.render_views) {
      w.render_views();
    }
  },
  
  renderMask: () => {
    // This is a placeholder implementation for compatibility
    console.log('[ViewManager] renderMask: Triggering mask render');
    
    // Trigger legacy mask render if available
    const w = window as any;
    if (w.render_mask) {
      w.render_mask();
    }
  },
  
  renderPreview: () => {
    // This is a placeholder implementation for compatibility
    console.log('[ViewManager] renderPreview: Triggering preview render');
    
    // Trigger legacy preview render if available
    const w = window as any;
    if (w.render_preview) {
      w.render_preview();
    }
  },
  
  // Size management
  updateSize: () => {
    // Update view dimensions based on current state
    get().updateViewDimensions();
    
    // Trigger legacy size update if available
    const w = window as any;
    if (w.update_canvas_size) {
      w.update_canvas_size();
    }
    
    console.log('[ViewManager] updateSize: Updated canvas dimensions');
  },
  
  // Canvas sizing
  calculateViewDimensions: () => {
    const { imageDimensions } = get();
    const currentViews = get().getCurrentViews();
    
    // Use imageDimensions for aspect ratio if available, fallback to imageAspectRatio
    const aspectRatio = imageDimensions ? 
      imageDimensions.width / imageDimensions.height : 
      get().imageAspectRatio;
    
    const horizontalSpacing = 10;
    const verticalSpacing = 150;
    
    const allowedWidth = Math.round(
      (window.innerWidth - horizontalSpacing) / currentViews.length
    );
    const allowedHeight = window.innerHeight - verticalSpacing;
    
    const idealWidth = Math.min(
      allowedWidth,
      allowedHeight * aspectRatio
    );
    const idealHeight = Math.min(
      idealWidth / aspectRatio,
      allowedHeight
    );
    
    const scaleFromVerticalLimit = Math.max(1, idealHeight / allowedHeight);
    const width = Math.round(idealWidth / scaleFromVerticalLimit);
    const height = Math.round(width / aspectRatio);
    
    return [width, height];
  },
  
  updateViewDimensions: () => {
    const [width, height] = get().calculateViewDimensions();
    set({ viewWidth: width, viewHeight: height });
  },
  
  // Filters
  setFilters: (newFilters) => {
    const { filters } = get();
    set({ filters: { ...filters, ...newFilters } });
  },
  
  resetFilters: () => {
    set({
      filters: {
        contrast: false,
        invert: false,
        brightness: 100,
        saturation: 100,
      }
    });
  },
  
  // Debug actions
  setDebugMode: (debugMode) => set({ debugMode }),
  
  getDebugInfo: () => {
    const state = get();
    return {
      hasViews: Object.keys(state.views).length > 0,
      viewsCount: Object.keys(state.views).length,
      currentGroup: state.currentGroup,
      imageId: state.imageId,
      imageLocation: state.imageLocation,
      filters: state.filters,
      isInitialized: state.isInitialized,
      initializationError: state.initializationError,
      // PHASE 3A: Additional debug info
      currentView: state.currentView,
      zoomLevel: state.zoomLevel,
      panOffset: state.panOffset,
      canvasDimensions: state.canvasDimensions,
      mousePosition: state.mousePosition,
      canvasMousePosition: state.canvasMousePosition,
      isMouseDown: state.isMouseDown,
      isDragging: state.isDragging,
    };
  },
  
  initializeFromLegacy: async () => {
    try {
      set({ initializationError: null });
      
      const w = window as any;
      if (!w.vars) {
        throw new Error('Legacy vars not available');
      }
      
      console.log('🔧 ViewManager: Initializing from legacy vars...', {
        hasVars: !!w.vars,
        hasConfig: !!w.vars?.config,
        hasViews: !!w.vars?.config?.views,
        viewsType: typeof w.vars?.config?.views,
        viewsKeys: w.vars?.config?.views ? Object.keys(w.vars.config.views) : [],
        hasViewGroups: !!w.vars?.config?.view_groups,
        imageId: w.vars?.image_id,
      });
      
      const store = get();
      
      // Initialize from legacy vars
      if (w.vars.config?.views) {
        const views: { [name: string]: ViewConfig } = {};
        
        // Handle both array and object formats
        if (Array.isArray(w.vars.config.views)) {
          // Array format (legacy)
          console.log('🔧 ViewManager: Processing views as array format');
          w.vars.config.views.forEach((view: any) => {
            views[view.name] = {
              name: view.name,
              type: view.type || 'image',
              description: view.description || '',
            };
          });
        } else if (typeof w.vars.config.views === 'object') {
          // Object format (current)
          console.log('🔧 ViewManager: Processing views as object format');
          Object.entries(w.vars.config.views).forEach(([name, view]: [string, any]) => {
            views[name] = {
              name: name,
              type: view.type || 'image',
              description: view.description || '',
            };
          });
        }
        
        console.log('🔧 ViewManager: Setting views:', Object.keys(views));
        store.setViews(views);
      } else {
        console.warn('⚠️ ViewManager: No views found in legacy config');
      }
      
      if (w.vars.config?.view_groups) {
        console.log('🔧 ViewManager: Setting view groups:', w.vars.config.view_groups);
        store.setViewGroups(w.vars.config.view_groups);
      } else {
        console.warn('⚠️ ViewManager: No view groups found, using default');
        // Ensure we have at least a default group with some views
        const currentViews = Object.keys(get().views);
        if (currentViews.length > 0) {
          store.setViewGroups({ default: currentViews.slice(0, 3) });
        }
      }
      
      if (w.vars.image_id) {
        console.log('🔧 ViewManager: Setting image:', w.vars.image_id);
        store.setImage(w.vars.image_id, w.vars.image_location || [0, 0]);
      } else {
        console.warn('⚠️ ViewManager: No image ID found in legacy vars');
      }
      
      // Set image aspect ratio from legacy vars
      if (w.vars.image_shape && w.vars.image_shape.length >= 2) {
        const [width, height] = w.vars.image_shape;
        console.log('🔧 ViewManager: Setting image dimensions:', width, 'x', height);
        store.setImageDimensions(width, height);
      } else {
        console.warn('⚠️ ViewManager: No image shape found in legacy vars');
      }
      
      // Sync filters with segmentation store
      if (w.vars.vm?.filters) {
        console.log('🔧 ViewManager: Syncing filters:', w.vars.vm.filters);
        store.setFilters(w.vars.vm.filters);
      }
      
      // PHASE 3A: Initialize zoom/pan/canvas state from legacy vars
      if (w.vars.vm) {
        if (typeof w.vars.vm.zoom_level === 'number') {
          console.log('🔧 ViewManager: Setting zoom level:', w.vars.vm.zoom_level);
          store.setZoomLevel(w.vars.vm.zoom_level);
        }
        
        if (w.vars.vm.pan_offset) {
          console.log('🔧 ViewManager: Setting pan offset:', w.vars.vm.pan_offset);
          store.setPanOffset(w.vars.vm.pan_offset);
        }
        
        if (w.vars.vm.current_view) {
          console.log('🔧 ViewManager: Setting current view:', w.vars.vm.current_view);
          store.setCurrentView(w.vars.vm.current_view);
        }
      }
      
      // Initialize canvas dimensions from legacy vars
      if (w.vars.canvas_width && w.vars.canvas_height) {
        console.log('🔧 ViewManager: Setting canvas dimensions:', w.vars.canvas_width, 'x', w.vars.canvas_height);
        store.updateCanvasDimensions({
          width: w.vars.canvas_width,
          height: w.vars.canvas_height
        });
      }
      
      // Initialize mouse position from legacy vars
      if (typeof w.vars.mouse_x === 'number' && typeof w.vars.mouse_y === 'number') {
        store.updateMousePosition({
          x: w.vars.mouse_x,
          y: w.vars.mouse_y
        });
      }

      // Initialize canvas mouse position from legacy vars
      if (w.vars.cursor_canvas && Array.isArray(w.vars.cursor_canvas) && w.vars.cursor_canvas.length === 2) {
        console.log('🔧 ViewManager: Setting canvas mouse position:', w.vars.cursor_canvas);
        store.setCanvasMousePosition(w.vars.cursor_canvas);
      }
      
      set({ isInitialized: true });
      console.log('✅ ViewManager: Initialization complete');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ ViewManager: Initialization failed:', errorMessage);
      set({ 
        isInitialized: false, 
        initializationError: errorMessage 
      });
      throw error;
    }
  },
  
  retryInitialization: () => {
    const { initializeFromLegacy } = get();
    initializeFromLegacy().catch(console.error);
  },
}));

// Legacy initialization function (kept for backward compatibility)
export const initializeViewManagerFromLegacy = () => {
  const store = useViewManagerStore.getState();
  return store.initializeFromLegacy();
};

// Bridge for legacy JavaScript access during migration
if (typeof window !== 'undefined') {
  (window as any).viewManagerStore = useViewManagerStore;
  (window as any).initializeViewManagerFromLegacy = initializeViewManagerFromLegacy;
  
  // PHASE 3A: Legacy bridge functions for zoom/pan/view operations
  (window as any).reactViewManager = {
    // View management
    setView: (viewName: string) => useViewManagerStore.getState().switchToView(viewName),
    getCurrentView: () => useViewManagerStore.getState().currentView,
    
    // Zoom operations
    zoomIn: () => useViewManagerStore.getState().zoomIn(),
    zoomOut: () => useViewManagerStore.getState().zoomOut(),
    setZoom: (level: number) => useViewManagerStore.getState().setZoomLevel(level),
    getZoom: () => useViewManagerStore.getState().zoomLevel,
    
    // Pan operations
    panTo: (x: number, y: number) => useViewManagerStore.getState().panTo(x, y),
    getPanOffset: () => useViewManagerStore.getState().panOffset,
    
    // Canvas operations
    updateCanvasSize: (width: number, height: number) => 
      useViewManagerStore.getState().updateCanvasDimensions({ width, height }),
    getCanvasSize: () => useViewManagerStore.getState().canvasDimensions,
    
    // Mouse operations
    updateMouse: (x: number, y: number) => 
      useViewManagerStore.getState().updateMousePosition({ x, y }),
    setCanvasMousePosition: (x: number, y: number) =>
      useViewManagerStore.getState().setCanvasMousePosition([x, y]),
    getCanvasMousePosition: () => useViewManagerStore.getState().canvasMousePosition,
    setMouseDown: (isDown: boolean) => useViewManagerStore.getState().setMouseDown(isDown),
    
    // Coordinate transformation
    screenToImage: (x: number, y: number) => 
      useViewManagerStore.getState().screenToImageCoordinates(x, y),
    imageToScreen: (x: number, y: number) => 
      useViewManagerStore.getState().imageToScreenCoordinates(x, y),
    
    // Reset operations
    resetView: () => useViewManagerStore.getState().resetView(),
  };
  
  // Helper functions for legacy JavaScript access during migration
  (window as any).getCanvasMousePositionFromStore = () => {
    return useViewManagerStore.getState().canvasMousePosition;
  };
  
  (window as any).setCanvasMousePositionInStore = (x: number, y: number) => {
    useViewManagerStore.getState().setCanvasMousePosition([x, y]);
  };
  
  // Initialize debug mode from legacy vars
  const w = window as any;
  if (w.vars?.debug_mode) {
    useViewManagerStore.getState().setDebugMode(true);
  }
  
  // Auto-initialize when legacy vars become available
  const checkForLegacyVars = () => {
    if (w.vars && w.vars.config && w.vars.config.views && !useViewManagerStore.getState().isInitialized) {
      console.log('🔧 ViewManager: Auto-initializing from detected legacy vars');
      useViewManagerStore.getState().initializeFromLegacy().catch(console.error);
    }
  };
  
  // Check immediately
  checkForLegacyVars();
  
  // Also check periodically for the first 10 seconds
  const checkInterval = setInterval(() => {
    checkForLegacyVars();
    if (useViewManagerStore.getState().isInitialized) {
      clearInterval(checkInterval);
    }
  }, 500);
  
  setTimeout(() => clearInterval(checkInterval), 10000);
  
  // Also expose for debugging
  (window as any).debugViewManager = () => {
    console.log('=== ViewManager Debug Info ===');
    console.log('Legacy vars:', w.vars);
    console.log('React store:', useViewManagerStore.getState());
    console.log('Views type:', typeof w.vars?.config?.views);
    console.log('Views keys:', w.vars?.config?.views ? Object.keys(w.vars.config.views) : []);
  };
  
  // Helper functions for legacy JavaScript access to image dimensions
  (window as any).getImageShapeFromStore = (): [number, number] | null => {
    const shape = useViewManagerStore.getState().getImageShape();
    if (!shape) {
      console.warn('⚠️ [IRIS Migration] getImageShapeFromStore: No image dimensions in React store - migration may be incomplete');
    }
    return shape;
  };
  
  (window as any).setImageShapeInStore = (width: number, height: number) => {
    useViewManagerStore.getState().setImageDimensions(width, height);
  };
  
  (window as any).getImageWidthFromStore = (): number => {
    const dimensions = useViewManagerStore.getState().imageDimensions;
    if (!dimensions) {
      console.warn('⚠️ [IRIS Migration] getImageWidthFromStore: No image dimensions in React store - migration may be incomplete');
      return 0;
    }
    return dimensions.width;
  };
  
  (window as any).getImageHeightFromStore = (): number => {
    const dimensions = useViewManagerStore.getState().imageDimensions;
    if (!dimensions) {
      console.warn('⚠️ [IRIS Migration] getImageHeightFromStore: No image dimensions in React store - migration may be incomplete');
      return 0;
    }
    return dimensions.height;
  };
  
  (window as any).getImageAspectRatioFromStore = (): number => {
    const ratio = useViewManagerStore.getState().getImageAspectRatio();
    if (ratio === 1) {
      // Check if this is the default value (no dimensions set)
      const dimensions = useViewManagerStore.getState().imageDimensions;
      if (!dimensions) {
        console.warn('⚠️ [IRIS Migration] getImageAspectRatioFromStore: No image dimensions in React store - using default ratio 1.0');
      }
    }
    return ratio;
  };
}