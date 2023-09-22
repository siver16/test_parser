const express = require('express');
const router = express.Router();
const MongoClient = require("mongodb").MongoClient;

const url = "mongodb://admin:admin@mongo:27017/";
const mongoClient = new MongoClient(url,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

const mongoConnect = async function(collectionName){
    await mongoClient.connect();
    const db = mongoClient.db("pars");
    const collection = db.collection(collectionName);
    return collection
}

router.post('/add', async function(req, res) {
    try {
        const collection = await mongoConnect(req.body.collection);
        await collection.insertOne(req.body.data);
        res.send("ok");
    }catch(err) {
        console.log(err);
    } finally {
        await mongoClient.close();
    }
});

router.post('/deleteAll', async function(req, res) {
    try {
        const collection = await mongoConnect(req.body.collection);
        await collection.drop({});
        res.send("ok");
    }catch(err) {
        console.log(err);
    } finally {
        await mongoClient.close();
    }
});

router.post('/getOne', async function(req, res) {
    try {
        const collection = await mongoConnect(req.body.collection);
        const result = await collection.findOne(req.body.query);
        res.send(result);
    }catch(err) {
        console.log(err);
    } finally {
        await mongoClient.close();
    }
});

router.post('/updateOne', async function(req, res) {
    try {
        const collection = await mongoConnect(req.body.collection);
        const update = {
            $set: req.body.update
        };
        const result = await collection.updateOne(req.body.filter, update);
        res.send(result);
    }catch(err) {
        console.log(err);
    } finally {
        await mongoClient.close();
    }
});

module.exports = router;