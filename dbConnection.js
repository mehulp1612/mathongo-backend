const mongoose = require('mongoose');

const URL = process.env.MONGO_URL;

const databaseConnection = async () => {
    try{
        mongoose.connect(URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        console.log('mongoDB connection running!');
    }catch(err){
        console.log('mongoDB connection error!', err)
    }
}

module.exports = databaseConnection;