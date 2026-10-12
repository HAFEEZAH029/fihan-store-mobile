import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useStoreContext } from '../../StoreContext';
export default function TabLayout() {
  const { cart } = useStoreContext();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#5e4739', tabBarInactiveTintColor: '#8b8075', tabBarStyle: { backgroundColor: '#fcfaf7', borderTopColor: '#e8dfd5' } }}>
    <Tabs.Screen name="index" options={{ title: 'Collection', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 23 }}>✻</Text> }} />
    <Tabs.Screen name="bag" options={{ title: 'Bag', tabBarBadge: count || undefined, tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 23 }}>▱</Text> }} />
    <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 23 }}>○</Text> }} />
  </Tabs>;
}
