import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, StatusBar, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ResumenScreen from './src/screens/ResumenScreen';
import GastosScreen from './src/screens/GastosScreen';
import VentasScreen from './src/screens/VentasScreen';
import { usePersistedState, KEY_GASTOS, KEY_VENTAS, DEMO_GASTOS, DEMO_VENTAS } from './src/utils/storage';
import { COLORS, today, getWeekRange, inRange } from './src/utils/helpers';

const TABS = [
  { key: 'resumen', label: '📊 Resumen' },
  { key: 'gastos',  label: '💸 Gastos'  },
  { key: 'ventas',  label: '🛒 Ventas'  },
];

const FILTROS = [
  ['hoy',    'Hoy'],
  ['semana', 'Esta semana'],
  ['semAnt', 'Sem. pasada'],
  ['todo',   'Todo'],
  ['pers',   '📅 Rango'],
];

export default function App() {
  const [tab, setTab] = useState('resumen');
  const [filtroTipo, setFiltroTipo] = useState('hoy');
  const [fDesde, setFDesde] = useState('');
  const [fHasta, setFHasta] = useState('');
  const [saved, setSaved] = useState(false);

  const [gastos, setGastos, gastosLoaded] = usePersistedState(KEY_GASTOS, DEMO_GASTOS);
  const [ventas, setVentas, ventasLoaded] = usePersistedState(KEY_VENTAS, DEMO_VENTAS);

  // Rango de fechas activo
  const filtroRango = useMemo(() => {
    const hoy = today();
    if (filtroTipo === 'hoy')    return { desde: hoy,         hasta: hoy,         label: 'Hoy' };
    if (filtroTipo === 'semana') { const w = getWeekRange(0);  return { desde: w.start, hasta: w.end, label: 'Esta semana' }; }
    if (filtroTipo === 'semAnt') { const w = getWeekRange(-1); return { desde: w.start, hasta: w.end, label: 'Semana pasada' }; }
    if (filtroTipo === 'todo')   return { desde: '',           hasta: '',           label: 'Todo' };
    return { desde: fDesde, hasta: fHasta, label: `${fDesde || 'inicio'} al ${fHasta || 'hoy'}` };
  }, [filtroTipo, fDesde, fHasta]);

  const { desde, hasta, label } = filtroRango;

  // Flash de guardado propagado desde hijos
  const flashSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const wrapSetGastos = (fn) => { setGastos(fn); flashSave(); };
  const wrapSetVentas = (fn) => { setVentas(fn); flashSave(); };

  if (!gastosLoaded || !ventasLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.hdr}>
        <Text style={styles.htitle}>🍊 Mi Frutería</Text>
        <Text style={styles.hsub}>Control de gastos y ganancias · datos guardados</Text>
        {saved && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✓ Guardado</Text>
          </View>
        )}
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(({ key, label: l }) => (
          <TouchableOpacity key={key} style={[styles.tabBtn, tab === key && styles.tabBtnActive]} onPress={() => setTab(key)}>
            {tab === key
              ? <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.tabGrad}><Text style={styles.tabTextActive}>{l}</Text></LinearGradient>
              : <Text style={styles.tabText}>{l}</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosScroll} contentContainerStyle={styles.filtrosContent}>
        {FILTROS.map(([k, l]) => (
          <TouchableOpacity
            key={k}
            style={[styles.filtroBtn, filtroTipo === k && styles.filtroBtnActive]}
            onPress={() => setFiltroTipo(k)}
          >
            <Text style={[styles.filtroText, filtroTipo === k && styles.filtroTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Rango personalizado */}
      {filtroTipo === 'pers' && (
        <View style={styles.persRow}>
          <TextInput
            style={styles.persInp}
            value={fDesde}
            onChangeText={setFDesde}
            placeholder="Desde (YYYY-MM-DD)"
            placeholderTextColor={COLORS.textLight}
          />
          <TextInput
            style={styles.persInp}
            value={fHasta}
            onChangeText={setFHasta}
            placeholder="Hasta (YYYY-MM-DD)"
            placeholderTextColor={COLORS.textLight}
          />
        </View>
      )}

      {/* Contenido */}
      <View style={{ flex: 1 }}>
        {tab === 'resumen' && (
          <ResumenScreen gastos={gastos} ventas={ventas} desde={desde} hasta={hasta} label={label} />
        )}
        {tab === 'gastos' && (
          <GastosScreen gastos={gastos} setGastos={wrapSetGastos} ventas={ventas} desde={desde} hasta={hasta} label={label} />
        )}
        {tab === 'ventas' && (
          <VentasScreen ventas={ventas} setVentas={wrapSetVentas} gastos={gastos} desde={desde} hasta={hasta} label={label} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  hdr: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  htitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  hsub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  badge: { backgroundColor: '#27ae60', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start', marginTop: 6 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  // Tabs
  tabsRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, margin: 13, marginBottom: 0, padding: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, gap: 3 },
  tabBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  tabBtnActive: {},
  tabGrad: { padding: 9, alignItems: 'center' },
  tabText: { color: '#888', fontSize: 11, fontWeight: '700', textAlign: 'center', paddingVertical: 9 },
  tabTextActive: { color: '#fff', fontSize: 11, fontWeight: '700' },
  // Filtros
  filtrosScroll: { marginTop: 10 },
  filtrosContent: { paddingHorizontal: 13, gap: 6 },
  filtroBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  filtroBtnActive: { backgroundColor: COLORS.primary },
  filtroText: { fontSize: 12, fontWeight: '700', color: '#888' },
  filtroTextActive: { color: '#fff' },
  // Rango personalizado
  persRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 13, marginTop: 6 },
  persInp: { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, padding: 10, fontSize: 12, color: COLORS.text },
});
