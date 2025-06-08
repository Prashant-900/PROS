import express from 'express';
import http from 'http';
import { setupWebSocket } from './container/connection.js';
import userroute from './routes/user.js';
import containerroute from './routes/container.js';
import sessionroute from './routes/session.js';
import sessioncontrolroute from './routes/sessioncontrol.js';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
const port = 8080;

app.use(express.json()); // to parse JSON body, if needed

app.use('/user', userroute);
app.use('/session', sessionroute);
app.use('/sessioncontrol', sessioncontrolroute);
app.use('/container', containerroute);

const server=http.createServer(app)
setupWebSocket(server);

server.listen(port, () => {
  console.log(`server listening on port ${port}`);
});
