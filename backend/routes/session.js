import express from 'express';
import { addsession,getsession,deletesession } from '../controller/session.controller.js';
import { createFolder, deleteFolder, saveFile } from '../controller/database.controller.js';

const sessionroute = express.Router();

// Add or update user route using PUT
sessionroute.post('/add', async (req, res) => {
  try {
    const { userid,name } = req.body;  // now reading from JSON body (PUT usually sends JSON)

    if (!userid) {
      return res.status(400).send('userid is required in request body');
    }

    const user = await addsession(userid,name);
    const folder=await createFolder(userid,user.session._id);
    res.status(201).json({
      user
    });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).send("failed to add session");
  }
});

sessionroute.delete('/delete', async (req, res) => {
  try {
    const { userid,sessionid } = req.body;  // now reading from JSON body (PUT usually sends JSON)

    if (!sessionid) {
      return res.status(400).send('sessionid is required in request body');
    }

    const user = await deletesession(sessionid);
    const folder=await deleteFolder(userid,sessionid);
    res.status(201).json({
      user,
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).send("failed to delete session");
  }
})

sessionroute.post('/user', async (req, res) => {
  try {
    const { userid } = req.body;  // now reading from JSON body (PUT usually sends JSON)

    if (!userid) {
      return res.status(400).send('userid is required in request body');
    }

    const user = await getsession(userid);
    res.status(201).json({
      user
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).send("failed to get session");
  }
})

sessionroute.post('/save', async (req, res) => {
  try {
    const { userid,sessionid } = req.body;  // now reading from JSON body (PUT usually sends JSON)

    if (!userid) {
      return res.status(400).send('userid is required in request body');
    }
    if (!sessionid) {
      return res.status(400).send('sessionid is required in request body');
    }
    const user = await saveFile(userid,sessionid);
    res.status(201).json({
      user
    });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).send("failed to save file");
  }
})




export default sessionroute;
