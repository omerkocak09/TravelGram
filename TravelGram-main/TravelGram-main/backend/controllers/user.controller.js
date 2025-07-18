const { db, admin } = require('../config/firebase');

const UserController = {
  createUser: async (req, res) => {
    try {
      const { uid, email, username, interests = [] } = req.body;
      const userRef = db.collection('users').doc(uid);
      
      await userRef.set({
        email,
        username,
        interests,
        followers: [],
        following: [],
        createdAt: new Date().toISOString(),
        profilePhoto: null
      });

      res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Error creating user' });
    }
  },

  getUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ id: userDoc.id, ...userDoc.data() });
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({ error: 'Error getting user' });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      await db.collection('users').doc(userId).update(updates);
      res.json({ message: 'User updated successfully' });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Error updating user' });
    }
  },

  followUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const followerId = req.user.uid;

      const batch = db.batch();
      const userRef = db.collection('users').doc(userId);
      const followerRef = db.collection('users').doc(followerId);

      batch.update(userRef, {
        followers: admin.firestore.FieldValue.arrayUnion(followerId)
      });

      batch.update(followerRef, {
        following: admin.firestore.FieldValue.arrayUnion(userId)
      });

      await batch.commit();
      res.json({ message: 'Successfully followed user' });
    } catch (error) {
      console.error('Error following user:', error);
      res.status(500).json({ error: 'Error following user' });
    }
  }
};

module.exports = UserController;
