import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from '../StoreContext';
export default function RootLayout() {
  return <SafeAreaProvider><StoreProvider><Slot /></StoreProvider></SafeAreaProvider>;
}
