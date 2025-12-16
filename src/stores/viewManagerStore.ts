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
  
  // Filters (synced with segmentationStore)
  filters: ViewFilters;
  
  // Canvas dimensions
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
  
  // View management
  addView: (name: string, position?: number) => void;
  removeView: (position: number) => void;
  replaceView: (position: number, name: string) => void;
  showNextGroup: () => void;
  getCurrentViews: () => ViewConfig[];
  
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
  
  getCurrentViews: () => {
    const { views, viewGroups, currentGroup } = get();
    const viewNames = viewGroups[currentGroup] || [];
    return viewNames.map(name => views[name]).filter(Boolean);
  },
  
  // Canvas sizing
  calculateViewDimensions: () => {
    const { imageAspectRatio } = get();
    const currentViews = get().getCurrentViews();
    
    const horizontalSpacing = 10;
    const verticalSpacing = 150;
    
    const allowedWidth = Math.round(
      (window.innerWidth - horizontalSpacing) / currentViews.length
    );
    const allowedHeight = window.innerHeight - verticalSpacing;
    
    const idealWidth = Math.min(
      allowedWidth,
      allowedHeight * imageAspectRatio
    );
    const idealHeight = Math.min(
      idealWidth / imageAspectRatio,
      allowedHeight
    );
    
    const scaleFromVerticalLimit = Math.max(1, idealHeight / allowedHeight);
    const width = Math.round(idealWidth / scaleFromVerticalLimit);
    const height = Math.round(width / imageAspectRatio);
    
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
        const aspectRatio = w.vars.image_shape[0] / w.vars.image_shape[1];
        console.log('🔧 ViewManager: Setting aspect ratio:', aspectRatio);
        store.setImageAspectRatio(aspectRatio);
      }
      
      // Sync filters with segmentation store
      if (w.vars.vm?.filters) {
        console.log('🔧 ViewManager: Syncing filters:', w.vars.vm.filters);
        store.setFilters(w.vars.vm.filters);
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
  
  // Initialize debug mode from legacy vars
  const w = window as any;
  if (w.vars?.debug_mode) {
    useViewManagerStore.getState().setDebugMode(true);
  }
  
  // Expose render function to legacy code during migration
  if (!w.reactViewManager) {
    w.reactViewManager = {};
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
}