import { createContext, useContext, type ReactNode } from 'react';
import { useStore } from './useStore';
const Context = createContext<ReturnType<typeof useStore> | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useStoreContext() {
  const store = useContext(Context);
  if (!store) throw new Error('Store provider is missing');
  return store;
}
