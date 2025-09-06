require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const messengerRoutes = require('./routes/messengerRoutes');
const adsCountRoutes = require('./routes/adsCountRoutes');
const tagRoutes       = require('./routes/tagRoutes');
const scheduler       = require('./services/scheduler');

const app = express();
app.use(bodyParser.json());

app.use('/messages', messengerRoutes);
app.use('/ads_count', adsCountRoutes);
app.use('/tag', tagRoutes);

// Start scheduler
scheduler.start();

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
app.get('/', (req, res) => {
  res.send('OK – Sales API is up!');
});
