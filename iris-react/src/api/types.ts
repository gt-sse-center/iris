export interface IrisClass {
  id?: number;
  name: string;
  colour: [number, number, number, number?];
  css_colour?: string;
}

export interface IrisView {
  name: string;
  description: string;
  data: string[];
  type?: string;
  cmap?: string;
  stretch?: string;
  clip?: number;
  vmin?: number;
  vmax?: number;
}

export type IrisViewGroup = string[];

export interface IrisAIModelConfig {
  bands: string[] | null;
  train_ratio: number;
  max_train_pixels: number;
  n_estimators: number;
  max_depth: number;
  n_leaves: number;
  suppression_threshold: number;
  suppression_filter_size: number;
  suppression_default_class: number;
  use_edge_filter: boolean;
  use_superpixels: boolean;
  use_meshgrid: boolean;
  meshgrid_cells: string;
}

export interface IrisSegmentationConfig {
  path: string;
  mask_encoding: "integer" | "binary" | "rgb" | "rgba";
  mask_area: [number, number, number, number];
  mask_shape: [number, number];
  score: "f1" | "jaccard" | "accuracy";
  prioritise_unmarked_images: boolean;
  unverified_threshold: number;
  test_images: string[] | null;
  ai_model: IrisAIModelConfig;
}

export interface IrisConfig {
  name: string;
  host: string;
  port: number;
  debug: boolean;
  images: {
    path: string | Record<string, string>;
    metadata?: string | Record<string, string> | false;
    thumbnails?: string | Record<string, string> | false;
    shape: [number, number];
  };
  views: Record<string, IrisView>;
  view_groups: Record<string, IrisViewGroup>;
  segmentation: IrisSegmentationConfig;
  classes: IrisClass[];
}

export interface IrisSegmentationStats {
  score: number;
  score_unverified: number;
  n_masks: number;
}

export interface IrisUser {
  id: number;
  name: string;
  admin: boolean;
  tested: boolean;
  created: string;
  image_seed: number;
  segmentation: IrisSegmentationStats;
  config?: IrisConfig;
}

export interface IrisAction {
  id: number;
  type: string;
  image_id: string;
  user_id: number;
  last_modification: string;
  time_spent: string;
  score: number;
  unverified: boolean;
  complete: boolean;
  notes: string | null;
  difficulty: number;
}

export interface SegmentationBootstrap {
  imageId: string;
  imageLocation: [number, number];
}

export interface ImageInfoSummary {
  id: string;
  segmentation: {
    count: number;
    current_user_score: number | null;
    current_user_score_unverified?: boolean;
  };
  classification?: {
    count: number;
    current_user_score: number | null;
  };
  detection?: {
    count: number;
    current_user_score: number | null;
  };
}

export interface PredictMaskPayload {
  user_pixels: number[];
  user_labels: number[];
}
