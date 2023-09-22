const express = require('express');
const port = process.env.PORT;
const host = process.env.HOST;
const app = express();

let router = require('./routes');
app.use(express.json());
app.use('/', router);

app.listen(port,host, () => {
    console.log(`gateway is running ${host}:${port}`);
});

