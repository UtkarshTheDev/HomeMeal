export interface User {
  id: string;
  name: string;
  email: string | null;
  phone_number: string;
  role: 'customer' | 'maker' | 'delivery_boy';
  location: { latitude: number; longitude: number } | null;
  profile_image_url: string | null;
  strike_count: number;
  banned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Food {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface MakerFood {
  id: string;
  maker_id: string;
  food_id: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  meal_id: string;
  foods: string[];
  maker_id: string;
  delivery_boy_id: string | null;
  status: 'pending' | 'accepted' | 'prepared' | 'in_transit' | 'delivered' | 'cancelled';
  otp: string;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'pending' | 'completed' | 'failed';
  order_id: string | null;
  payment_method: string;
  transaction_id: string;
  created_at: string;
}

export interface Rating {
  id: string;
  order_id: string;
  user_id: string;
  maker_id: string;
  delivery_boy_id: string;
  rating_for_maker: number;
  rating_for_delivery: number;
  review_for_maker: string;
  review_for_delivery: string;
  created_at: string;
}