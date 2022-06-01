const express=require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const databaseConnection = require('./dbConnection');

const PORT=5000;
const router = require('./routes');

const app=express();

app.use(bodyParser.json({extended: true}));
app.use(bodyParser.urlencoded({extended: true}));

databaseConnection();


app.use('/',router);

app.listen(PORT,()=>{
    console.log(`App is running on PORT ${PORT}`);
});

