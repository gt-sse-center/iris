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

interface ClassConfig {
  name: string;
  colour: [number, number, number, number]; // RGBA
  user_colour?: [number, number, number, number]; // Optional user-specific color
  description?: string; // Optional description
}

// PHASE 2: Import new types
interface ProjectConfig {
  name: string;
  host: string;
  port: number;
  images: string | string[];
  classes: ClassConfig[];
  views: ViewConfig[];
  view_groups: string[][];
  segmentation: {
    mask_path: string;
    ai_model: AIModelConfig;
    scoring: {
      enabled: boolean;
      metrics: string[];
    };
  };
}

interface ViewConfig {
  name: string;
  type: string;
  bands?: string[];
  expression?: string;
  colormap?: string;
  vmin?: number;
  vmax?: number;
}

interface UserInfo {
  id: number;
  name: string;
  admin: boolean;
  tested: boolean;
  created: string;
  image_seed: number;
  segmentation: {
    score: number;
    score_unverified: number;
    n_masks: number;
    rank?: number;
  };
}

interface ConfusionMatrix {
  matrix: number[][];
  classes: string[];
  accuracy: number;
  f1_score: number;
  jaccard_index: number;
}

interface AIModelConfig {
  n_estimators: number;
  max_depth: number;
  n_leaves: number;
  train_ratio: number;
  max_train_pixels: number;
  use_edge_filter: boolean;
  use_meshgrid: boolean;
  meshgrid_cells: string;
  use_superpixels: boolean;
  bands: string[];
  suppression_filter_size: number;
  suppression_threshold: number;
  suppression_default_class: number;
}

interface SegmentationDebugInfo {
  showMask: boolean;
  currentImageId: string | null;
  imagesCount: number;
  filtersActive: boolean;
  brightness: number;
  saturation: number;
  contrast: boolean;
  invert: boolean;
  // Core drawing state debug info
  currentTool: string;
  toolSize: number;
  currentClass: number;
  maskType: string;
  classesCount: number;
  totalUserPixels: number;
  // PHASE 2: Navigation & Actions debug info
  hasConfig: boolean;
  hasUser: boolean;
  hasConfusionMatrix: boolean;
  maskChanged: boolean;
  isLoading: boolean;
  lastSaveTime: string | null;
}

interface SegmentationState {
  // Mask Visibility
  showMask: boolean;
  setShowMask: (visible: boolean) => void;
  toggleMask: () => void;

  // Navigation Confirmation Dialog
  showDialogueBeforeNextImage: boolean;
  setShowDialogueBeforeNextImage: (show: boolean) => void;
  
  // Error Modal
  errorModal: {
    isOpen: boolean;
    title: string;
    message: string;
  };
  showErrorModal: (message: string, title?: string) => void;
  hideErrorModal: () => void;
  
  // Debug state
  debugMode: boolean;

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
  
  // PHASE 1: Core Drawing State (replaces vars.tool, vars.current_class, vars.mask_type, vars.classes)
  currentTool: 'move' | 'draw' | 'eraser';
  toolSize: number;
  currentClass: number;
  maskType: 'final' | 'user' | 'errors';
  classes: ClassConfig[];
  userPixelCounts: { [classId: number]: number; total: number };
  
  // PHASE 1: Core Drawing Actions
  setCurrentTool: (tool: 'move' | 'draw' | 'eraser') => void;
  setToolSize: (size: number) => void;
  setCurrentClass: (classId: number) => void;
  setMaskType: (type: 'final' | 'user' | 'errors') => void;
  setClasses: (classes: ClassConfig[]) => void;
  updateUserPixelCounts: (counts: { [classId: number]: number; total: number }) => void;
  
  // PHASE 2: Navigation & Actions State (replaces vars.config, vars.user, vars.confusion_matrix)
  config: ProjectConfig | null;
  user: UserInfo | null;
  confusionMatrix: ConfusionMatrix | null;
  maskChanged: boolean;
  isLoading: boolean;
  lastSaveTime: Date | null;
  
  // PHASE 2: Navigation & Actions Actions
  saveCurrentMask: () => Promise<void>;
  loadMaskForImage: (imageId: string) => Promise<void>;
  predictMask: () => Promise<void>;
  updateConfusionMatrix: (matrix: ConfusionMatrix) => void;
  resetViews: () => void;
  setConfig: (config: ProjectConfig) => void;
  setUser: (user: UserInfo) => void;
  setMaskChanged: (changed: boolean) => void;
  
  // Debug actions
  setDebugMode: (enabled: boolean) => void;
  getDebugInfo: () => SegmentationDebugInfo;
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

  // Error Modal State
  errorModal: {
    isOpen: false,
    title: 'Error',
    message: '',
  },

  showErrorModal: (message: string, title = 'Error') => {
    console.log('[IRIS] showErrorModal called:', { message, title });
    set({
      errorModal: {
        isOpen: true,
        title,
        message,
      },
    });
  },

  hideErrorModal: () => {
    set({
      errorModal: {
        isOpen: false,
        title: 'Error',
        message: '',
      },
    });
  },

  // Image Filter State (replaces vars.vm.filters)
  brightness: 100,
  saturation: 100,
  contrast: false,
  invert: false,
  
  // Filter UI State
  expandedFilterSlider: null,
  
  // Debug state
  debugMode: false,

  // PHASE 1: Core Drawing State (replaces vars.tool, vars.current_class, vars.mask_type, vars.classes)
  currentTool: 'draw', // Default tool
  toolSize: 5, // Default tool size
  currentClass: 0, // Default to first class
  maskType: 'final', // Default mask type
  classes: [], // Will be initialized from legacy vars
  userPixelCounts: { total: 0 }, // Will be updated from legacy vars

  // PHASE 2: Navigation & Actions State (replaces vars.config, vars.user, vars.confusion_matrix)
  config: null, // Will be initialized from legacy vars
  user: null, // Will be initialized from legacy vars
  confusionMatrix: null, // Will be updated from AI predictions
  maskChanged: false, // Track unsaved changes
  isLoading: false, // Loading state for async operations
  lastSaveTime: null, // Track last save time

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

  // PHASE 1: Core Drawing Actions with Legacy Sync
  setCurrentTool: (tool: 'move' | 'draw' | 'eraser') => {
    set({ currentTool: tool });
    
    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars?.tool) {
      w.vars.tool.type = tool;
    }
    
    // Update legacy DOM elements
    if (w.get_object) {
      // Remove checked class from all tool buttons
      const tools = ['move', 'draw', 'eraser'];
      tools.forEach(t => {
        const btn = w.get_object(`tb_tool_${t}`);
        if (btn) btn.classList.remove('checked');
      });
      
      // Add checked class to current tool
      const currentBtn = w.get_object(`tb_tool_${tool}`);
      if (currentBtn) currentBtn.classList.add('checked');
    }
    
    // Trigger legacy preview render (with safety check for initialization)
    if (w.vars && w.vars.vm && w.vars.vm.getLayers && w.render_preview) {
      w.render_preview();
    } else {
      console.log('[IRIS] setCurrentTool: Skipping render_preview, ViewManager not initialized yet');
    }
  },

  setToolSize: (size: number) => {
    const clampedSize = Math.max(1, Math.min(size, 100)); // Reasonable bounds
    set({ toolSize: clampedSize });
    
    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars?.tool) {
      w.vars.tool.size = clampedSize;
    }
    
    // Trigger legacy preview render (with safety check for initialization)
    if (w.vars && w.vars.vm && w.vars.vm.getLayers && w.render_preview) {
      w.render_preview();
    } else {
      console.log('[IRIS] setToolSize: Skipping render_preview, ViewManager not initialized yet');
    }
  },

  setCurrentClass: (classId: number) => {
    const { classes } = get();
    
    // Safety check: ensure we have classes loaded
    if (classes.length === 0) {
      console.warn(`[IRIS] setCurrentClass: No classes available yet, skipping class ${classId}`);
      return;
    }
    
    if (classId < 0 || classId >= classes.length) {
      console.warn(`Invalid class ID: ${classId}, available classes: 0-${classes.length - 1}`);
      return;
    }
    
    set({ currentClass: classId });
    
    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.current_class = classId;
    }
    
    // Update legacy DOM elements
    if (w.get_object && classes[classId]) {
      const classInfo = classes[classId];
      const nameElement = w.get_object('tb_current_class');
      const colorElement = w.get_object('tb_select_class');
      
      if (nameElement) {
        nameElement.innerHTML = classInfo.name;
      }
      
      if (colorElement && w.rgba2css) {
        const cssColor = w.rgba2css(classInfo.colour);
        colorElement.style.backgroundColor = cssColor;
      }
    }
    
    // Automatically switch to draw tool (legacy behavior)
    get().setCurrentTool('draw');
  },

  setMaskType: (type: 'final' | 'user' | 'errors') => {
    const { maskType: currentType } = get();
    set({ maskType: type });
    
    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.mask_type = type;
    }
    
    // Update legacy DOM elements
    if (w.get_object) {
      // Remove checked class from current mask type button
      const currentBtn = w.get_object(`tb_mask_${currentType}`);
      if (currentBtn) currentBtn.classList.remove('checked');
      
      // Add checked class to new mask type button
      const newBtn = w.get_object(`tb_mask_${type}`);
      if (newBtn) newBtn.classList.add('checked');
    }
    
    // Trigger legacy mask reload and render (with comprehensive safety checks)
    // Only call these functions if the initialization is complete
    if (w.vars && w.vars.hidden_mask && w.vars.mask_shape && w.vars.mask) {
      if (w.reload_hidden_mask) {
        w.reload_hidden_mask();
      }
      if (w.render_mask) {
        w.render_mask();
      }
      if (w.show_mask) {
        w.show_mask(true); // Show mask when type changes
      }
    } else {
      console.log('[IRIS] setMaskType: Skipping legacy function calls, initialization not complete yet');
    }
  },

  setClasses: (classes: ClassConfig[]) => {
    set({ classes });
    
    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.classes = classes;
    }
  },

  updateUserPixelCounts: (counts: { [classId: number]: number; total: number }) => {
    set({ userPixelCounts: counts });
    
    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.n_user_pixels = counts;
    }
    
    // Update legacy DOM elements
    if (w.get_object && w.nice_number) {
      const drawnPixelsElement = w.get_object('drawn-pixels');
      if (drawnPixelsElement) {
        drawnPixelsElement.innerHTML = w.nice_number(counts.total);
      }
      
      // Count different classes with significant pixels
      let differentClasses = 0;
      Object.keys(counts).forEach(key => {
        if (key !== 'total' && counts[parseInt(key)] > 10) {
          differentClasses++;
        }
      });
      
      const differentClassesElement = w.get_object('different-classes');
      if (differentClassesElement) {
        differentClassesElement.innerHTML = differentClasses.toString();
      }
      
      // Update AI recommendation
      const aiRecommendationElement = w.get_object('ai-recommendation');
      if (aiRecommendationElement) {
        if (differentClasses >= 2) {
          aiRecommendationElement.innerHTML = 'Start the training!';
        } else {
          aiRecommendationElement.innerHTML = 'Draw at least 10 pixels from two classes!';
        }
      }
    }
    
    // Mark mask as changed when user pixels are updated
    get().setMaskChanged(true);
  },

  // PHASE 2: Navigation & Actions Actions
  saveCurrentMask: async () => {
    const { currentImageId, isLoading } = get();
    
    if (isLoading || !currentImageId) {
      console.log('[IRIS] saveCurrentMask: Already loading or no current image');
      return;
    }
    
    set({ isLoading: true });
    
    try {
      // Call legacy legacySaveMask function directly to avoid circular calls
      const w = window as any;
      if (w.legacySaveMask) {
        // Create a promise wrapper around the legacy save function
        await new Promise<void>((resolve, reject) => {
          const originalCallback = w.save_mask_finished;
          
          // Temporarily override the callback to resolve our promise
          w.save_mask_finished = async (response: Response, call_afterwards: any) => {
            try {
              // Call original callback
              if (originalCallback) {
                await originalCallback(response, call_afterwards);
              }
              
              if (response.status === 200) {
                // Update store state on successful save
                set({ 
                  maskChanged: false, 
                  lastSaveTime: new Date(),
                  isLoading: false 
                });
                resolve();
              } else {
                set({ isLoading: false });
                reject(new Error(`Save failed with status ${response.status}`));
              }
            } catch (error) {
              set({ isLoading: false });
              reject(error);
            } finally {
              // Restore original callback
              w.save_mask_finished = originalCallback;
            }
          };
          
          // Call legacy save function directly
          w.legacySaveMask();
        });
      } else {
        throw new Error('Legacy legacySaveMask function not available');
      }
    } catch (error) {
      console.error('[IRIS] saveCurrentMask failed:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  loadMaskForImage: async (imageId: string) => {
    const { isLoading } = get();
    
    if (isLoading) {
      console.log('[IRIS] loadMaskForImage: Already loading');
      return;
    }
    
    set({ isLoading: true });
    
    try {
      // Call legacy legacyLoadMask function directly to avoid circular calls
      const w = window as any;
      if (w.legacyLoadMask) {
        await w.legacyLoadMask();
        
        // Update store state after successful load
        set({ 
          currentImageId: imageId,
          maskChanged: false,
          isLoading: false 
        });
      } else {
        throw new Error('Legacy legacyLoadMask function not available');
      }
    } catch (error) {
      console.error('[IRIS] loadMaskForImage failed:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  predictMask: async () => {
    const { isLoading, userPixelCounts } = get();
    
    if (isLoading) {
      console.log('[IRIS] predictMask: Already loading');
      return;
    }
    
    // Check if we have enough training data
    let classesWithEnoughPixels = 0;
    Object.keys(userPixelCounts).forEach(key => {
      if (key !== 'total' && userPixelCounts[parseInt(key)] > 10) {
        classesWithEnoughPixels++;
      }
    });
    
    if (classesWithEnoughPixels < 2) {
      throw new Error('You need to draw at least 10 pixels for more than one class to use the AI.');
    }
    
    set({ isLoading: true });
    
    try {
      // Call legacy legacyPredictMask function directly to avoid circular calls
      const w = window as any;
      if (w.legacyPredictMask) {
        await w.legacyPredictMask();
        
        // Mark mask as changed after prediction
        set({ 
          maskChanged: true,
          isLoading: false 
        });
      } else {
        throw new Error('Legacy legacyPredictMask function not available');
      }
    } catch (error) {
      console.error('[IRIS] predictMask failed:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  updateConfusionMatrix: (matrix: ConfusionMatrix) => {
    set({ confusionMatrix: matrix });
    
    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.confusion_matrix = matrix;
    }
  },

  resetViews: () => {
    // Call legacy reset_views function
    const w = window as any;
    if (w.reset_views) {
      w.reset_views();
    } else {
      console.warn('[IRIS] resetViews: Legacy reset_views function not available');
    }
  },

  setConfig: (config: ProjectConfig) => {
    set({ config });
    
    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.config = config;
    }
  },

  setUser: (user: UserInfo) => {
    set({ user });
    
    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.user = user;
    }
  },

  setMaskChanged: (changed: boolean) => {
    set({ maskChanged: changed });
    
    // Update dialogue flag based on mask changes
    if (changed) {
      get().setShowDialogueBeforeNextImage(true);
    }
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
  
  // Debug actions
  setDebugMode: (debugMode) => set({ debugMode }),
  
  getDebugInfo: () => {
    const state = get();
    return {
      showMask: state.showMask,
      currentImageId: state.currentImageId,
      imagesCount: state.images.length,
      filtersActive: state.brightness !== 100 || state.saturation !== 100 || state.contrast || state.invert,
      brightness: state.brightness,
      saturation: state.saturation,
      contrast: state.contrast,
      invert: state.invert,
      // PHASE 1: Core drawing state debug info
      currentTool: state.currentTool,
      toolSize: state.toolSize,
      currentClass: state.currentClass,
      maskType: state.maskType,
      classesCount: state.classes.length,
      totalUserPixels: state.userPixelCounts.total,
      // PHASE 2: Navigation & Actions debug info
      hasConfig: state.config !== null,
      hasUser: state.user !== null,
      hasConfusionMatrix: state.confusionMatrix !== null,
      maskChanged: state.maskChanged,
      isLoading: state.isLoading,
      lastSaveTime: state.lastSaveTime ? state.lastSaveTime.toISOString() : null,
    };
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

// PHASE 1: Initialize core drawing state from legacy vars
const initializeCoreDrawingStateFromLegacy = () => {
  const w = window as any;
  if (w.vars) {
    const store = useSegmentationStore.getState();
    
    // Initialize tool state
    if (w.vars.tool) {
      if (w.vars.tool.type) {
        store.setCurrentTool(w.vars.tool.type);
      }
      if (w.vars.tool.size) {
        store.setToolSize(w.vars.tool.size);
      }
    }
    
    // Initialize classes first (needed for current_class validation)
    if (w.vars.classes && Array.isArray(w.vars.classes)) {
      store.setClasses(w.vars.classes);
    }
    
    // Initialize current class (after classes are set)
    if (typeof w.vars.current_class === 'number' && w.vars.classes && w.vars.classes.length > 0) {
      store.setCurrentClass(w.vars.current_class);
    }
    
    // Initialize mask type
    if (w.vars.mask_type) {
      store.setMaskType(w.vars.mask_type);
    }
    
    // Initialize user pixel counts
    if (w.vars.n_user_pixels) {
      store.updateUserPixelCounts(w.vars.n_user_pixels);
    }
  }
};

// PHASE 2: Initialize navigation & actions state from legacy vars
const initializeNavigationActionsStateFromLegacy = () => {
  const w = window as any;
  if (w.vars) {
    const store = useSegmentationStore.getState();
    
    // Initialize project configuration
    if (w.vars.config) {
      store.setConfig(w.vars.config);
    }
    
    // Initialize user information
    if (w.vars.user) {
      store.setUser(w.vars.user);
    }
    
    // Initialize confusion matrix
    if (w.vars.confusion_matrix) {
      store.updateConfusionMatrix(w.vars.confusion_matrix);
    }
    
    // Initialize mask changed state
    if (typeof w.vars.mask_changed === 'boolean') {
      store.setMaskChanged(w.vars.mask_changed);
    }
  }
};

// Bridge for legacy JavaScript access during migration
// Legacy JS can call: window.segmentationStore.getState().setShowMask(true)
if (typeof window !== 'undefined') {
  (window as any).segmentationStore = useSegmentationStore;
  
  // Initialize from legacy vars when available
  (window as any).initializeFiltersFromLegacy = initializeFiltersFromLegacy;
  (window as any).initializeCoreDrawingStateFromLegacy = initializeCoreDrawingStateFromLegacy;
  (window as any).initializeNavigationActionsStateFromLegacy = initializeNavigationActionsStateFromLegacy;
  
  // Initialize debug mode from legacy vars
  const w = window as any;
  if (w.vars?.debug_mode) {
    useSegmentationStore.getState().setDebugMode(true);
  }
  
  // Prevent infinite initialization loops
  let coreDrawingInitialized = false;
  let navigationActionsInitialized = false;
  
  // Auto-initialize core drawing state when legacy vars become available
  const checkForLegacyVars = () => {
    // Core drawing state initialization
    if (!coreDrawingInitialized && w.vars && (w.vars.tool || w.vars.classes || typeof w.vars.current_class === 'number')) {
      console.log('🔧 SegmentationStore: Auto-initializing core drawing state from detected legacy vars');
      initializeCoreDrawingStateFromLegacy();
      coreDrawingInitialized = true;
    }
    
    // PHASE 2: Navigation & actions state initialization
    if (!navigationActionsInitialized && w.vars && (w.vars.config || w.vars.user || w.vars.confusion_matrix)) {
      console.log('🔧 SegmentationStore: Auto-initializing navigation & actions state from detected legacy vars');
      initializeNavigationActionsStateFromLegacy();
      navigationActionsInitialized = true;
    }
  };
  
  // Check immediately
  checkForLegacyVars();
  
  // Also check periodically for the first 10 seconds, but only if not already initialized
  const checkInterval = setInterval(() => {
    if (!coreDrawingInitialized || !navigationActionsInitialized) {
      checkForLegacyVars();
    }
    
    // Stop checking if both are initialized
    if (coreDrawingInitialized && navigationActionsInitialized) {
      clearInterval(checkInterval);
    }
  }, 500);
  
  setTimeout(() => clearInterval(checkInterval), 10000);
}
