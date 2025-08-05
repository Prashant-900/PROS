import express from 'express';
import { getPriview } from '../container/function.js';

const priviewroute = express.Router();  

priviewroute.post('/getpriview', async (req, res) => {
    try {
        const { sessionid,port } = req.body;  // now reading from JSON body (PUT usually sends JSON)

        if (!sessionid) {
          return res.status(400).send('sessionid is required in request body');
        }
        console.log(sessionid,port);
        const link = await getPriview(sessionid,port);
        res.status(201).json(link);
      } catch (error) {
        console.error('Error getting session:', error);
        res.status(500).send("failed to get session");
      }
})
export default priviewroute
        