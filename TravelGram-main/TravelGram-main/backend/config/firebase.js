const admin = require('firebase-admin');
require('dotenv').config();

// Firebase özel anahtar JSON formatında olmalıdır
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
});

const db = admin.firestore();
const storage = admin.storage();
const auth = admin.auth();

module.exports = { admin, db, storage, auth };
