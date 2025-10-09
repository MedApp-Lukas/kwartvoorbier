
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

export type Product = {
  id: number;
  name: string;
};

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
};

export type UserProfile = {
  id: string;
  email?: string; 
  full_name?: string; // Naam van de gebruiker (uit Google)
  role: 'beheerder' | 'gebruiker';
};