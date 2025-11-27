
export enum AppState {
  COUNTDOWN,
  ORDERING,
  ROULETTE,
  CLOSED,
}

export enum ViewMode {
  ORDER = 'ORDER',
  PICKUP = 'PICKUP',
  ADMIN = 'ADMIN',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
}

export interface Product {
  id: number;
  name: string;
  available_on_days: number[] | null;
  order_index: number; 
  position?: number;
}

export type Location = {
  id: number;
  name: string;
  floor: number;
  description: string;
  position?: number;
};

export type Order = {
  id: number;
  customerName: string;
  created_at: Date;
  products: Product;
  locations: Location;
  collected: boolean;
  delivered: boolean;
  user_id: string;
};

export type UserProfile = {
  id: string;
  email?: string; 
  full_name?: string; // Naam van de gebruiker (uit Google)
  role: 'beheerder' | 'gebruiker';
};

export type FeatureRequestStatus = 'Backlog' | 'Word opgepakt' | 'Voltooid';

export type FeatureRequest = {
    id: number;
    created_at: Date;
    title: string;
    description: string;
    user_id: string;
    status: FeatureRequestStatus;
    customerName?: string;
};
