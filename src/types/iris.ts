// IRIS API Type Definitions

export interface User {
  id: number;
  name: string;
  created: string;
  isAdmin: boolean;
  tested: boolean;
  image_seed: number;
  segmentation: {
    score: number;
    score_unverified: number;
    n_masks: number;
    rank?: number;
    last_masks?: Action[];
  };
}

export interface Action {
  id: number;
  type: string;
  image_id: string;
  user_id: number;
  last_modification: string;
  time_spent: string;
  score: number;
  unverified: boolean;
  complete: boolean;
  notes?: string;
  difficulty: number;
  username?: string; // Added by API for admin views
}

// Data Transfer Objects (DTOs) - match backend API property names
export interface UserDto {
  id: number;
  name: string;
  created: string;
  admin: boolean; // Backend uses 'admin'
  tested: boolean;
  image_seed: number;
  segmentation: {
    score: number;
    score_unverified: number;
    n_masks: number;
    rank?: number;
    last_masks?: Action[];
  };
}

export interface UsersApiResponse {
  users: UserDto[]; // API response contains DTOs
}

export interface ImageStats {
  processed: number;
  total: number;
}

export interface ActionsApiResponse {
  actions: Action[];
  image_stats: ImageStats;
  order_by: string;
  ascending: boolean;
}

// Images API types
export interface ImageTypeStats {
  score: number;
  count: number;
  difficulty: number;
  time_spent: number;
}

export interface ImageData {
  image_id: string;
  types: {
    [key: string]: ImageTypeStats;
  };
}

export interface ImagesApiResponse {
  images: ImageData[];
  order_by: string;
  ascending: boolean;
}

// Preferences/Config Types
export interface AIModelConfig {
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

export interface ClassConfig {
  name: string;
  colour: number[];
  css_colour: string;
  description?: string;
  user_colour?: number[];
}

// PHASE 2: Navigation & Actions Types
export interface ProjectConfig {
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

export interface ViewConfig {
  name: string;
  type: string;
  bands?: string[];
  expression?: string;
  colormap?: string;
  vmin?: number;
  vmax?: number;
}

export interface UserInfo {
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

export interface ConfusionMatrix {
  matrix: number[][];
  classes: string[];
  accuracy: number;
  f1_score: number;
  jaccard_index: number;
}

export interface UserConfig {
  segmentation: {
    ai_model: AIModelConfig;
  };
  classes: ClassConfig[];
}

export interface UserConfigApiResponse {
  config: UserConfig;
  all_bands: string[];
  is_admin: boolean;
}

// User Profile Types
export interface SegmentationMask {
  image_id: string;
  score: number;
  score_unverified: boolean;
  last_modification: string;
  time_spent: string;
}

export interface UserProfile {
  id: number;
  name: string;
  admin: boolean;
  tested: boolean;
  created: string;
  image_seed: number;
  segmentation: {
    rank: number | null;
    score: number;
    score_unverified: number;
    n_masks: number;
    last_masks: SegmentationMask[];
  };
  is_current_user: boolean;
}

export interface CurrentUserResponse {
  user: UserDto | null;
}

// Global window interface for React-legacy JavaScript integration
declare global {
  interface Window {
    openLogin?: () => void;
    openRegister?: () => void;
    openUserProfile?: (userId?: string) => void;
    reactLogout?: (callback?: () => void) => Promise<void>;
    irisReactApp?: {
      openHelpModal?: () => void;
      openUserProfile?: (userId?: string) => void;
      openPreferences?: () => void;
    };
    
    // Segmentation Store Helper Functions (Legacy Bridge)
    segmentationStore?: any;
    getNextActionFromStore?: () => (() => Promise<void>) | null;
    setNextActionInStore?: (action: (() => Promise<void>) | null) => void;
    getJustLoggedInFromStore?: () => boolean;
    setJustLoggedInInStore?: (loggedIn: boolean) => void;
    getToolSizeFromStore?: () => number;
    getToolResizingModeFromStore?: () => boolean;
    getCursorImageFromStore?: () => [number, number];
    setCursorImageInStore?: (x: number, y: number) => void;
    getCurrentToolFromStore?: () => 'move' | 'draw' | 'eraser';
    setCurrentToolInStore?: (tool: 'move' | 'draw' | 'eraser') => void;
    getDragStartFromStore?: () => [number, number] | null;
    setDragStartInStore?: (coords: [number, number] | null) => void;
    getToolShapeFromStore?: () => 'square' | 'round';
    setToolShapeInStore?: (shape: 'square' | 'round') => void;
    getHiddenMaskCanvasFromStore?: () => HTMLCanvasElement | null;
    getHiddenMaskContextFromStore?: () => CanvasRenderingContext2D | null;
    createHiddenMaskCanvasFromStore?: (width: number, height: number) => HTMLCanvasElement;
    
    // Mask Data Helper Functions
    getMaskDataFromStore?: () => Uint8Array | null;
    setMaskDataInStore?: (data: Uint8Array, width: number, height: number) => void;
    getUserMaskDataFromStore?: () => Uint8Array | null;
    setUserMaskDataInStore?: (data: Uint8Array) => void;
    getErrorsMaskDataFromStore?: () => Uint8Array | null;
    setErrorsMaskDataInStore?: (data: Uint8Array) => void;
    getMaskPixelFromStore?: (x: number, y: number) => number;
    setMaskPixelInStore?: (x: number, y: number, classId: number) => void;
    getUserMaskPixelFromStore?: (x: number, y: number) => number;
    setUserMaskPixelInStore?: (x: number, y: number, value: number) => void;
    copyMaskFromStore?: () => Uint8Array | null;
    copyUserMaskFromStore?: () => Uint8Array | null;
    getMaskTypeFromStore?: () => 'final' | 'user' | 'errors';
    getClassesFromStore?: () => any[];
    
    // Mask Shape Helper Functions
    getMaskShapeFromStore?: () => [number, number] | null;
    setMaskShapeInStore?: (width: number, height: number) => void;
    getMaskWidthFromStore?: () => number;
    getMaskHeightFromStore?: () => number;
    
    // Mask Area Helper Functions (NEW)
    getMaskAreaFromStore?: () => [number, number, number, number] | null;
    setMaskAreaInStore?: (area: [number, number, number, number] | null) => void;
    
    // History System Helper Functions
    updateHistoryInStore?: () => void;
    undoInStore?: () => void;
    redoInStore?: () => void;
    discardFutureInStore?: () => void;
    canUndoFromStore?: () => boolean;
    canRedoFromStore?: () => boolean;
    
    // Initialization Functions
    initializeFiltersFromLegacy?: () => void;
    initializeCoreDrawingStateFromLegacy?: () => void;
    initializeNavigationActionsStateFromLegacy?: () => void;
  }
}
