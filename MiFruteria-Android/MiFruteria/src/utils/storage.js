import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEY_GASTOS = 'fruteria_gastos_v2';
export const KEY_VENTAS = 'fruteria_ventas_v2';

const today = () => new Date().toISOString().split('T')[0];

export const DEMO_GASTOS = [
  { id: 1, fecha: today(), descripcion: 'Manzanas rojas', categoria: 'Compra de fruta', monto: 450 },
  { id: 2, fecha: today(), descripcion: 'Flete del mercado', categoria: 'Transporte', monto: 120 },
];

export const DEMO_VENTAS = [
  { id: 1, fecha: today(), fruta: '🍎 Manzana', cantidad: 10, unidad: 'kg', precio: 60, total: 600 },
];

export function usePersistedState(key, defaultVal) {
  const [state, setState] = useState(defaultVal);
  const [loaded, setLoaded] = useState(false);

  // Cargar desde AsyncStorage al montar
  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (raw !== null) {
          try { setState(JSON.parse(raw)); } catch {}
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [key]);

  const set = useCallback(
    (val) => {
      setState((prev) => {
        const next = typeof val === 'function' ? val(prev) : val;
        AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [key]
  );

  return [state, set, loaded];
}
