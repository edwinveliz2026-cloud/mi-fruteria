# 🍊 Mi Frutería — App Android (React Native + Expo)

App nativa Android convertida desde la versión web React.
Funciona offline, guarda datos en el dispositivo.

---

## 📋 Requisitos

- Node.js 18+
- npm o yarn
- Cuenta gratuita en https://expo.dev (para compilar el APK)

---

## 🚀 Instalación y desarrollo

```bash
# 1. Instalar dependencias
npm install

# 2. Correr en modo desarrollo (escanear QR con Expo Go)
npx expo start
```

Descarga **Expo Go** en tu celular Android y escanea el QR para ver la app en tiempo real.

---

## 📦 Compilar APK (para instalar en cualquier Android)

```bash
# 1. Instalar EAS CLI
npm install -g eas-cli

# 2. Iniciar sesión en Expo
eas login

# 3. Configurar el proyecto (solo la primera vez)
eas build:configure

# 4. Compilar APK (gratis, tarda ~10-15 min en los servidores de Expo)
eas build --platform android --profile preview
```

Al terminar obtienes un enlace para descargar el `.apk` directamente.

---

## 📁 Estructura del proyecto

```
MiFruteria/
├── App.js                        # Raíz: navegación, filtros, header
├── src/
│   ├── screens/
│   │   ├── ResumenScreen.js      # Gráfica, ganancia/pérdida, categorías
│   │   ├── GastosScreen.js       # Registro y lista de gastos
│   │   └── VentasScreen.js       # Registro y lista de ventas
│   └── utils/
│       ├── helpers.js            # Constantes, fmt(), fechas, reporte TXT
│       └── storage.js            # Hook usePersistedState (AsyncStorage)
├── app.json                      # Config Expo (nombre, colores, package)
├── eas.json                      # Config de compilación EAS
└── package.json
```

---

## ✅ Funcionalidades incluidas

- [x] Resumen con ganancia/pérdida por período
- [x] Gráfica de barras últimos 7 días
- [x] Gastos por categoría con barras de progreso
- [x] Filtros: Hoy / Esta semana / Semana pasada / Todo / Rango personalizado
- [x] Registro de gastos con categorías coloreadas
- [x] Registro de ventas con selector de frutas y unidades
- [x] Vista previa del total al ingresar venta
- [x] Eliminar registros con confirmación
- [x] Exportar reporte .txt (compartir por WhatsApp, Gmail, etc.)
- [x] Datos persistidos localmente (AsyncStorage)
- [x] Moneda en Quetzales (Q) con formato guatemalteco
- [x] Diseño idéntico al original: naranja/verde, gradientes, cards
