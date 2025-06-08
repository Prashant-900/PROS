import express from 'express';
import { createUserPod } from '../container/container.controller.js';

const containerroute = express.Router();

containerroute.post('/create', async (req, res) => {
  try {
    const { sessionid } = req.body;  // now reading from JSON body (PUT usually sends JSON)
    if (!sessionid) {
      return res.status(400).send('sessionid is required in request body');
    }

    const response = await createUserPod(sessionid);
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).send("failed to create session");
  }
})

containerroute.post('/delete', async (req, res) => {
  const { sessionid } = req.body

  if (!sessionid) {
    return res.status(400).send('❌ sessionid is required in query params');
  }

  try {
    const response = await fetch(`http://service-${sessionid}:8080/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.text(); // or .json() if JSON is returned
    res.status(response.status).send(data);
  } catch (error) {
    console.error('❌ Error contacting pod:', error);
    res.status(500).send('Failed to delete session');
  }
});



export default containerroute;
