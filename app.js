require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const salesRoutes = require('./routes/salesRoutes');
const scheduler = require('./services/scheduler');

const app = express();
app.use(bodyParser.json());

// Unified sales route - thay thế 3 routes cũ
app.use('/sales', salesRoutes);

// Start scheduler
scheduler.start();

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
app.get('/', (req, res) => {
  res.send('OK – Sales API is up!');
});
