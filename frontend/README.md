# Frontend — Mercancía

UI en React (Vite) para gestionar mercancía, ventas, gastos y métricas.

## Requisitos
- Node 18+
- El backend corriendo en `http://localhost:3000` (o ajusta `VITE_API_URL`)

## Instalación

```bash
cd frontend
npm install
cp .env.example .env   # ajusta VITE_API_URL si tu backend corre en otro puerto
npm run dev
```

Abre http://localhost:5173

## Flujo de uso

1. **Registro / login** — `/registro` crea una cuenta, `/login` inicia sesión. El token JWT se guarda en `localStorage` y se manda automáticamente en cada request.
2. **Mercancía** (`/mercancia`) — lista con búsqueda y filtro por estado. "+ Nuevo artículo" abre un formulario con Producto, Precio mercado, Precio sugerido y No. de pallet — si el pallet no existe, el backend lo crea solo. Cada artículo disponible tiene un botón "Vender" que pide precio de venta y fecha.
3. **Gastos** (`/gastos`) — registra gastos por categoría (asistencia en el mercado, gasolina, compra de pallets, otro) con monto y fecha, y muestra el total del período filtrado.
4. **Métricas** (`/metricas`) — filtro de fechas (desde/hasta) que alimenta el resumen de ventas vs. gastos y la tabla de ventas por día. Abajo, la tabla de pallets con su cantidad total/disponible/vendida, y "Ver productos" abre el detalle de ese pallet con sus propios filtros por estado.

## Nota sobre "Precio de venta" en el alta de mercancía

En tu lista original mencionabas "Precio Venta" como parte del formulario de alta. Lo dejé fuera de ese formulario a propósito: como pediste que todo artículo nuevo quede automáticamente "disponible", y un artículo disponible por definición no tiene precio de venta todavía, ese campo solo aparece en el flujo de "Vender". Si en realidad querías capturar un precio de venta *sugerido/objetivo* desde el alta (distinto de precioSugerido), dímelo y lo agrego como un campo aparte.
