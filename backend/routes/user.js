import express from 'express';
import { insertUser } from '../controller/userinfo.controller.js';

const userroute = express.Router();

// Add or update user route using PUT
userroute.post('/add', async (req, res) => {
  try {
    const { userid } = req.body;  // now reading from JSON body (PUT usually sends JSON)

    if (!userid) {
      return res.status(400).send('userid is required in request body');
    }

    const user = await insertUser(userid);

    res.status(201).json({
      message: 'User added successfully',
      user,
    });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).send("failed to add user");
  }
});

export default userroute;
