import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { configured } from './config';
import { ProductPhoto } from './ProductPhoto';
import { money, type Product } from './types';
import { useStoreContext } from './StoreContext';

type ButtonProps = { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean };
function Button({ title, onPress, disabled, secondary }: ButtonProps) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.button, secondary && s.secondary, disabled && s.disabled]}><Text style={[s.buttonText, secondary && s.secondaryText]}>{title}</Text></Pressable>;
}

export default function StoreApp({ tab }: { tab: 'shop' | 'bag' | 'account' }) {
  const store = useStoreContext();
  const setTab = (value: 'shop' | 'bag' | 'account') => router.navigate(value === 'shop' ? '/' : value === 'bag' ? '/bag' : '/account');
  const [category, setCategory] = useState<'all' | 'abayas' | 'hijabs'>('all');
  const [selected, setSelected] = useState<Product | null>(null);
  const [size, setSize] = useState('');
  const count = store.cart.reduce((n, item) => n + item.quantity, 0);
  const subtotal = store.cart.reduce((n, item) => n + (item.product?.price_cents ?? 0) * item.quantity, 0);
  const user = store.session?.user;
  if (!configured) return <SafeAreaView style={s.screen}><View style={s.empty}><Text style={s.brand}>Fihan Store</Text><Text style={s.title}>Connect your store</Text><Text style={s.body}>Add the API URL and the existing store’s Supabase URL and publishable key to .env.local, then restart Expo. Setup steps are in README.md.</Text></View></SafeAreaView>;
  return <SafeAreaView style={s.screen}>
    <StatusBar style="dark" />
    <View style={s.header}><Text style={s.brand}>Fihan Store<Text style={s.flower}> ✻</Text></Text><Text style={s.tagline}>Modesty, beautifully made.</Text></View>
    {store.error && <View style={s.error}><Text accessibilityRole="alert" style={s.errorText}>{store.error}</Text><Button title="Dismiss" secondary onPress={() => store.setError(null)} /></View>}
    {tab === 'shop' && <FlatList
      data={store.products.filter(p => category === 'all' || p.category === category)}
      keyExtractor={p => p.id} numColumns={2} columnWrapperStyle={s.columns} contentContainerStyle={s.catalogue}
      refreshControl={<RefreshControl refreshing={store.loading} onRefresh={() => { store.setError(null); void store.refreshProducts(); }} tintColor="#5e4739" />}
      ListHeaderComponent={<View>
        <View style={s.hero}><Text style={s.eyebrow}>THE FIHAN COLLECTION</Text><Text style={s.heroTitle}>Everyday grace.{'\n'}Timeless style.</Text><Text style={s.body}>Discover thoughtfully chosen abayas and hijabs for every moment.</Text></View>
        <View style={s.filters}>{(['all', 'abayas', 'hijabs'] as const).map(c => <Pressable key={c} accessibilityRole="button" accessibilityState={{ selected: category === c }} onPress={() => setCategory(c)} style={[s.chip, category === c && s.chipActive]}><Text style={[s.chipText, category === c && s.chipTextActive]}>{c === 'all' ? 'All pieces' : c === 'abayas' ? 'Abayas' : 'Hijabs'}</Text></Pressable>)}</View>
      </View>}
      ListEmptyComponent={<View style={s.empty}>{store.loading ? <ActivityIndicator color="#5e4739" /> : <><Text style={s.body}>No pieces to show yet.</Text><Button title="Reload collection" secondary onPress={() => void store.refreshProducts()} /></>}</View>}
      renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`View ${item.name}, ${money(item.price_cents)}`} style={s.card} onPress={() => { setSelected(item); setSize(item.sizes[0]); }}><ProductPhoto key={item.id} product={item} /><Text style={s.productName}>{item.name}</Text><Text style={s.muted}>{item.color}</Text><Text style={s.price}>{money(item.price_cents)}</Text></Pressable>}
    />}
    {tab === 'bag' && <ScrollView contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={false} onRefresh={() => void store.refreshCart()} />}>
      <Text style={s.title}>Your bag <Text style={s.muted}>({count})</Text></Text><Text style={s.sync}>{store.sync}</Text>
      {store.lastSynced && <Text style={s.small}>Last checked {store.lastSynced.toLocaleTimeString()}</Text>}
      {!user ? <View style={s.empty}><Text style={s.body}>Sign in with the same Google account you use on the website to see your bag here.</Text><Button title="Continue with Google" disabled={store.busy || store.authLoading} onPress={() => void store.login()} /></View>
        : !store.cart.length ? <View style={s.empty}><Text style={s.title}>A little room for something lovely.</Text><Text style={s.body}>Your bag is empty. Pieces you add on the website will appear here too.</Text><Button title="Explore the collection" onPress={() => setTab('shop')} /></View>
        : <>{store.cart.map(item => <View key={item.id} style={s.cartRow}>
          {item.product && <ProductPhoto key={item.product.id} product={item.product} compact />}
          <View style={s.cartContent}><Text style={s.productName}>{item.product?.name ?? 'Unavailable product'}</Text><Text style={s.muted}>{item.size}{item.product ? ` · ${item.product.color}` : ''}</Text><Text style={s.price}>{item.product ? money(item.product.price_cents * item.quantity) : 'Remove to continue'}</Text>
            <View style={s.quantity}><Button title="−" secondary disabled={store.busy || item.quantity <= 1 || !item.product} onPress={() => void store.changeCart(item.product_id, item.size, item.quantity - 1, 'PATCH')} /><Text style={s.quantityNumber}>{item.quantity}</Text><Button title="+" secondary disabled={store.busy || item.quantity >= 20 || !item.product} onPress={() => void store.changeCart(item.product_id, item.size, item.quantity + 1, 'PATCH')} /></View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.product?.name ?? 'unavailable product'}`} disabled={store.busy} onPress={() => void store.changeCart(item.product_id, item.size, 0, 'DELETE')} style={s.remove}><Text style={s.muted}>Remove</Text></Pressable>
          </View>
        </View>)}<View style={s.total}><Text style={s.productName}>Subtotal</Text><Text style={s.productName}>{money(subtotal)}</Text></View><Text style={s.small}>Your bag is shared with the Fihan Store website.</Text></>}
      {store.busy && <ActivityIndicator color="#5e4739" />}
    </ScrollView>}
    {tab === 'account' && <ScrollView contentContainerStyle={s.page}><Text style={s.title}>Your account</Text><View style={s.account}><Text style={s.accountIcon}>✻</Text><Text style={s.title}>{user ? user.user_metadata.full_name ?? 'Welcome back' : 'Welcome to Fihan'}</Text><Text style={s.body}>{user?.email ?? 'One account for the website and your phone. Sign in with Google to keep your favourite pieces together.'}</Text>
      {store.authLoading ? <ActivityIndicator /> : user ? <><Text style={s.sync}>{store.sync}</Text><Button title="Sign out on this phone" secondary disabled={store.busy} onPress={() => Alert.alert('Sign out?', 'You can sign back in to see your shared bag.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', onPress: () => void store.logout() }])} /></> : <Button title="Continue with Google" disabled={store.busy} onPress={() => void store.login()} />}
    </View></ScrollView>}
    <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
      <SafeAreaView style={s.screen}>{selected && <ScrollView contentContainerStyle={s.page}>
        <Button title="Back to collection" secondary onPress={() => setSelected(null)} /><ProductPhoto key={selected.id} product={selected} />
        <Text style={s.title}>{selected.name}</Text><Text style={s.price}>{money(selected.price_cents)}</Text><Text style={s.body}>{selected.description}</Text><Text style={s.productName}>Choose your size</Text>
        <View style={s.filters}>{selected.sizes.map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: size === value }} onPress={() => setSize(value)} style={[s.chip, size === value && s.chipActive]}><Text style={[s.chipText, size === value && s.chipTextActive]}>{value}</Text></Pressable>)}</View>
        {store.error && <Text accessibilityRole="alert" style={s.errorText}>{store.error}</Text>}
        <Button title={store.busy ? 'Please wait…' : user ? 'Add to bag' : 'Sign in with Google to shop'} disabled={store.busy || store.authLoading || !size} onPress={() => { void store.changeCart(selected.id, size, 1, 'POST').then(added => { if (added) { setSelected(null); setTab('bag'); } }); }} />
      </ScrollView>}</SafeAreaView>
    </Modal>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fcfaf7' }, header: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: '#e8dfd5' },
  brand: { fontFamily: 'serif', fontSize: 29, color: '#3c3028' }, flower: { color: '#8b6e50' }, tagline: { color: '#75695f', fontSize: 12, marginTop: 4, letterSpacing: 1 },
  catalogue: { padding: 18, paddingBottom: 32 }, columns: { gap: 14 }, hero: { backgroundColor: '#efe6da', padding: 24, borderRadius: 4, marginBottom: 22 },
  eyebrow: { fontSize: 10, letterSpacing: 2, color: '#75604b', marginBottom: 12 }, heroTitle: { fontFamily: 'serif', fontSize: 35, lineHeight: 42, color: '#3c3028', marginBottom: 12 },
  title: { fontFamily: 'serif', fontSize: 27, color: '#3c3028', marginVertical: 12 }, body: { fontSize: 15, lineHeight: 23, color: '#75695f', marginBottom: 18 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22, marginTop: 8 }, chip: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: '#d8cbbb' },
  chipActive: { backgroundColor: '#5e4739', borderColor: '#5e4739' }, chipText: { color: '#5e4739', fontSize: 13 }, chipTextActive: { color: '#fff' },
  card: { flex: 1, maxWidth: '50%', marginBottom: 24 }, photo: { width: '100%', aspectRatio: 0.78, backgroundColor: '#e9e0d6', borderRadius: 4 }, placeholder: { justifyContent: 'center', alignItems: 'center' },
  productName: { color: '#3c3028', fontSize: 15, fontWeight: '600', marginTop: 10, marginBottom: 5 }, muted: { color: '#75695f', fontSize: 13 }, price: { color: '#5e4739', fontSize: 15, marginTop: 8, marginBottom: 10 },
  page: { padding: 22, paddingBottom: 38 }, empty: { padding: 26, gap: 14 }, button: { backgroundColor: '#5e4739', paddingHorizontal: 18, paddingVertical: 14, borderRadius: 4, alignItems: 'center', marginVertical: 4 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 14 }, secondary: { backgroundColor: '#eee6dc' }, secondaryText: { color: '#5e4739' }, disabled: { opacity: 0.45 },
  error: { backgroundColor: '#fae8e3', padding: 14 }, errorText: { color: '#962f21', lineHeight: 21 }, sync: { color: '#5a7052', fontSize: 12, marginBottom: 8 }, small: { color: '#75695f', fontSize: 11, marginBottom: 14 },
  cartRow: { flexDirection: 'row', gap: 16, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#e8dfd5' }, cartPhoto: { width: 90, height: 115, aspectRatio: undefined }, cartContent: { flex: 1 },
  quantity: { flexDirection: 'row', alignItems: 'center', gap: 10 }, quantityNumber: { color: '#3c3028', fontSize: 15 }, remove: { paddingVertical: 12, alignSelf: 'flex-start' }, total: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, marginBottom: 8 },
  account: { marginTop: 30, gap: 10 }, accountIcon: { fontSize: 50, color: '#8b6e50' }, nav: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e8dfd5', paddingVertical: 6 }, navItem: { flex: 1, alignItems: 'center', paddingVertical: 15 }, navText: { color: '#8b8075', fontSize: 13 }, navActive: { color: '#5e4739', fontWeight: '700' },
});
