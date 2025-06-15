export interface Shop {
  id?: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  geohash: string;
  whatsappNumber: string;
  products: string[];
  distance?: number;  // important: add this
   openingTime?: string;  // e.g., '9:00 AM'
  closingTime?: string; 
}
