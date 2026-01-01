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

interface ApiUrls {
  main: string;
  segmentation: string;
  user: string;
  admin: string;
  help: string;
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
  toolResizingMode: boolean;
  currentClass: number;
  maskType: string;
  classesCount: number;
  totalUserPixels: number;
  // Mouse & Canvas State debug info
  cursorImage: [number, number];
  dragStart: [number, number] | null;
  isDragging: boolean;
  // PHASE 2: Navigation & Actions debug info
  hasConfig: boolean;
  hasUser: boolean;
  hasConfusionMatrix: boolean;
  maskChanged: boolean;
  isLoading: boolean;
  lastSaveTime: string | null;
  // API URLs debug info
  hasApiUrls: boolean;
}

interface SegmentationState {
  // Mask Visibility
  showMask: boolean;
  setShowMask: (visible: boolean) => void;
  toggleMask: () => void;

  // Navigation Confirmation Dialog
  showDialogueBeforeNextImage: boolean;
  setShowDialogueBeforeNextImage: (show: boolean) => void;

  // Initialization Flow Control (replaces vars.next_action)
  nextAction: (() => Promise<void>) | null;
  setNextAction: (action: (() => Promise<void>) | null) => void;

  // New User Experience (replaces vars.just_logged_in)
  justLoggedIn: boolean;
  setJustLoggedIn: (loggedIn: boolean) => void;

  // CRITICAL: API URLs (replaces vars.url)
  apiUrls: ApiUrls | null;
  setApiUrls: (urls: ApiUrls) => void;
  getApiUrl: (endpoint: keyof ApiUrls) => string | null;

  // CRITICAL: Core Mask Data (replaces vars.mask, vars.user_mask, vars.errors_mask)
  maskData: Uint8Array | null;
  userMaskData: Uint8Array | null;
  errorsMaskData: Uint8Array | null;
  maskDimensions: { width: number; height: number } | null;
  
  // Mask Data Actions
  setMaskData: (data: Uint8Array, width: number, height: number) => void;
  setUserMaskData: (data: Uint8Array) => void;
  setErrorsMaskData: (data: Uint8Array) => void;
  getMaskPixel: (x: number, y: number) => number;
  setMaskPixel: (x: number, y: number, classId: number) => void;
  getUserMaskPixel: (x: number, y: number) => number;
  setUserMaskPixel: (x: number, y: number, value: number) => void;
  clearMask: () => void;
  copyMask: () => Uint8Array | null;
  copyUserMask: () => Uint8Array | null;
  
  // Mask Shape Actions (replaces vars.mask_shape)
  setMaskDimensions: (dimensions: { width: number; height: number }) => void;
  getMaskShape: () => [number, number] | null;
  
  // Bulk operations for performance
  updateMaskRegion: (pixels: Array<{x: number, y: number, classId: number}>) => void;
  fillMaskRegion: (startX: number, startY: number, endX: number, endY: number, classId: number) => void;
  
  // History System (replaces vars.history)
  maskHistory: Uint8Array[];
  userMaskHistory: Uint8Array[];
  historyCurrentEpoch: number;
  historyMaxEpochs: number;
  
  // History Actions
  updateHistory: () => void;
  undo: () => void;
  redo: () => void;
  discardFuture: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
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

  // Cursor Image (replaces vars.cursor_image)
  cursorImage: [number, number];
  setCursorImage: (coords: [number, number]) => void;

  // Drag State (replaces vars.drag_start)
  dragStart: [number, number] | null;
  setDragStart: (coords: [number, number] | null) => void;

  // Hidden Mask Canvas (replaces vars.hidden_mask)
  hiddenMaskCanvas: HTMLCanvasElement | null;
  setHiddenMaskCanvas: (canvas: HTMLCanvasElement | null) => void;
  createHiddenMaskCanvas: (width: number, height: number) => HTMLCanvasElement;
  getHiddenMaskContext: () => CanvasRenderingContext2D | null;

  // Mask Area (replaces vars.mask_area)
  maskArea: [number, number, number, number] | null;
  setMaskArea: (area: [number, number, number, number] | null) => void;
  getMaskArea: () => [number, number, number, number] | null;

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
  toolShape: 'square' | 'round';
  toolResizingMode: boolean;
  showDrawToolDropdown: boolean;
  showEraserToolDropdown: boolean;
  currentClass: number;
  maskType: 'final' | 'user' | 'errors';
  classes: ClassConfig[];
  userPixelCounts: { [classId: number]: number; total: number };
  
  // PHASE 1: Core Drawing Actions
  setCurrentTool: (tool: 'move' | 'draw' | 'eraser') => void;
  setToolSize: (size: number) => void;
  setToolShape: (shape: 'square' | 'round') => void;
  setToolResizingMode: (resizing: boolean) => void;
  setShowDrawToolDropdown: (show: boolean) => void;
  setShowEraserToolDropdown: (show: boolean) => void;
  setCurrentClass: (classId: number) => void;
  setMaskType: (type: 'final' | 'user' | 'errors') => void;
  setClasses: (classes: ClassConfig[]) => void;
  updateUserPixelCounts: (counts: { [classId: number]: number; total: number }) => void;
  calculatePixelCounts: () => { [classId: number]: number; total: number };
  
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

// Helper function to get API URLs from React store (for legacy compatibility)
const getApiUrlsFromStore = (): ApiUrls | null => {
  return useSegmentationStore.getState().apiUrls;
};

// Helper function to get specific API URL from React store (for legacy compatibility)
const getApiUrlFromStore = (endpoint: keyof ApiUrls): string | null => {
  return useSegmentationStore.getState().getApiUrl(endpoint);
};

// Helper function to set API URLs in React store (for legacy compatibility)
const setApiUrlsInStore = (urls: ApiUrls) => {
  useSegmentationStore.getState().setApiUrls(urls);
};

// Helper function to get next action from React store (for legacy compatibility)
const getNextActionFromStore = () => {
  return useSegmentationStore.getState().nextAction;
};

// Helper function to set next action in React store (for legacy compatibility)
const setNextActionInStore = (action: (() => Promise<void>) | null) => {
  useSegmentationStore.getState().setNextAction(action);
};

// Helper function to get just logged in from React store (for legacy compatibility)
const getJustLoggedInFromStore = () => {
  return useSegmentationStore.getState().justLoggedIn;
};

// Helper function to set just logged in in React store (for legacy compatibility)
const setJustLoggedInInStore = (loggedIn: boolean) => {
  useSegmentationStore.getState().setJustLoggedIn(loggedIn);
};

// Helper function to get tool size from React store (for legacy compatibility)
const getToolSizeFromStore = () => {
  return useSegmentationStore.getState().toolSize;
};

// Helper function to get tool resizing mode from React store (for legacy compatibility)
const getToolResizingModeFromStore = () => {
  return useSegmentationStore.getState().toolResizingMode;
};

// Helper function to get cursor image from React store (for legacy compatibility)
const getCursorImageFromStore = () => {
  return useSegmentationStore.getState().cursorImage;
};

// Helper function to set cursor image in React store (for legacy compatibility)
const setCursorImageInStore = (x: number, y: number) => {
  useSegmentationStore.getState().setCursorImage([x, y]);
};

// Helper function to get current tool from React store (for legacy compatibility)
const getCurrentToolFromStore = () => {
  return useSegmentationStore.getState().currentTool;
};

// Helper function to set current tool in React store (for legacy compatibility)
const setCurrentToolInStore = (tool: 'move' | 'draw' | 'eraser') => {
  useSegmentationStore.getState().setCurrentTool(tool);
};

// Helper function to get drag start from React store (for legacy compatibility)
const getDragStartFromStore = () => {
  return useSegmentationStore.getState().dragStart;
};

// Helper function to set drag start in React store (for legacy compatibility)
const setDragStartInStore = (coords: [number, number] | null) => {
  useSegmentationStore.getState().setDragStart(coords);
};

// Helper function to get tool shape from React store (for legacy compatibility)
const getToolShapeFromStore = () => {
  return useSegmentationStore.getState().toolShape;
};

// Helper function to set tool shape in React store (for legacy compatibility)
const setToolShapeInStore = (shape: 'square' | 'round') => {
  useSegmentationStore.getState().setToolShape(shape);
};

// Helper function to get hidden mask canvas from React store (for legacy compatibility)
const getHiddenMaskCanvasFromStore = () => {
  return useSegmentationStore.getState().hiddenMaskCanvas;
};

// Helper function to get hidden mask context from React store (for legacy compatibility)
const getHiddenMaskContextFromStore = () => {
  return useSegmentationStore.getState().getHiddenMaskContext();
};

// Helper function to create hidden mask canvas from React store (for legacy compatibility)
const createHiddenMaskCanvasFromStore = (width: number, height: number) => {
  return useSegmentationStore.getState().createHiddenMaskCanvas(width, height);
};

// Helper function to get mask area from React store (for legacy compatibility)
const getMaskAreaFromStore = (): [number, number, number, number] | null => {
  return useSegmentationStore.getState().getMaskArea();
};

// Helper function to set mask area in React store (for legacy compatibility)
const setMaskAreaInStore = (area: [number, number, number, number] | null) => {
  useSegmentationStore.getState().setMaskArea(area);
};

// CRITICAL: Helper functions for mask data legacy access during migration
const getMaskDataFromStore = () => {
  return useSegmentationStore.getState().maskData;
};

const setMaskDataInStore = (data: Uint8Array, width: number, height: number) => {
  useSegmentationStore.getState().setMaskData(data, width, height);
};

// CRITICAL: Helper functions for mask shape legacy access during migration (vars.mask_shape)
const getMaskShapeFromStore = (): [number, number] | null => {
  const dimensions = useSegmentationStore.getState().maskDimensions;
  return dimensions ? [dimensions.width, dimensions.height] : null;
};

const setMaskShapeInStore = (width: number, height: number) => {
  // Validate input
  if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) {
    console.error('[IRIS] setMaskShapeInStore: Invalid dimensions', { width, height });
    return;
  }

  const store = useSegmentationStore.getState();
  
  // If we have existing mask data, validate dimensions match
  const currentMask = store.maskData;
  if (currentMask && currentMask.length !== width * height) {
    console.warn('[IRIS] setMaskShapeInStore: Dimension mismatch with existing mask data', {
      currentLength: currentMask.length,
      expectedLength: width * height
    });
  }

  // Update dimensions using store method (this will also sync with legacy vars.mask_shape)
  store.setMaskDimensions({ width, height });
};

const getMaskWidthFromStore = (): number => {
  const dimensions = useSegmentationStore.getState().maskDimensions;
  return dimensions ? dimensions.width : 0;
};

const getMaskHeightFromStore = (): number => {
  const dimensions = useSegmentationStore.getState().maskDimensions;
  return dimensions ? dimensions.height : 0;
};

const getUserMaskDataFromStore = () => {
  return useSegmentationStore.getState().userMaskData;
};

const setUserMaskDataInStore = (data: Uint8Array) => {
  useSegmentationStore.getState().setUserMaskData(data);
};

const getErrorsMaskDataFromStore = () => {
  return useSegmentationStore.getState().errorsMaskData;
};

const setErrorsMaskDataInStore = (data: Uint8Array) => {
  useSegmentationStore.getState().setErrorsMaskData(data);
};

const getMaskPixelFromStore = (x: number, y: number) => {
  return useSegmentationStore.getState().getMaskPixel(x, y);
};

const setMaskPixelInStore = (x: number, y: number, classId: number) => {
  useSegmentationStore.getState().setMaskPixel(x, y, classId);
};

const getUserMaskPixelFromStore = (x: number, y: number) => {
  return useSegmentationStore.getState().getUserMaskPixel(x, y);
};

const setUserMaskPixelInStore = (x: number, y: number, value: number) => {
  useSegmentationStore.getState().setUserMaskPixel(x, y, value);
};

const copyMaskFromStore = () => {
  return useSegmentationStore.getState().copyMask();
};

const copyUserMaskFromStore = () => {
  return useSegmentationStore.getState().copyUserMask();
};

const getMaskTypeFromStore = () => {
  return useSegmentationStore.getState().maskType;
};

// Helper functions for classes legacy access during migration
const getClassesFromStore = (): ClassConfig[] => {
  return useSegmentationStore.getState().classes;
};

const getClassFromStore = (classId: number): ClassConfig | null => {
  const classes = useSegmentationStore.getState().classes;
  return (classId >= 0 && classId < classes.length) ? classes[classId] : null;
};

const getClassColorFromStore = (classId: number): [number, number, number, number] | null => {
  const classInfo = getClassFromStore(classId);
  return classInfo ? classInfo.colour : null;
};

const getClassNameFromStore = (classId: number): string => {
  const classInfo = getClassFromStore(classId);
  return classInfo ? classInfo.name : `Class ${classId}`;
};

const getClassCountFromStore = (): number => {
  return useSegmentationStore.getState().classes.length;
};

const setClassesInStore = (classes: ClassConfig[]) => {
  useSegmentationStore.getState().setClasses(classes);
};

const getCurrentClassFromStore = (): number => {
  return useSegmentationStore.getState().currentClass;
};

const setCurrentClassInStore = (classId: number) => {
  useSegmentationStore.getState().setCurrentClass(classId);
};

// History system helper functions
const updateHistoryInStore = () => {
  useSegmentationStore.getState().updateHistory();
};

const undoInStore = () => {
  useSegmentationStore.getState().undo();
};

const redoInStore = () => {
  useSegmentationStore.getState().redo();
};

const discardFutureInStore = () => {
  useSegmentationStore.getState().discardFuture();
};

const canUndoFromStore = () => {
  return useSegmentationStore.getState().canUndo();
};

const canRedoFromStore = () => {
  return useSegmentationStore.getState().canRedo();
};

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

  // Initialization Flow Control State (replaces vars.next_action)
  nextAction: null,

  setNextAction: (action: (() => Promise<void>) | null) => {
    set({ nextAction: action });
    
    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.next_action = action;
    }
  },

  // New User Experience State (replaces vars.just_logged_in)
  justLoggedIn: false,

  setJustLoggedIn: (loggedIn: boolean) => {
    set({ justLoggedIn: loggedIn });
    
    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.just_logged_in = loggedIn;
    }
  },

  // CRITICAL: API URLs State (replaces vars.url)
  apiUrls: null,

  setApiUrls: (urls: ApiUrls) => {
    // Validate input
    if (!urls || typeof urls !== 'object') {
      console.error('[IRIS] setApiUrls: Invalid URLs object', urls);
      return;
    }

    // Validate required endpoints
    const requiredEndpoints: (keyof ApiUrls)[] = ['main', 'segmentation', 'user', 'admin', 'help'];
    const missingEndpoints = requiredEndpoints.filter(endpoint => !urls[endpoint] || typeof urls[endpoint] !== 'string' || urls[endpoint].trim() === '');
    
    if (missingEndpoints.length > 0) {
      console.error('[IRIS] setApiUrls: Missing or invalid endpoints', missingEndpoints);
      return;
    }

    set({ apiUrls: urls });

    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.url = urls;
    }

    console.log('[IRIS] API URLs initialized:', urls);
  },

  getApiUrl: (endpoint: keyof ApiUrls) => {
    const { apiUrls } = get();
    if (!apiUrls) {
      console.warn(`[IRIS] getApiUrl: No API URLs available for endpoint '${endpoint}'`);
      return null;
    }
    
    if (!apiUrls[endpoint]) {
      console.warn(`[IRIS] getApiUrl: Endpoint '${endpoint}' not found in API URLs`);
      return null;
    }
    
    return apiUrls[endpoint];
  },

  // CRITICAL: Core Mask Data State (replaces vars.mask, vars.user_mask, vars.errors_mask)
  maskData: null,
  userMaskData: null,
  errorsMaskData: null,
  maskDimensions: null,

  // History System State (replaces vars.history)
  maskHistory: [],
  userMaskHistory: [],
  historyCurrentEpoch: 0,
  historyMaxEpochs: 30,

  // CRITICAL: Core Mask Data Actions (replaces vars.mask, vars.user_mask, vars.errors_mask)
  setMaskData: (data: Uint8Array, width: number, height: number) => {
    // Validate input
    if (!(data instanceof Uint8Array)) {
      console.error('[IRIS] setMaskData: Invalid data type, expected Uint8Array');
      return;
    }
    if (width <= 0 || height <= 0) {
      console.error('[IRIS] setMaskData: Invalid dimensions', { width, height });
      return;
    }
    if (data.length !== width * height) {
      console.error('[IRIS] setMaskData: Data length mismatch', {
        dataLength: data.length,
        expectedLength: width * height
      });
      return;
    }

    // Create a copy to ensure immutability
    const dataCopy = new Uint8Array(data);
    set({ 
      maskData: dataCopy,
      maskDimensions: { width, height }
    });

    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.mask = dataCopy;
      w.vars.mask_shape = [width, height];
    }

    // Trigger mask-related updates (only if classes are set)
    const { classes } = get();
    if (classes && classes.length > 0) {
      get().updateUserPixelCounts(get().calculatePixelCounts());
    }
  },

  setUserMaskData: (data: Uint8Array) => {
    const { maskDimensions } = get();
    if (!maskDimensions) {
      console.error('[IRIS] setUserMaskData: No mask dimensions set');
      return;
    }
    
    if (!(data instanceof Uint8Array)) {
      console.error('[IRIS] setUserMaskData: Invalid data type, expected Uint8Array');
      return;
    }
    if (data.length !== maskDimensions.width * maskDimensions.height) {
      console.error('[IRIS] setUserMaskData: Data length mismatch');
      return;
    }

    const dataCopy = new Uint8Array(data);
    set({ userMaskData: dataCopy });

    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.user_mask = dataCopy;
    }

    // Update pixel counts when user mask changes (only if classes are set)
    const { classes } = get();
    if (classes && classes.length > 0) {
      get().updateUserPixelCounts(get().calculatePixelCounts());
    }
  },

  setErrorsMaskData: (data: Uint8Array) => {
    const { maskDimensions } = get();
    if (!maskDimensions) {
      console.error('[IRIS] setErrorsMaskData: No mask dimensions set');
      return;
    }
    
    if (!(data instanceof Uint8Array)) {
      console.error('[IRIS] setErrorsMaskData: Invalid data type, expected Uint8Array');
      return;
    }
    if (data.length !== maskDimensions.width * maskDimensions.height) {
      console.error('[IRIS] setErrorsMaskData: Data length mismatch');
      return;
    }

    const dataCopy = new Uint8Array(data);
    set({ errorsMaskData: dataCopy });

    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.errors_mask = dataCopy;
    }
  },

  getMaskPixel: (x: number, y: number) => {
    const { maskData, maskDimensions } = get();
    if (!maskData || !maskDimensions) return 0;
    if (x < 0 || x >= maskDimensions.width || y < 0 || y >= maskDimensions.height) {
      return 0; // Out of bounds
    }
    const index = y * maskDimensions.width + x;
    return maskData[index];
  },

  setMaskPixel: (x: number, y: number, classId: number) => {
    const { maskData, maskDimensions } = get();
    if (!maskData || !maskDimensions) return;
    if (x < 0 || x >= maskDimensions.width || y < 0 || y >= maskDimensions.height) {
      return; // Out of bounds
    }
    const index = y * maskDimensions.width + x;
    
    // Create new array to maintain immutability
    const newMaskData = new Uint8Array(maskData);
    newMaskData[index] = classId;
    get().setMaskData(newMaskData, maskDimensions.width, maskDimensions.height);
  },

  getUserMaskPixel: (x: number, y: number) => {
    const { userMaskData, maskDimensions } = get();
    if (!userMaskData || !maskDimensions) return 0;
    if (x < 0 || x >= maskDimensions.width || y < 0 || y >= maskDimensions.height) {
      return 0; // Out of bounds
    }
    const index = y * maskDimensions.width + x;
    return userMaskData[index];
  },

  setUserMaskPixel: (x: number, y: number, value: number) => {
    const { userMaskData, maskDimensions } = get();
    if (!userMaskData || !maskDimensions) return;
    if (x < 0 || x >= maskDimensions.width || y < 0 || y >= maskDimensions.height) {
      return; // Out of bounds
    }
    const index = y * maskDimensions.width + x;
    
    // Create new array to maintain immutability
    const newUserMaskData = new Uint8Array(userMaskData);
    newUserMaskData[index] = value;
    get().setUserMaskData(newUserMaskData);
  },

  clearMask: () => {
    set({ 
      maskData: null,
      userMaskData: null,
      errorsMaskData: null,
      maskDimensions: null,
      maskHistory: [],
      userMaskHistory: [],
      historyCurrentEpoch: 0
    });

    // Sync with legacy vars
    const w = window as any;
    if (w.vars) {
      w.vars.mask = null;
      w.vars.user_mask = null;
      w.vars.errors_mask = null;
      w.vars.mask_shape = null;
      w.vars.history = {
        mask: [],
        user_mask: [],
        current_epoch: 0,
        max_epochs: 30
      };
    }
  },

  copyMask: () => {
    const { maskData } = get();
    return maskData ? new Uint8Array(maskData) : null;
  },

  copyUserMask: () => {
    const { userMaskData } = get();
    return userMaskData ? new Uint8Array(userMaskData) : null;
  },

  // Mask Shape Actions (replaces vars.mask_shape)
  setMaskDimensions: (dimensions: { width: number; height: number }) => {
    // Validate input
    if (!dimensions || typeof dimensions.width !== 'number' || typeof dimensions.height !== 'number' || 
        dimensions.width <= 0 || dimensions.height <= 0) {
      console.error('[IRIS] setMaskDimensions: Invalid dimensions', dimensions);
      return;
    }

    set({ maskDimensions: dimensions });
    
    // Sync with legacy vars during migration (only in browser environment)
    if (typeof window !== 'undefined') {
      const w = window as any;
      if (w.vars) {
        w.vars.mask_shape = [dimensions.width, dimensions.height];
      }
    }
  },

  getMaskShape: () => {
    const { maskDimensions } = get();
    return maskDimensions ? [maskDimensions.width, maskDimensions.height] : null;
  },

  // Batch Updates for Performance
  updateMaskRegion: (pixels: Array<{x: number, y: number, classId: number}>) => {
    const { maskData, maskDimensions } = get();
    if (!maskData || !maskDimensions) return;

    const newMaskData = new Uint8Array(maskData);
    pixels.forEach(({x, y, classId}) => {
      if (x >= 0 && x < maskDimensions.width && y >= 0 && y < maskDimensions.height) {
        const index = y * maskDimensions.width + x;
        newMaskData[index] = classId;
      }
    });
    get().setMaskData(newMaskData, maskDimensions.width, maskDimensions.height);
  },

  fillMaskRegion: (startX: number, startY: number, endX: number, endY: number, classId: number) => {
    const { maskData, maskDimensions } = get();
    if (!maskData || !maskDimensions) return;

    const newMaskData = new Uint8Array(maskData);
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        if (x >= 0 && x < maskDimensions.width && y >= 0 && y < maskDimensions.height) {
          const index = y * maskDimensions.width + x;
          newMaskData[index] = classId;
        }
      }
    }
    get().setMaskData(newMaskData, maskDimensions.width, maskDimensions.height);
  },

  // History System Actions (replaces vars.history)
  updateHistory: () => {
    const { 
      maskData, 
      userMaskData, 
      maskHistory, 
      userMaskHistory, 
      historyCurrentEpoch, 
      historyMaxEpochs 
    } = get();
    
    if (!maskData || !userMaskData) return;

    // Create copies for history
    const maskCopy = new Uint8Array(maskData);
    const userMaskCopy = new Uint8Array(userMaskData);

    // Remove future history if we're not at the end
    const newMaskHistory = maskHistory.slice(0, historyCurrentEpoch + 1);
    const newUserMaskHistory = userMaskHistory.slice(0, historyCurrentEpoch + 1);

    // Add current state to history
    newMaskHistory.push(maskCopy);
    newUserMaskHistory.push(userMaskCopy);

    // Calculate new epoch (points to the newly added entry)
    let newEpoch = newMaskHistory.length - 1;

    // Limit history size
    if (newMaskHistory.length > historyMaxEpochs) {
      newMaskHistory.shift();
      newUserMaskHistory.shift();
      newEpoch = newMaskHistory.length - 1; // Adjust epoch after removing first element
    }

    set({
      maskHistory: newMaskHistory,
      userMaskHistory: newUserMaskHistory,
      historyCurrentEpoch: newEpoch
    });

    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars?.history) {
      w.vars.history.mask = newMaskHistory.map(arr => Array.from(arr));
      w.vars.history.user_mask = newUserMaskHistory.map(arr => Array.from(arr));
      w.vars.history.current_epoch = get().historyCurrentEpoch;
    }
  },

  discardFuture: () => {
    const { maskHistory, userMaskHistory, historyCurrentEpoch } = get();
    
    const newMaskHistory = maskHistory.slice(0, historyCurrentEpoch + 1);
    const newUserMaskHistory = userMaskHistory.slice(0, historyCurrentEpoch + 1);

    set({
      maskHistory: newMaskHistory,
      userMaskHistory: newUserMaskHistory
    });

    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars?.history) {
      w.vars.history.mask = newMaskHistory.map(arr => Array.from(arr));
      w.vars.history.user_mask = newUserMaskHistory.map(arr => Array.from(arr));
    }
  },

  undo: () => {
    const { maskHistory, userMaskHistory, historyCurrentEpoch, maskDimensions } = get();
    
    if (historyCurrentEpoch <= 0 || !maskDimensions) return;

    const newEpoch = historyCurrentEpoch - 1;
    const historicalMask = maskHistory[newEpoch];
    const historicalUserMask = userMaskHistory[newEpoch];

    if (historicalMask && historicalUserMask) {
      set({
        maskData: new Uint8Array(historicalMask),
        userMaskData: new Uint8Array(historicalUserMask),
        historyCurrentEpoch: newEpoch
      });

      // Sync with legacy vars during migration
      const w = window as any;
      if (w.vars) {
        w.vars.mask = new Uint8Array(historicalMask);
        w.vars.user_mask = new Uint8Array(historicalUserMask);
        w.vars.history.current_epoch = newEpoch;
      }

      // Update pixel counts and trigger re-render (only if classes are set)
      const { classes } = get();
      if (classes && classes.length > 0) {
        get().updateUserPixelCounts(get().calculatePixelCounts());
      }
    }
  },

  redo: () => {
    const { maskHistory, userMaskHistory, historyCurrentEpoch, maskDimensions } = get();
    
    if (historyCurrentEpoch >= maskHistory.length - 1 || !maskDimensions) return;

    const newEpoch = historyCurrentEpoch + 1;
    const historicalMask = maskHistory[newEpoch];
    const historicalUserMask = userMaskHistory[newEpoch];

    if (historicalMask && historicalUserMask) {
      set({
        maskData: new Uint8Array(historicalMask),
        userMaskData: new Uint8Array(historicalUserMask),
        historyCurrentEpoch: newEpoch
      });

      // Sync with legacy vars during migration
      const w = window as any;
      if (w.vars) {
        w.vars.mask = new Uint8Array(historicalMask);
        w.vars.user_mask = new Uint8Array(historicalUserMask);
        w.vars.history.current_epoch = newEpoch;
      }

      // Update pixel counts and trigger re-render (only if classes are set)
      const { classes } = get();
      if (classes && classes.length > 0) {
        get().updateUserPixelCounts(get().calculatePixelCounts());
      }
    }
  },

  canUndo: () => {
    const { maskHistory, historyCurrentEpoch } = get();
    return maskHistory.length > 1 && historyCurrentEpoch > 0;
  },

  canRedo: () => {
    const { maskHistory, historyCurrentEpoch } = get();
    return historyCurrentEpoch < maskHistory.length - 1;
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

  // Cursor Image State (replaces vars.cursor_image)
  cursorImage: [0, 0], // Default cursor position

  // Drag State (replaces vars.drag_start)
  dragStart: null, // Default to no active drag

  // Hidden Mask Canvas State (replaces vars.hidden_mask)
  hiddenMaskCanvas: null, // Default to no canvas

  // Mask Area State (replaces vars.mask_area)
  maskArea: null, // Default to no mask area

  // PHASE 1: Core Drawing State (replaces vars.tool, vars.current_class, vars.mask_type, vars.classes)
  currentTool: 'draw', // Default tool
  toolSize: 5, // Default tool size
  toolShape: 'square', // Default tool shape
  toolResizingMode: false, // Default to zoom mode (not resize mode)
  showDrawToolDropdown: false, // Default to dropdown closed
  showEraserToolDropdown: false, // Default to dropdown closed
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

  setCursorImage: (coords: [number, number]) => {
    // Validate coordinates are numbers
    if (!Array.isArray(coords) || coords.length !== 2 || typeof coords[0] !== 'number' || typeof coords[1] !== 'number') {
      console.warn('[IRIS] setCursorImage: Invalid coordinates provided', coords);
      return;
    }
    
    // Create a copy to ensure immutability
    const coordsCopy: [number, number] = [coords[0], coords[1]];
    set({ cursorImage: coordsCopy });
    
    // Sync with legacy vars during migration for backward compatibility
    const w = window as any;
    if (w.vars) {
      w.vars.cursor_image = coordsCopy;
    }
  },

  setDragStart: (coords: [number, number] | null) => {
    // Validate coordinates if not null
    if (coords !== null) {
      if (!Array.isArray(coords) || coords.length !== 2 || 
          typeof coords[0] !== 'number' || typeof coords[1] !== 'number') {
        console.warn('[IRIS] setDragStart: Invalid coordinates provided', coords);
        return;
      }
      // Create a copy to ensure immutability
      const coordsCopy: [number, number] = [coords[0], coords[1]];
      set({ dragStart: coordsCopy });
    } else {
      set({ dragStart: null });
    }
    
    // Sync with legacy vars during migration for backward compatibility
    const w = window as any;
    if (w.vars) {
      w.vars.drag_start = coords;
    }
  },

  // Hidden Mask Canvas Actions (replaces vars.hidden_mask)
  setHiddenMaskCanvas: (canvas: HTMLCanvasElement | null) => {
    set({ hiddenMaskCanvas: canvas });
    
    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.hidden_mask = canvas;
    }
  },

  createHiddenMaskCanvas: (width: number, height: number) => {
    // Validate dimensions
    if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) {
      console.error('[IRIS] createHiddenMaskCanvas: Invalid dimensions provided', { width, height });
      throw new Error(`Invalid canvas dimensions: ${width}x${height}`);
    }
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Configure canvas for optimal mask rendering (same as legacy)
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.imageSmoothingEnabled = false;
      } else {
        console.error('[IRIS] createHiddenMaskCanvas: Failed to get 2D context');
        throw new Error('Failed to get 2D context for hidden mask canvas');
      }
      
      // Set the canvas in the store
      get().setHiddenMaskCanvas(canvas);
      
      console.log(`[IRIS] Created hidden mask canvas: ${width}x${height}`);
      return canvas;
    } catch (error) {
      console.error('[IRIS] createHiddenMaskCanvas failed:', error);
      throw error;
    }
  },

  getHiddenMaskContext: () => {
    const canvas = get().hiddenMaskCanvas;
    if (!canvas) {
      console.warn('[IRIS] getHiddenMaskContext: No hidden mask canvas available');
      return null;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[IRIS] getHiddenMaskContext: Failed to get 2D context');
    }
    
    return ctx;
  },

  // Mask Area Actions (replaces vars.mask_area)
  setMaskArea: (area: [number, number, number, number] | null) => {
    // Validate input
    if (area !== null) {
      if (!Array.isArray(area) || area.length !== 4 || !area.every(coord => typeof coord === 'number' && !isNaN(coord))) {
        console.error('[IRIS] setMaskArea: Invalid mask area coordinates', area);
        return;
      }
    }

    set({ maskArea: area });

    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.mask_area = area;
    }
  },

  getMaskArea: () => {
    return get().maskArea;
  },

  // PHASE 1: Core Drawing Actions with Legacy Sync
  setCurrentTool: (tool: 'move' | 'draw' | 'eraser') => {
    // Validate tool type
    const validTools = ['move', 'draw', 'eraser'] as const;
    if (!validTools.includes(tool)) {
      console.warn('[IRIS] setCurrentTool: Invalid tool type provided', tool);
      return;
    }
    
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
    const clampedSize = Math.max(1, Math.min(size, 100)); // Reasonable bounds: 1-100 pixels
    set({ toolSize: clampedSize });
    
    // Sync with legacy vars during migration for backward compatibility
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
    
    // Trigger React preview layer re-render
    window.dispatchEvent(new CustomEvent('react-preview-render'));
  },

  setToolResizingMode: (resizing: boolean) => {
    set({ toolResizingMode: resizing });
    
    // Sync with legacy vars during migration for backward compatibility
    const w = window as any;
    if (w.vars?.tool) {
      w.vars.tool.resizing_mode = resizing;
    }
  },

  setToolShape: (shape: 'square' | 'round') => {
    // Validate shape type
    const validShapes = ['square', 'round'] as const;
    if (!validShapes.includes(shape)) {
      console.warn('[IRIS] setToolShape: Invalid shape type provided', shape);
      return;
    }
    
    set({ toolShape: shape });
    
    // Sync with legacy vars during migration for backward compatibility
    const w = window as any;
    if (w.vars?.tool) {
      w.vars.tool.shape = shape;
    }
    
    // Trigger legacy preview render (with safety check for initialization)
    if (w.vars && w.vars.vm && w.vars.vm.getLayers && w.render_preview) {
      w.render_preview();
    } else {
      console.log('[IRIS] setToolShape: Skipping render_preview, ViewManager not initialized yet');
    }
    
    // Trigger React preview layer re-render
    window.dispatchEvent(new CustomEvent('react-preview-render'));
  },

  setShowDrawToolDropdown: (show: boolean) => {
    set({ showDrawToolDropdown: show });
  },

  setShowEraserToolDropdown: (show: boolean) => {
    set({ showEraserToolDropdown: show });
  },

  setCurrentClass: (classId: number) => {
    const { classes } = get();
    
    // Allow setting class even if no classes are loaded yet (for initialization)
    if (classes.length === 0) {
      console.log(`[IRIS] setCurrentClass: No classes available yet, setting class ${classId} for later validation`);
      set({ currentClass: classId });
      
      // Sync with legacy vars during migration
      const w = window as any;
      if (w.vars) {
        w.vars.current_class = classId;
      }
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
    // Validate input
    if (!Array.isArray(classes)) {
      console.error('[IRIS] setClasses: Invalid classes array', classes);
      return;
    }

    // Validate each class has required properties
    const validClasses = classes.filter(cls => {
      // Check if name exists and is not empty
      if (!cls.name || cls.name.trim() === '') {
        console.warn('[IRIS] setClasses: Invalid class definition - missing or empty name', cls);
        return false;
      }
      
      // Check if colour exists and is a valid RGBA array
      if (!cls.colour || !Array.isArray(cls.colour) || cls.colour.length !== 4) {
        console.warn('[IRIS] setClasses: Invalid class definition - invalid colour array', cls);
        return false;
      }
      
      // Check if all colour values are numbers
      if (!cls.colour.every(val => typeof val === 'number' && val >= 0 && val <= 255)) {
        console.warn('[IRIS] setClasses: Invalid class definition - colour values must be numbers 0-255', cls);
        return false;
      }
      
      return true;
    });

    set({ classes: validClasses });

    // Sync with legacy vars during migration
    const w = window as any;
    if (w.vars) {
      w.vars.classes = validClasses;
    }

    // Update current class if it's now out of bounds
    const { currentClass } = get();
    if (currentClass >= validClasses.length) {
      get().setCurrentClass(0);
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

  // Helper function to calculate pixel counts from mask data
  calculatePixelCounts: () => {
    const { maskData, userMaskData, classes } = get();
    if (!maskData || !userMaskData || !classes) return { total: 0 };

    const counts: { [classId: number]: number; total: number } = { total: 0 };
    
    // Initialize counts for all classes
    classes.forEach((_, index) => {
      counts[index] = 0;
    });

    // Count pixels where user has drawn (user_mask[i] == 1)
    for (let i = 0; i < userMaskData.length; i++) {
      if (userMaskData[i]) {
        const classId = maskData[i];
        if (counts[classId] !== undefined) {
          counts[classId]++;
          counts.total++;
        }
      }
    }

    return counts;
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
    } else {
      // When mask is saved (changed = false), reset the dialogue flag
      get().setShowDialogueBeforeNextImage(false);
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
      toolResizingMode: state.toolResizingMode,
      currentClass: state.currentClass,
      maskType: state.maskType,
      classesCount: state.classes.length,
      totalUserPixels: state.userPixelCounts.total,
      // Mouse & Canvas State debug info
      cursorImage: state.cursorImage,
      dragStart: state.dragStart,
      isDragging: state.dragStart !== null,
      // PHASE 2: Navigation & Actions debug info
      hasConfig: state.config !== null,
      hasUser: state.user !== null,
      hasConfusionMatrix: state.confusionMatrix !== null,
      maskChanged: state.maskChanged,
      isLoading: state.isLoading,
      lastSaveTime: state.lastSaveTime ? state.lastSaveTime.toISOString() : null,
      // API URLs debug info
      hasApiUrls: state.apiUrls !== null,
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
      if (typeof w.vars.tool.resizing_mode === 'boolean') {
        store.setToolResizingMode(w.vars.tool.resizing_mode);
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
  (window as any).getApiUrlsFromStore = getApiUrlsFromStore;
  (window as any).getApiUrlFromStore = getApiUrlFromStore;
  (window as any).setApiUrlsInStore = setApiUrlsInStore;
  (window as any).getNextActionFromStore = getNextActionFromStore;
  (window as any).setNextActionInStore = setNextActionInStore;
  (window as any).getJustLoggedInFromStore = getJustLoggedInFromStore;
  (window as any).setJustLoggedInInStore = setJustLoggedInInStore;
  (window as any).getToolSizeFromStore = getToolSizeFromStore;
  (window as any).getToolResizingModeFromStore = getToolResizingModeFromStore;
  (window as any).getCursorImageFromStore = getCursorImageFromStore;
  (window as any).setCursorImageInStore = setCursorImageInStore;
  (window as any).getCurrentToolFromStore = getCurrentToolFromStore;
  (window as any).setCurrentToolInStore = setCurrentToolInStore;
  (window as any).getDragStartFromStore = getDragStartFromStore;
  (window as any).setDragStartInStore = setDragStartInStore;
  (window as any).getToolShapeFromStore = getToolShapeFromStore;
  (window as any).setToolShapeInStore = setToolShapeInStore;
  (window as any).getHiddenMaskCanvasFromStore = getHiddenMaskCanvasFromStore;
  (window as any).getHiddenMaskContextFromStore = getHiddenMaskContextFromStore;
  (window as any).createHiddenMaskCanvasFromStore = createHiddenMaskCanvasFromStore;
  
  // Export mask area helper functions for legacy JavaScript
  (window as any).getMaskAreaFromStore = getMaskAreaFromStore;
  (window as any).setMaskAreaInStore = setMaskAreaInStore;
  
  // CRITICAL: Export mask data helper functions for legacy JavaScript
  (window as any).getMaskDataFromStore = getMaskDataFromStore;
  (window as any).setMaskDataInStore = setMaskDataInStore;
  (window as any).getUserMaskDataFromStore = getUserMaskDataFromStore;
  (window as any).setUserMaskDataInStore = setUserMaskDataInStore;
  (window as any).getErrorsMaskDataFromStore = getErrorsMaskDataFromStore;
  (window as any).setErrorsMaskDataInStore = setErrorsMaskDataInStore;
  (window as any).getMaskPixelFromStore = getMaskPixelFromStore;
  (window as any).setMaskPixelInStore = setMaskPixelInStore;
  (window as any).getUserMaskPixelFromStore = getUserMaskPixelFromStore;
  (window as any).setUserMaskPixelInStore = setUserMaskPixelInStore;
  (window as any).copyMaskFromStore = copyMaskFromStore;
  (window as any).copyUserMaskFromStore = copyUserMaskFromStore;
  (window as any).getMaskTypeFromStore = getMaskTypeFromStore;
  (window as any).getClassesFromStore = getClassesFromStore;
  (window as any).getClassFromStore = getClassFromStore;
  (window as any).getClassColorFromStore = getClassColorFromStore;
  (window as any).getClassNameFromStore = getClassNameFromStore;
  (window as any).getClassCountFromStore = getClassCountFromStore;
  (window as any).setClassesInStore = setClassesInStore;
  (window as any).getCurrentClassFromStore = getCurrentClassFromStore;
  (window as any).setCurrentClassInStore = setCurrentClassInStore;
  
  // CRITICAL: Export mask shape helper functions for legacy JavaScript (vars.mask_shape migration)
  (window as any).getMaskShapeFromStore = getMaskShapeFromStore;
  (window as any).setMaskShapeInStore = setMaskShapeInStore;
  (window as any).getMaskWidthFromStore = getMaskWidthFromStore;
  (window as any).getMaskHeightFromStore = getMaskHeightFromStore;
  
  // Export history system helper functions
  (window as any).updateHistoryInStore = updateHistoryInStore;
  (window as any).undoInStore = undoInStore;
  (window as any).redoInStore = redoInStore;
  (window as any).discardFutureInStore = discardFutureInStore;
  (window as any).canUndoFromStore = canUndoFromStore;
  (window as any).canRedoFromStore = canRedoFromStore;
  
  // Initialize from legacy vars when available
  (window as any).initializeFiltersFromLegacy = initializeFiltersFromLegacy;
  (window as any).initializeCoreDrawingStateFromLegacy = initializeCoreDrawingStateFromLegacy;
  (window as any).initializeNavigationActionsStateFromLegacy = initializeNavigationActionsStateFromLegacy;
  
  // Migration tracking - only log when store is available (no need to spam console)
  console.log('[IRIS Migration] API URLs Migration: React store ready. Watch for warnings if legacy fallbacks are used.');
  console.log('[IRIS Migration] Next Action Migration: React store ready. Watch for warnings if legacy fallbacks are used.');
  console.log('[IRIS Migration] Just Logged In Migration: React store ready. Watch for warnings if legacy fallbacks are used.');
  console.log('[IRIS Migration] Tool Size Migration: React store ready. Watch for warnings if legacy fallbacks are used.');
  console.log('[IRIS Migration] Tool Resizing Mode Migration: React store ready. Watch for warnings if legacy fallbacks are used.');
  console.log('[IRIS Migration] Cursor Image Migration: React store ready. Watch for warnings if legacy fallbacks are used.');
  console.log('[IRIS Migration] Tool Type Migration: React store ready. Watch for warnings if legacy fallbacks are used.');
  console.log('[IRIS Migration] Drag Start Migration: React store ready. Watch for warnings if legacy fallbacks are used.');
  console.log('[IRIS Migration] Hidden Mask Canvas Migration: React store ready. Watch for warnings if legacy fallbacks are used.');
  console.log('[IRIS Migration] 🚨 CRITICAL: Mask Data Migration: React store ready. Watch for warnings if legacy fallbacks are used.');
  console.log('[IRIS Migration] 🚨 CRITICAL: User Mask Data Migration: React store ready. Watch for warnings if legacy fallbacks are used.');
  console.log('[IRIS Migration] 🚨 CRITICAL: History System Migration: React store ready. Watch for warnings if legacy fallbacks are used.');
  
  // Initialize debug mode from legacy vars
  const w = window as any;
  if (w.vars?.debug_mode) {
    useSegmentationStore.getState().setDebugMode(true);
  }

  // Check for legacy vars periodically and initialize store state
  let coreDrawingInitialized = false;
  let navigationActionsInitialized = false;

  const checkForLegacyVars = () => {
    // Initialize core drawing state from legacy vars (once)
    if (!coreDrawingInitialized && w.vars) {
      initializeCoreDrawingStateFromLegacy();
      coreDrawingInitialized = true;
    }
    
    // Initialize navigation & actions state from legacy vars (once)
    if (!navigationActionsInitialized && w.vars?.config) {
      initializeNavigationActionsStateFromLegacy();
      navigationActionsInitialized = true;
    }
  };

  // Initial check
  checkForLegacyVars();

  // Periodic check for legacy vars (in case they're loaded later)
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

// Export helper functions for testing and external use
export {
  getClassesFromStore,
  getClassFromStore,
  getClassColorFromStore,
  getClassNameFromStore,
  getClassCountFromStore,
  setClassesInStore,
  getCurrentClassFromStore,
  setCurrentClassInStore
};
