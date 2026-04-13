import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, CATEGORIAS, fmt, today, inRange, generarTextoReporte } from '../utils/helpers';

const CHIP_COLORS = {
  'Compra de fruta': { bg: '#fff3e0', fg: '#f7931e' },
  'Transporte':      { bg: '#e8f4fd', fg: '#3498db' },
  'Empaque':         { bg: '#eafaf1', fg: '#27ae60' },
  'Otros gastos':    { bg: '#f5eef8', fg: '#9b59b6' },
};

export default function GastosScreen({ gastos, setGastos, ventas, desde, hasta, label }) {
  const [form, setForm] = useState({ fecha: today(), descripcion: '', categoria: CATEGORIAS[0], monto: '' });
  const [err, setErr] = useState('');
  const [flash, setFlash] = useState(false);

  const gastosFil = useMemo(() => gastos.filter((g) => inRange(g.fecha, desde, hasta)), [gastos, desde, hasta]);
  const totG = useMemo(() => gastosFil.reduce((s, g) => s + Number(g.monto), 0), [gastosFil]);

  const agregar = () => {
    if (!form.descripcion.trim()) return setErr('Escribe una descripción.');
    if (!form.monto || Number(form.monto) <= 0) return setErr('Monto inválido.');
    setGastos((p) => [...p, { ...form, id: Date.now(), monto: Number(form.monto) }]);
    setForm({ fecha: today(), descripcion: '', categoria: CATEGORIAS[0], monto: '' });
    setErr('');
    setFlash(true);
    setTimeout(() => setFlash(false), 2000);
  };

  const eliminar = (id) => {
    Alert.alert('Eliminar', '¿Eliminar este gasto?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => setGastos((p) => p.filter((g) => g.id !== id)) },
    ]);
  };

  const exportar = async () => {
    try {
      const texto = generarTextoReporte(gastos, ventas, desde, hasta, label);
      const path = FileSystem.documentDirectory + `reporte-fruteria-${desde || 'completo'}.txt`;
      await FileSystem.writeAsStringAsync(path, texto, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: 'text/plain', dialogTitle: 'Compartir reporte' });
    } catch {
      Alert.alert('Error', 'No se pudo exportar el reporte.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Formulario */}
        <View style={styles.card}>
          <Text style={styles.ctitle}>Registrar gasto</Text>

          <Text style={styles.fieldLabel}>Fecha</Text>
          <TextInput
            style={styles.inp}
            value={form.fecha}
            onChangeText={(v) => setForm({ ...form, fecha: v })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.fieldLabel}>Descripción</Text>
          <TextInput
            style={styles.inp}
            value={form.descripcion}
            onChangeText={(v) => setForm({ ...form, descripcion: v })}
            placeholder="Ej: Manzanas, gasolina…"
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.fieldLabel}>Categoría</Text>
          <View style={styles.catGrid}>
            {CATEGORIAS.map((c) => {
              const sel = form.categoria === c;
              const ch = CHIP_COLORS[c] || { bg: '#f0f0f0', fg: '#666' };
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.catChip, { backgroundColor: sel ? ch.fg : ch.bg, borderColor: ch.fg }]}
                  onPress={() => setForm({ ...form, categoria: c })}
                >
                  <Text style={[styles.catChipText, { color: sel ? '#fff' : ch.fg }]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Monto (Q)</Text>
          <TextInput
            style={styles.inp}
            value={form.monto}
            onChangeText={(v) => setForm({ ...form, monto: v })}
            placeholder="0.00"
            placeholderTextColor={COLORS.textLight}
            keyboardType="decimal-pad"
          />

          {err ? <Text style={styles.err}>⚠️ {err}</Text> : null}

          <TouchableOpacity style={styles.btn} onPress={agregar}>
            <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.btnGrad}>
              <Text style={styles.btnText}>+ Agregar gasto</Text>
            </LinearGradient>
          </TouchableOpacity>

          {flash && <Text style={styles.savedMsg}>✓ Guardado</Text>}
        </View>

        {/* Lista */}
        <View style={styles.card}>
          <Text style={styles.ctitle}>
            Gastos · {label} · {fmt(totG)}
          </Text>
          {gastosFil.length === 0 ? (
            <Text style={styles.empty}>Sin gastos en este período</Text>
          ) : (
            [...gastosFil].reverse().map((g) => {
              const ch = CHIP_COLORS[g.categoria] || { bg: '#f0f0f0', fg: '#666' };
              return (
                <View key={g.id} style={styles.li}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.liLabel}>{g.descripcion}</Text>
                    <View style={[styles.chip, { backgroundColor: ch.bg }]}>
                      <Text style={[styles.chipText, { color: ch.fg }]}>{g.categoria}</Text>
                    </View>
                    <Text style={styles.liSub}>{g.fecha}</Text>
                  </View>
                  <View style={styles.liRight}>
                    <Text style={[styles.liMonto, { color: COLORS.danger }]}>{fmt(g.monto)}</Text>
                    <TouchableOpacity onPress={() => eliminar(g.id)} style={styles.delBtn}>
                      <Text style={styles.delText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <TouchableOpacity style={styles.btnOutline} onPress={exportar}>
          <Text style={styles.btnOutlineText}>📄 Exportar reporte · {label}</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 13 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 11, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  ctitle: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#666', marginBottom: 4 },
  inp: { backgroundColor: '#fafafa', borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, padding: 12, fontSize: 14, marginBottom: 10, color: COLORS.text, fontFamily: 'System' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  catChip: { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 6 },
  catChipText: { fontSize: 12, fontWeight: '700' },
  err: { color: COLORS.danger, fontSize: 12, marginBottom: 6, fontWeight: '600' },
  btn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  btnGrad: { padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  savedMsg: { textAlign: 'center', color: COLORS.success, fontWeight: '700', marginTop: 8, fontSize: 13 },
  empty: { textAlign: 'center', color: COLORS.textLight, fontSize: 13, paddingVertical: 18 },
  li: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  liLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  chip: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, marginTop: 3 },
  chipText: { fontSize: 10, fontWeight: '700' },
  liSub: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  liRight: { flexDirection: 'row', alignItems: 'center' },
  liMonto: { fontSize: 14, fontWeight: '800' },
  delBtn: { marginLeft: 8, padding: 4 },
  delText: { fontSize: 16, color: '#ddd' },
  btnOutline: { borderRadius: 14, borderWidth: 2, borderColor: COLORS.secondary, padding: 12, alignItems: 'center', marginBottom: 10 },
  btnOutlineText: { color: COLORS.secondary, fontSize: 13, fontWeight: '800' },
});
