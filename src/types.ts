export type Product = {
  id: string; slug: string; name: string; category: 'abayas' | 'hijabs';
  description: string; price_cents: number; currency: string; image_url: string;
  gallery_urls: string[]; sizes: string[]; color: string;
};
export type CartItem = {
  id: string; product_id: string; size: string; quantity: number; product: Product | null;
};
export const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
