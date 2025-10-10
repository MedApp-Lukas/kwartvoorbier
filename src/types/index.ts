
export enum AppState {
  COUNTDOWN,
  ORDERING,
  CLOSED,
}

export enum ViewMode {
  ORDER = 'ORDER',
  PICKUP = 'PICKUP',
  ADMIN = 'ADMIN',
}

export interface Product {
  id: number;
  name: string;
  available_on_days: number[] | null; // Voeg deze regel toe
  order_index: number; 
}

export type Location = {
  id: number;
  name: string;
  floor: number;
  description: string;
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