const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('../config/mongodb');

// MongoDB Atlas'a bağlan
connectDB().catch(err => console.error('MongoDB bağlantı hatası:', err));

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const userRoutes = require('../routes/user.routes');
const postRoutes = require('../routes/post.routes');
const imageRoutes = require('../routes/image.routes');

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/images', imageRoutes);
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
