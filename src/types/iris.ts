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
}