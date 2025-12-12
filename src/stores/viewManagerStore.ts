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
}));

// Initialize from legacy vars when available
export const initializeViewManagerFromLegacy = () => {
  const w = window as any;
  if (w.vars) {
    const store = useViewManagerStore.getState();
    
    // Initialize from legacy vars
    if (w.vars.config?.views) {
      const views: { [name: string]: ViewConfig } = {};
      
      // Handle both array and object formats
      if (Array.isArray(w.vars.config.views)) {
        // Array format (legacy)
        w.vars.config.views.forEach((view: any) => {
          views[view.name] = {
            name: view.name,
            type: view.type || 'image',
            description: view.description || '',
          };
        });
      } else if (typeof w.vars.config.views === 'object') {
        // Object format (current)
        Object.entries(w.vars.config.views).forEach(([name, view]: [string, any]) => {
          views[name] = {
            name: name,
            type: view.type || 'image',
            description: view.description || '',
          };
        });
      }
      
      store.setViews(views);
    }
    
    if (w.vars.config?.view_groups) {
      store.setViewGroups(w.vars.config.view_groups);
    }
    
    if (w.vars.image_id) {
      store.setImage(w.vars.image_id, w.vars.image_location || [0, 0]);
    }
    
    // Set image aspect ratio from legacy vars
    if (w.vars.image_shape && w.vars.image_shape.length >= 2) {
      const aspectRatio = w.vars.image_shape[0] / w.vars.image_shape[1];
      store.setImageAspectRatio(aspectRatio);
    }
    
    // Sync filters with segmentation store
    if (w.vars.vm?.filters) {
      store.setFilters(w.vars.vm.filters);
    }
  }
};

// Bridge for legacy JavaScript access during migration
if (typeof window !== 'undefined') {
  (window as any).viewManagerStore = useViewManagerStore;
  (window as any).initializeViewManagerFromLegacy = initializeViewManagerFromLegacy;
  
  // Also expose for debugging
  (window as any).debugViewManager = () => {
    const w = window as any;
    console.log('=== ViewManager Debug Info ===');
    console.log('Legacy vars:', w.vars);
    console.log('React store:', useViewManagerStore.getState());
    console.log('Views type:', typeof w.vars?.config?.views);
    console.log('Views keys:', w.vars?.config?.views ? Object.keys(w.vars.config.views) : []);
  };
}