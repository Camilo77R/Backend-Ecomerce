require('dotenv').config();  
const express = require('express');  
const cors = require('cors');  
  
// Importar rutas (Dependency Injection)  
const authRoutes = require('./routes/auth');  
const productRoutes = require('./routes/products');  
  
const app = express();  
  
// Middleware global  
app.use(cors());  
app.use(express.json());  
  
// Registro de rutas (Route Composition)  
app.use('/api/auth', authRoutes);  
app.use('/api/products', productRoutes);  
  
// Manejo de errores global  
app.use((err, req, res, next) => {  
  console.error(err.stack);  
  res.status(500).json({ error: 'Something went wrong!' });  
});  
  
const PORT = process.env.PORT || 3000;  
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));