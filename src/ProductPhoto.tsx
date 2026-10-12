import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { imageUrl } from './config';
import type { Product } from './types';
// Same reference crops used by the website until final product photos are supplied.
const crops: Record<string, [number, number, number, number]> = {
  'ameera-embroidered-abaya': [827, 77, 194, 244],
  'layla-silk-sand-abaya': [604, 132, 90, 109],
  'hana-cotton-abaya': [19, 1226, 113, 131],
  'lale-pleated-hijab': [217, 360, 153, 187],
  'pearl-artisanal-hijab': [703, 133, 89, 106],
  'noor-cotton-hijab': [20, 938, 151, 155],
};
const seedPaths = new Set(['/images/ameera-abaya.jpg', '/images/layla-abaya.jpg', '/images/hana-abaya.jpg', '/images/lale-hijab.jpg', '/images/pearl-hijab.jpg', '/images/noor-hijab.jpg']);
export function ProductPhoto({ product, compact = false }: { product: Product; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const fallback = failed || seedPaths.has(product.image_url);
  const [x, y, width, height] = crops[product.slug] ?? crops['pearl-artisanal-hijab'];
  const scale = Math.max(layout.width / width, layout.height / height);
  return <View accessible accessibilityRole="image" accessibilityLabel={product.name} onLayout={event => setLayout(event.nativeEvent.layout)} style={[styles.frame, compact && styles.compact]}>
    {fallback ? <Image source={require('../assets/reference.jpg')} style={{ position: 'absolute', width: 1600 * scale, height: 1536 * scale, left: -x * scale - (width * scale - layout.width) / 2, top: -y * scale - (height * scale - layout.height) / 2 }} />
      : <Image source={{ uri: imageUrl(product.image_url) }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setFailed(true)} />}
  </View>;
}
const styles = StyleSheet.create({ frame: { width: '100%', aspectRatio: 0.78, backgroundColor: '#e9e0d6', borderRadius: 4, overflow: 'hidden' }, compact: { width: 90, height: 115, aspectRatio: undefined } });
