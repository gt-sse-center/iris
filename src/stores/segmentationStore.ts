/**
 * Segmentation Store (Zustand)
 * 
 * This store gradually replaces the global `vars` object from legacy JavaScript.
 * During migration, the store syncs with legacy code via window bridge.
 * 
 * Migration Status:
 * - [x] showMask (vars.show_mask) - COMPLETE
 * - [x] showDialogueBeforeNextImage (vars.show_dialogue_before_next_image) - COMPLETE
 * - [x] Image Navigation (centralized image list and navigation) - IN PROGRESS
 * - [x] Image Filters (vars.vm.filters) - IN PROGRESS
 * - [ ] currentClass (vars.current_class)
 * - [ ] tool (vars.tool)
 * - [ ] config (vars.config)
 * - [ ] user (vars.user)
 * - [ ] mask data (vars.mask, vars.user_mask, etc.)
 */

import { create } from 'zustand';

interface ImageInfo {
  image_id: string;
  has_user_annotation: boolean;
  has_any_annotation: boolean;
  annotation_count: number;
}

interface SegmentationState {
  // Mask Visibility
  showMask: boolean;
  setShowMask: (visible: boolean) => void;
  toggleMask: () => void;

  // Navigation Confirmation Dialog
  showDialogueBeforeNextImage: boolean;
  setShowDialogueBeforeNextImage: (show: boolean) => void;

  // Image Navigation
  images: ImageInfo[];
  currentImageId: string | null;
  currentImageIndex: number;
  
  // Navigation Actions
  setImages: (images: ImageInfo[]) => void;
  setCurrentImage: (imageId: string) => void;
  navigateNext: () => string | null;
  navigatePrev: () => string | null;
  navigateToImage: (imageId: string) => void;
  
  // Navigation Getters
  getNextImageId: () => string | null;
  getPrevImageId: () => string | null;
  getCurrentImage: () => ImageInfo | null;

  // Image Filters (replaces vars.vm.filters)
  brightness: number;
  saturation: number;
  contrast: boolean;
  invert: boolean;
  
  // Filter UI State
  expandedFilterSlider: string | null; // Track which slider is currently expanded
  
  // Filter Actions
  setBrightness: (value: number) => void;
  setSaturation: (value: number) => void;
  setContrast: (enabled: boolean) => void;
  setInvert: (enabled: boolean) => void;
  resetFilters: () => void;
  changeBrightness: (up: boolean) => void;
  changeSaturation: (up: boolean) => void;
  setExpandedFilterSlider: (sliderId: string | null) => void;
}

// Helper function to trigger legacy rendering
const triggerLegacyRender = () => {
  const w = window as any;
  if (w.vars?.vm?.render) {
    w.vars.vm.render();
  }
};

export const useSegmentationStore = create<SegmentationState>((set, get) => ({
  // Mask Visibility State
  showMask: true,
  
  setShowMask: (visible: boolean) => {
    set({ showMask: visible });
  },
  
  toggleMask: () => {
    set((state) => ({ showMask: !state.showMask }));
  },

  // Navigation Confirmation Dialog State
  showDialogueBeforeNextImage: false,
  
  setShowDialogueBeforeNextImage: (show: boolean) => {
    set({ showDialogueBeforeNextImage: show });
  },

  // Image Filter State (replaces vars.vm.filters)
  brightness: 100,
  saturation: 100,
  contrast: false,
  invert: false,
  
  // Filter UI State
  expandedFilterSlider: null,

  setBrightness: (value: number) => {
    const clampedValue = Math.max(0, Math.min(800, value));
    set({ brightness: clampedValue });
    
    // Sync with legacy vars object during migration
    const w = window as any;
    if (w.vars?.vm?.filters) {
      w.vars.vm.filters.brightness = clampedValue;
    }
    triggerLegacyRender();
  },

  setSaturation: (value: number) => {
    const clampedValue = Math.max(0, Math.min(800, value));
    set({ saturation: clampedValue });
    
    // Sync with legacy vars object during migration
    const w = window as any;
    if (w.vars?.vm?.filters) {
      w.vars.vm.filters.saturation = clampedValue;
    }
    triggerLegacyRender();
  },

  setContrast: (enabled: boolean) => {
    set({ contrast: enabled });
    
    // Sync with legacy vars object during migration
    const w = window as any;
    if (w.vars?.vm?.filters) {
      w.vars.vm.filters.contrast = enabled;
    }
    triggerLegacyRender();
  },

  setInvert: (enabled: boolean) => {
    set({ invert: enabled });
    
    // Sync with legacy vars object during migration
    const w = window as any;
    if (w.vars?.vm?.filters) {
      w.vars.vm.filters.invert = enabled;
    }
    triggerLegacyRender();
  },

  resetFilters: () => {
    set({ 
      brightness: 100, 
      saturation: 100, 
      contrast: false, 
      invert: false 
    });
    
    // Sync with legacy vars object during migration
    const w = window as any;
    if (w.vars?.vm?.filters) {
      w.vars.vm.filters.brightness = 100;
      w.vars.vm.filters.saturation = 100;
      w.vars.vm.filters.contrast = false;
      w.vars.vm.filters.invert = false;
    }
    triggerLegacyRender();
  },

  changeBrightness: (up: boolean) => {
    const { brightness, setBrightness } = get();
    const newValue = up ? brightness + 10 : brightness - 10;
    setBrightness(newValue);
  },

  changeSaturation: (up: boolean) => {
    const { saturation, setSaturation } = get();
    const newValue = up ? saturation + 20 : saturation - 20;
    setSaturation(newValue);
  },

  setExpandedFilterSlider: (sliderId: string | null) => {
    set({ expandedFilterSlider: sliderId });
  },

  // Image Navigation State
  images: [],
  currentImageId: null,
  currentImageIndex: -1,

  setImages: (images) => {
    set({ images });
  },

  setCurrentImage: (imageId) => {
    const images = get().images;
    const index = images.findIndex(img => img.image_id === imageId);
    set({ currentImageId: imageId, currentImageIndex: index });
  },

  navigateNext: () => {
    const { images, currentImageIndex } = get();
    if (currentImageIndex < images.length - 1) {
      const nextImage = images[currentImageIndex + 1];
      set({ 
        currentImageId: nextImage.image_id,
        currentImageIndex: currentImageIndex + 1
      });
      return nextImage.image_id;
    }
    return null;
  },

  navigatePrev: () => {
    const { images, currentImageIndex } = get();
    if (currentImageIndex > 0) {
      const prevImage = images[currentImageIndex - 1];
      set({ 
        currentImageId: prevImage.image_id,
        currentImageIndex: currentImageIndex - 1
      });
      return prevImage.image_id;
    }
    return null;
  },

  navigateToImage: (imageId) => {
    const images = get().images;
    const index = images.findIndex(img => img.image_id === imageId);
    if (index !== -1) {
      set({ currentImageId: imageId, currentImageIndex: index });
    }
  },

  getNextImageId: () => {
    const { images, currentImageIndex } = get();
    return currentImageIndex < images.length - 1 
      ? images[currentImageIndex + 1].image_id 
      : null;
  },

  getPrevImageId: () => {
    const { images, currentImageIndex } = get();
    return currentImageIndex > 0 
      ? images[currentImageIndex - 1].image_id 
      : null;
  },

  getCurrentImage: () => {
    const { images, currentImageIndex } = get();
    return images[currentImageIndex] || null;
  },
}));

// Initialize store from legacy vars if available
const initializeFiltersFromLegacy = () => {
  const w = window as any;
  if (w.vars?.vm?.filters) {
    const store = useSegmentationStore.getState();
    store.setBrightness(w.vars.vm.filters.brightness || 100);
    store.setSaturation(w.vars.vm.filters.saturation || 100);
    store.setContrast(w.vars.vm.filters.contrast || false);
    store.setInvert(w.vars.vm.filters.invert || false);
  }
};

// Bridge for legacy JavaScript access during migration
// Legacy JS can call: window.segmentationStore.getState().setShowMask(true)
if (typeof window !== 'undefined') {
  (window as any).segmentationStore = useSegmentationStore;
  
  // Initialize from legacy vars when available
  (window as any).initializeFiltersFromLegacy = initializeFiltersFromLegacy;
}
