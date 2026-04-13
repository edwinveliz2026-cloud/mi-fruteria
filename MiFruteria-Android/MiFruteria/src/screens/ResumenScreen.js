import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, CAT_COLORS, CATEGORIAS, fmt, inRange, generarTextoReporte } from '../utils/helpers';

// ─── Gráfica de barras 7 días ───────────────────────────────────
function GraficaSemana({ ventas, gastos }) {
  const dias = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const f = d.toISOString().split('T')[0];
      const v = ventas.filter((x) => x.fecha === f).reduce((s, x) => s + Number(x.total), 0);
      const g = gastos.filter((x) => x.fecha === f).reduce((s, x) => s + Number(x.monto), 0);
      return { f, dia: d.toLocaleDateString('es-GT', { weekday: 'short' }), v, g };
    });
  }, [ventas, gastos]);

  const maxVal = Math.max(...dias.map((d) => Math.max(d.v, d.g)), 1);
  const BAR_H = 72;

  return (
    <View>
      <View style={styles.chartRow}>
        {dias.map((d) => (
          <View key={d.f} style={styles.chartCol}>
            <View style={[styles.chartPair, { height: BAR_H }]}>
              <View
                style={[styles.barV, { height: Math.max((d.v / maxVal) * BAR_H, 2) }]}
              />
              <View
                style={[styles.barG, { height: Math.max((d.g / maxVal) * BAR_H, 2) }]}
              />
            </View>
            <Text style={styles.diaLabel}>{d.dia}</Text>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legItem}><View style={[styles.dot, { backgroundColor: COLORS.success + '99' }]} /><Text style={styles.legText}>Ventas</Text></View>
        <View style={styles.legItem}><View style={[styles.dot, { backgroundColor: COLORS.danger + '88' }]} /><Text style={styles.legText}>Gastos</Text></View>
      </View>
    </View>
  );
}

// ─── Pantalla principal ─────────────────────────────────────────
export default function ResumenScreen({ gastos, ventas, desde, hasta, label }) {
  const [exporting, setExporting] = useState(false);

  const gastosFil = useMemo(() => gastos.filter((g) => inRange(g.fecha, desde, hasta)), [gastos, desde, hasta]);
  const ventasFil = useMemo(() => ventas.filter((v) => inRange(v.fecha, desde, hasta)), [ventas, desde, hasta]);
  const totG = useMemo(() => gastosFil.reduce((s, g) => s + Number(g.monto), 0), [gastosFil]);
  const totV = useMemo(() => ventasFil.reduce((s, v) => s + Number(v.total), 0), [ventasFil]);
  const gan = totV - totG;

  const catData = useMemo(() => {
    const m = {};
    CATEGORIAS.forEach((c) => { m[c] = 0; });
    gastosFil.forEach((g) => { m[g.categoria] = (m[g.categoria] || 0) + Number(g.monto); });
    return Object.entries(m).filter(([, v]) => v > 0);
  }, [gastosFil]);

  const exportar = async () => {
    try {
      setExporting(true);
      const texto = generarTextoReporte(gastos, ventas, desde, hasta, label);
      const path = FileSystem.documentDirectory + `reporte-fruteria-${desde || 'completo'}.txt`;
      await FileSystem.writeAsStringAsync(path, texto, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: 'text/plain', dialogTitle: 'Compartir reporte' });
    } catch (e) {
      Alert.alert('Error', 'No se pudo exportar el reporte.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.periodoLabel}>Período: {label}</Text>

      {/* Ganancia / Pérdida */}
      <LinearGradient
        colors={gan >= 0 ? ['#e8f8f0', '#d4edda'] : ['#fde8e8', '#fbd4d4']}
        style={styles.ganBox}
      >
        <Text style={styles.ganEmoji}>{gan >= 0 ? '🤑' : '😟'}</Text>
        <Text style={styles.ganLabel}>{gan >= 0 ? 'GANANCIA' : 'PÉRDIDA'} · {label}</Text>
        <Text style={[styles.ganVal, { color: gan >= 0 ? COLORS.success : COLORS.danger }]}>
          {fmt(Math.abs(gan))}
        </Text>
      </LinearGradient>

      {/* Totales */}
      <View style={styles.grid2}>
        <LinearGradient colors={['#e8f8f0', '#d4edda']} style={styles.sBox}>
          <Text style={styles.sLabel}>VENTAS</Text>
          <Text style={[styles.sVal, { color: COLORS.success }]}>{fmt(totV)}</Text>
          <Text style={styles.sCount}>{ventasFil.length} registros</Text>
        </LinearGradient>
        <LinearGradient colors={['#fde8e8', '#fbd4d4']} style={styles.sBox}>
          <Text style={styles.sLabel}>GASTOS</Text>
          <Text style={[styles.sVal, { color: COLORS.danger }]}>{fmt(totG)}</Text>
          <Text style={styles.sCount}>{gastosFil.length} registros</Text>
        </LinearGradient>
      </View>

      {/* Gráfica 7 días */}
      <View style={styles.card}>
        <Text style={styles.ctitle}>Últimos 7 días</Text>
        <GraficaSemana ventas={ventas} gastos={gastos} />
      </View>

      {/* Gastos por categoría */}
      {catData.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.ctitle}>Gastos por categoría</Text>
          {catData.map(([cat, monto], i) => (
            <View key={cat} style={styles.catBar}>
              <View style={styles.catRow}>
                <Text style={styles.catLbl}>{cat}</Text>
                <Text style={styles.catMonto}>{fmt(monto)}</Text>
              </View>
              <View style={styles.catBg}>
                <View
                  style={[
                    styles.catFill,
                    {
                      width: `${totG ? (monto / totG) * 100 : 0}%`,
                      backgroundColor: CAT_COLORS[i % CAT_COLORS.length],
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Exportar */}
      <View style={styles.card}>
        <Text style={styles.ctitle}>📄 Exportar reporte</Text>
        <Text style={styles.exportInfo}>
          Comparte un archivo .txt con el detalle de <Text style={{ fontWeight: '700' }}>{label}</Text>.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={exportar} disabled={exporting}>
          <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.btnGrad}>
            {exporting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Compartir reporte · {label}</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 13 },
  periodoLabel: { textAlign: 'center', fontSize: 11, color: COLORS.textLight, marginBottom: 8, fontWeight: '700', letterSpacing: 0.3 },
  ganBox: { borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 10 },
  ganEmoji: { fontSize: 28 },
  ganLabel: { fontSize: 11, fontWeight: '700', color: '#666', textTransform: 'uppercase', marginTop: 4 },
  ganVal: { fontSize: 32, fontWeight: '900', marginTop: 4 },
  grid2: { flexDirection: 'row', gap: 9, marginBottom: 10 },
  sBox: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
  sLabel: { fontSize: 10, fontWeight: '700', color: '#666', textTransform: 'uppercase' },
  sVal: { fontSize: 18, fontWeight: '800', marginTop: 3 },
  sCount: { fontSize: 10, color: COLORS.textLight, marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 11, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  ctitle: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
  // Gráfica
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  chartCol: { flex: 1, alignItems: 'center' },
  chartPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, width: '100%' },
  barV: { flex: 1, backgroundColor: COLORS.success + '99', borderRadius: 3 },
  barG: { flex: 1, backgroundColor: COLORS.danger + '88', borderRadius: 3 },
  diaLabel: { fontSize: 9, color: COLORS.textLight, fontWeight: '700', marginTop: 3 },
  legend: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 8 },
  legItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legText: { fontSize: 10, color: '#888', fontWeight: '700' },
  // Categorías
  catBar: { marginBottom: 8 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  catLbl: { fontSize: 12, color: '#555', fontWeight: '600' },
  catMonto: { fontSize: 11, color: COLORS.textLight },
  catBg: { backgroundColor: '#f3f3f3', borderRadius: 8, height: 9, overflow: 'hidden' },
  catFill: { height: '100%', borderRadius: 8 },
  // Exportar
  exportInfo: { fontSize: 12, color: COLORS.textLight, marginBottom: 10 },
  btn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  btnGrad: { padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
