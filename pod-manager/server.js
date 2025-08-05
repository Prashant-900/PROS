import express from 'express';
import router from './route.js';

const app = express();
const port = 8080;

app.use(express.json()); // to parse JSON body, if needed
app.use('/', router);

app.listen(port,'0.0.0.0' , () => {
    console.log(`server listening on port ${port}`);
});