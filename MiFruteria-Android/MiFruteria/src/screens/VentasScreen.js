import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FRUTAS_SUGERIDAS, UNIDADES, fmt, today, inRange, generarTextoReporte } from '../utils/helpers';

export default function VentasScreen({ ventas, setVentas, gastos, desde, hasta, label }) {
  const [form, setForm] = useState({ fecha: today(), fruta: '', cantidad: '', unidad: 'kg', precio: '' });
  const [err, setErr] = useState('');
  const [flash, setFlash] = useState(false);

  const ventasFil = useMemo(() => ventas.filter((v) => inRange(v.fecha, desde, hasta)), [ventas, desde, hasta]);
  const totV = useMemo(() => ventasFil.reduce((s, v) => s + Number(v.total), 0), [ventasFil]);
  const totalPreview = form.cantidad && form.precio ? Number(form.cantidad) * Number(form.precio) : null;

  const agregar = () => {
    if (!form.fruta.trim()) return setErr('Selecciona o escribe la fruta.');
    if (!form.cantidad || Number(form.cantidad) <= 0) return setErr('Cantidad inválida.');
    if (!form.precio || Number(form.precio) <= 0) return setErr('Precio inválido.');
    const total = Number(form.cantidad) * Number(form.precio);
    setVentas((p) => [...p, { ...form, id: Date.now(), total }]);
    setForm({ fecha: today(), fruta: '', cantidad: '', unidad: 'kg', precio: '' });
    setErr('');
    setFlash(true);
    setTimeout(() => setFlash(false), 2000);
  };

  const eliminar = (id) => {
    Alert.alert('Eliminar', '¿Eliminar esta venta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => setVentas((p) => p.filter((v) => v.id !== id)) },
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
          <Text style={styles.ctitle}>Registrar venta</Text>

          <Text style={styles.fieldLabel}>Fecha</Text>
          <TextInput
            style={styles.inp}
            value={form.fecha}
            onChangeText={(v) => setForm({ ...form, fecha: v })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.fieldLabel}>Fruta</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fruScroll}>
            <View style={styles.fruGrid}>
              {FRUTAS_SUGERIDAS.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.fruBtn, form.fruta === f && styles.fruBtnSel]}
                  onPress={() => setForm({ ...form, fruta: f })}
                >
                  <Text style={[styles.fruText, form.fruta === f && styles.fruTextSel]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TextInput
            style={styles.inp}
            value={form.fruta}
            onChangeText={(v) => setForm({ ...form, fruta: v })}
            placeholder="O escribe la fruta…"
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.fieldLabel}>Cantidad y unidad</Text>
          <View style={styles.row2}>
            <TextInput
              style={[styles.inp, { flex: 1 }]}
              value={form.cantidad}
              onChangeText={(v) => setForm({ ...form, cantidad: v })}
              placeholder="Cantidad"
              placeholderTextColor={COLORS.textLight}
              keyboardType="decimal-pad"
            />
            <View style={styles.unidadPicker}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {UNIDADES.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unidadBtn, form.unidad === u && styles.unidadBtnSel]}
                    onPress={() => setForm({ ...form, unidad: u })}
                  >
                    <Text style={[styles.unidadText, form.unidad === u && styles.unidadTextSel]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Precio por unidad (Q)</Text>
          <TextInput
            style={styles.inp}
            value={form.precio}
            onChangeText={(v) => setForm({ ...form, precio: v })}
            placeholder="0.00"
            placeholderTextColor={COLORS.textLight}
            keyboardType="decimal-pad"
          />

          {totalPreview !== null && (
            <View style={styles.totalPreview}>
              <Text style={styles.totalPreviewText}>Total: {fmt(totalPreview)}</Text>
            </View>
          )}

          {err ? <Text style={styles.err}>⚠️ {err}</Text> : null}

          <TouchableOpacity style={styles.btn} onPress={agregar}>
            <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.btnGrad}>
              <Text style={styles.btnText}>+ Agregar venta</Text>
            </LinearGradient>
          </TouchableOpacity>

          {flash && <Text style={styles.savedMsg}>✓ Guardado</Text>}
        </View>

        {/* Lista */}
        <View style={styles.card}>
          <Text style={styles.ctitle}>
            Ventas · {label} · {fmt(totV)}
          </Text>
          {ventasFil.length === 0 ? (
            <Text style={styles.empty}>Sin ventas en este período</Text>
          ) : (
            [...ventasFil].reverse().map((v) => (
              <View key={v.id} style={styles.li}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.liLabel}>{v.fruta}</Text>
                  <Text style={styles.liSub}>
                    {v.cantidad} {v.unidad} × {fmt(v.precio)} · {v.fecha}
                  </Text>
                </View>
                <View style={styles.liRight}>
                  <Text style={[styles.liMonto, { color: COLORS.success }]}>{fmt(v.total)}</Text>
                  <TouchableOpacity onPress={() => eliminar(v.id)} style={styles.delBtn}>
                    <Text style={styles.delText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
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
  inp: { backgroundColor: '#fafafa', borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, padding: 12, fontSize: 14, marginBottom: 10, color: COLORS.text },
  row2: { flexDirection: 'row', gap: 8, marginBottom: 0, alignItems: 'flex-start' },
  fruScroll: { marginBottom: 8 },
  fruGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingBottom: 4 },
  fruBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.secondary, backgroundColor: '#fff8f0' },
  fruBtnSel: { backgroundColor: COLORS.secondary },
  fruText: { fontSize: 12, fontWeight: '700', color: COLORS.secondary },
  fruTextSel: { color: '#fff' },
  unidadPicker: { marginBottom: 10 },
  unidadBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: '#fafafa', marginRight: 6 },
  unidadBtnSel: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  unidadText: { fontSize: 13, fontWeight: '700', color: '#888' },
  unidadTextSel: { color: '#fff' },
  totalPreview: { backgroundColor: '#e8f8f0', borderRadius: 12, padding: 10, alignItems: 'center', marginBottom: 8 },
  totalPreviewText: { color: COLORS.success, fontWeight: '800', fontSize: 16 },
  err: { color: COLORS.danger, fontSize: 12, marginBottom: 6, fontWeight: '600' },
  btn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  btnGrad: { padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  savedMsg: { textAlign: 'center', color: COLORS.success, fontWeight: '700', marginTop: 8, fontSize: 13 },
  empty: { textAlign: 'center', color: COLORS.textLight, fontSize: 13, paddingVertical: 18 },
  li: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  liLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  liSub: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  liRight: { flexDirection: 'row', alignItems: 'center' },
  liMonto: { fontSize: 14, fontWeight: '800' },
  delBtn: { marginLeft: 8, padding: 4 },
  delText: { fontSize: 16, color: '#ddd' },
  btnOutline: { borderRadius: 14, borderWidth: 2, borderColor: COLORS.secondary, padding: 12, alignItems: 'center', marginBottom: 10 },
  btnOutlineText: { color: COLORS.secondary, fontSize: 13, fontWeight: '800' },
});
