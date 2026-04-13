// ─── Colores y tema ────────────────────────────────────────────
export const COLORS = {
  primary: '#ff6b35',
  secondary: '#f7931e',
  success: '#27ae60',
  danger: '#e74c3c',
  bg: '#fff8f0',
  bgCard: '#ffffff',
  text: '#333333',
  textMuted: '#999999',
  textLight: '#bbbbbb',
  border: '#eeeeee',
  successBg: '#e8f8f0',
  dangerBg: '#fde8e8',
};

export const CAT_COLORS = ['#ff6b35', '#f7931e', '#27ae60', '#3498db', '#9b59b6'];

// ─── Catálogos ─────────────────────────────────────────────────
export const CATEGORIAS = [
  'Compra de fruta',
  'Transporte',
  'Empaque',
  'Otros gastos',
];

export const FRUTAS_SUGERIDAS = [
  '🍎 Manzana', '🍌 Plátano', '🍊 Naranja', '🍇 Uva',
  '🍓 Fresa',   '🍍 Piña',    '🥭 Mango',   '🍑 Durazno',
  '🍋 Limón',   '🍉 Sandía',  '🥝 Kiwi',    '🍐 Pera',
];

export const UNIDADES = ['kg', 'g', 'pieza', 'caja', 'bolsa', 'docena'];

// ─── Formateador de moneda Q ────────────────────────────────────
export const fmt = (n) => {
  const num = Number(n || 0);
  return `Q${num.toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// ─── Fecha de hoy YYYY-MM-DD ────────────────────────────────────
export const today = () => new Date().toISOString().split('T')[0];

// ─── Rango de semana lunes-domingo ─────────────────────────────
export const getWeekRange = (offset = 0) => {
  const d = new Date();
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((day + 6) % 7) + offset * 7);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    start: mon.toISOString().split('T')[0],
    end: sun.toISOString().split('T')[0],
  };
};

// ─── Verificar si fecha está en rango ──────────────────────────
export const inRange = (fecha, desde, hasta) => {
  if (desde && fecha < desde) return false;
  if (hasta && fecha > hasta) return false;
  return true;
};

// ─── Generar texto de reporte ──────────────────────────────────
export const generarTextoReporte = (gastos, ventas, desde, hasta, label) => {
  const gF = gastos.filter((g) => inRange(g.fecha, desde, hasta));
  const vF = ventas.filter((v) => inRange(v.fecha, desde, hasta));
  const tG = gF.reduce((s, g) => s + Number(g.monto), 0);
  const tV = vF.reduce((s, v) => s + Number(v.total), 0);
  const gan = tV - tG;
  const SEP = '─'.repeat(40);

  const lineas = [
    '🍊 REPORTE MI FRUTERÍA',
    SEP,
    `Período : ${label}`,
    `Generado: ${new Date().toLocaleString('es-GT')}`,
    '',
    `💰 VENTAS (${vF.length} registros)`,
    SEP,
    ...vF.map(
      (v) =>
        `${v.fecha}  ${v.fruta}  ${v.cantidad}${v.unidad} x ${fmt(v.precio)} = ${fmt(v.total)}`
    ),
    `TOTAL VENTAS: ${fmt(tV)}`,
    '',
    `💸 GASTOS (${gF.length} registros)`,
    SEP,
    ...gF.map(
      (g) => `${g.fecha}  ${g.descripcion}  [${g.categoria}]  ${fmt(g.monto)}`
    ),
    `TOTAL GASTOS: ${fmt(tG)}`,
    '',
    SEP,
    `${gan >= 0 ? '✅ GANANCIA' : '❌ PÉRDIDA'}: ${fmt(Math.abs(gan))}`,
    SEP,
  ];

  return lineas.join('\n');
};
