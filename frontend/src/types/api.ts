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
}

export interface SurfSessionCreate {
  datetime: string;
  duration_minutes: number;
  wave_quality: number;
  notes?: string;
  spot_id?: number;
  spot_name?: string;
}

export interface SurfSessionResponse {
  id: number;
  datetime: string;
  duration_minutes: number;
  wave_quality: number;
  notes?: string;
  spot_id: number;
  user_id: number;
  created_at: string;
  spot: SpotResponse;
  wave_height_m?: number;
  wave_period?: number;
  wave_dir?: string;
  wind_speed_kmh?: number;
  wind_dir?: string;
  energy?: number;
  rating?: number;
}