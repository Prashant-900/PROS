import express from 'express';
import {requestUser, checkAllowedUser, getAllowedUsers,getRequestUser,addToAllowedUsers,removeFromUserRequests } from '../controller/sessioncontrol.controller.js';

const sessioncontrolroute = express.Router();

sessioncontrolroute.post('/getrequest', async (req, res) => {
  try {
    const { userid,sessionid } = req.body;  // now reading from JSON body (PUT usually sends JSON)

    if (!userid) {
      return res.status(400).send('userid is required in request body');
    }

    if (!sessionid) {
      return res.status(400).send('sessionid is required in request body');
    }

    const message = await getRequestUser(userid,sessionid);
    res.status(201).json({
      users_requests: message.users_requests || [],
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).send("failed to get session");
  }
})

sessioncontrolroute.post('/request', async (req, res) => {
  try {
    const { userid, sessionid } = req.body;

    if (!userid || !sessionid) {
      return res.status(400).send('userid and sessionid are required');
    }

    const message = await requestUser(userid, sessionid);

    if (!message) {
      return res.status(404).send('Session not found');
    }

    res.status(200).json({
      message:"Request added successfully",
    });

  } catch (error) {
    console.error('Error getting request users:', error);
    res.status(500).send("Failed to get request users");
  }
});

sessioncontrolroute.post('/allowed',async(req,res) => {
  try {
    const { userid, sessionid,name,right } = req.body;

    if (!userid || !sessionid) {
      return res.status(400).send('userid and sessionid are required');
    }

    const message = await addToAllowedUsers(userid, sessionid,name,right);

    if (!message) {
      return res.status(404).send('Session not found');
    }

    res.status(200).json({
      message:"User moved to allowed_users",
    });

  } catch (error) {
    console.error('Error getting request users:', error);
    res.status(500).send("Failed to get request users");
  }
  finally{
    res.on('finish', () => {
      console.log('Request completed');
    })
    }
});

sessioncontrolroute.delete('/allowed', async (req, res) => {
  try {
    const { userid,sessionid,name } = req.body;  // now reading from JSON body (PUT usually sends JSON)

    if (!userid) {
      return res.status(400).send('userid is required in request body');
    }

    const user = await removeFromUserRequests(userid,sessionid,name);
    res.status(201).json({
      message: "User removed successfully"
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).send("failed to get session");
  }
})

sessioncontrolroute.post('/checkallowed',async(req,res) => {
  try {
    const {sessionid,name } = req.body;

    if (!name || !sessionid) {
      return res.status(400).send('name and sessionid are required');
    }

    const message = await checkAllowedUser(sessionid,name);

    if (!message) {
      return res.status(404).send('Session not found');
    }

    res.status(200).json({
      allowed: message.allowed,
      owner_userid: message.owner_userid
    });

  } catch (error) {
    console.error('Error getting request users:', error);
    res.status(500).send("Failed to get request users");
  }
})

sessioncontrolroute.post('/getallowed',async(req,res) => {
  try {
    const { userid, sessionid } = req.body;

    if (!userid || !sessionid) {
      return res.status(400).send('userid and sessionid are required');
    }

    const message = await getAllowedUsers(userid, sessionid);

    if (!message) {
      return res.status(404).send('Session not found');
    }

    res.status(200).json({
      allowed_users: message.allowed_users,
    });

  } catch (error) {
    console.error('Error getting request users:', error);
    res.status(500).send("Failed to get request users");
  }
})

export default sessioncontrolroute
