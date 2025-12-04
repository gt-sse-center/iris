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
    rank: number;
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