const { auth } = require('../config/firebase');

// Firebase Auth ile kimlik doğrulama middleware'i
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Kimlik doğrulama hatası:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = { authenticateUser };
