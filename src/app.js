const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/database');

const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const mercanciaRoutes = require('./routes/mercancia.routes');
const palletRoutes = require('./routes/pallet.routes');
const gastoRoutes = require('./routes/gasto.routes');
const metricsRoutes = require('./routes/metrics.routes');
const aportacionRoutes = require('./routes/aportacion.routes');
const conteoCajaRoutes = require('./routes/conteoCaja.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/mercancias', mercanciaRoutes);
app.use('/api/pallets', palletRoutes);
app.use('/api/gastos', gastoRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/aportaciones', aportacionRoutes);
app.use('/api/conteos-caja', conteoCajaRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos exitosa');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    process.exit(1);
  }
})();
