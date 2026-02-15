export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface SpotCreate {
  name: string;
  latitude?: number;
  longitude?: number;
  difficulty?: number[];
  surf_forecast_name?: string;
}

export interface SpotResponse {
  id: number;
  name: string;
  latitude?: number;
  longitude?: number;
  difficulty?: number[];
  surf_forecast_name?: string;
  review_summary?: SpotReviewSummary | null;
  recent_reviews?: SpotReviewResponse[];
}

export interface SpotReviewSummary {
  weighted_quality?: number | null;
  avg_crowded_level?: number | null;
  avg_wave_height_index?: number | null;
  avg_short_long_index?: number | null;
  avg_wind_index?: number | null;
  review_count: number;
  latest_observed_at?: string | null;
}

export interface SpotReviewResponse {
  id: number;
  surf_session_id: number;
  observed_at: string;
  quality: number;
  crowded_level?: number | null;
  wave_height_index?: number | null;
  short_long_index?: number | null;
  wind_index?: number | null;
}

export interface SurfSessionReviewCreate {
  observed_at?: string;
  quality: number;
  crowded_level: number;
  wave_height_index: number;
  short_long_index: number;
  wind_index: number;
}

export interface SurfSessionReviewResponse {
  id: number;
  surf_session_id: number;
  spot_id: number;
  observed_at: string;
  quality: number;
  crowded_level?: number | null;
  wave_height_index?: number | null;
  short_long_index?: number | null;
  wind_index?: number | null;
  created_at: string;
}

export interface SurfboardCreate {
  name?: string | null;
  brand?: string | null;
  model?: string | null;
  length_ft: number;
  width_in?: number | null;
  thickness_in?: number | null;
  volume_liters?: number | null;
}

export interface SurfboardResponse {
  id: number;
  name?: string | null;
  brand?: string | null;
  model?: string | null;
  length_ft: number;
  width_in?: number | null;
  thickness_in?: number | null;
  volume_liters?: number | null;
  owner_id: number;
}

export interface SurfboardUpdate {
  name?: string | null;
  brand?: string | null;
  model?: string | null;
  length_ft?: number;
  width_in?: number | null;
  thickness_in?: number | null;
  volume_liters?: number | null;
}

export interface SurfSessionCreate {
  datetime: string;
  duration_minutes: number;
  notes?: string;
  spot_id?: number;
  spot_name?: string;
  review?: SurfSessionReviewCreate | null;
  surfboard_id?: number;
  surfboard_name?: string | null;
  surfboard_brand?: string | null;
  surfboard_model?: string | null;
  surfboard_length_ft?: number | null;
  surfboard_width_in?: number | null;
  surfboard_thickness_in?: number | null;
  surfboard_volume_liters?: number | null;
  save_surfboard_to_quiver?: boolean;
}

export interface SurfSessionResponse {
  id: number;
  datetime: string;
  duration_minutes: number;
  notes?: string;
  spot_id: number;
  surfboard_id?: number;
  surfboard_name?: string | null;
  surfboard_brand?: string | null;
  surfboard_model?: string | null;
  surfboard_length_ft?: number | null;
  surfboard_width_in?: number | null;
  surfboard_thickness_in?: number | null;
  surfboard_volume_liters?: number | null;
  user_id: number;
  created_at: string;
  spot: SpotResponse;
  surfboard?: SurfboardResponse;
  review?: SurfSessionReviewResponse | null;
  wave_height_m?: number;
  wave_period?: number;
  wave_dir?: string;
  wind_speed_kmh?: number;
  wind_dir?: string;
  energy?: number;
  rating?: number;
  tide_height_m?: number;
  tide_low_m?: number;
  tide_high_m?: number;
}
