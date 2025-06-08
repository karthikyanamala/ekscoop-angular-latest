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
}
