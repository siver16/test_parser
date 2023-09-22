const express = require('express');
const router = express.Router();
const axios = require('axios');
const redis = require('redis');
const client = redis.createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});
const CALL_TIMEOUT  = 1000;

router.post('/parsePlaces', async function(req, res) {

    await client.connect();
    let docData = await coreParser(client, req.body.city, req.body.lon, req.body.lat);
    res.send({url: docData.url, approxTime: docData.approxTime});
    await TaskManager(client, "phonelist", docData.id);
    await client.disconnect();
});

router.post('/parseItems', async function(req, res) {
    let docData = await coreItemsParser(req.body.slug);
    res.send({url: docData.url});
});

const coreParser = async function(redisClient, city, lon, lat){
    await redisClient.flushAll();
    const response = await axios.get(`https://consumer-api.wolt.com/v1/pages/restaurants?lat=${lat}&lon=${lon}`);
    await axios.post('http://database:3002/deleteAll', {collection: "places"});
    for (const element of response.data.sections[1].items) {
        let parsedElement = {
            id: element.venue?.id,
            city: city,
            name: element.title,
            type: element.venue.tags,
            address: element.venue?.address,
            phone: "",
            slug: element.venue?.slug
        }
        await axios.post('http://database:3002/add', {collection: "places", data: parsedElement});
        await redisClient.rPush("phonelist", parsedElement.id);

    }
    let len = await redisClient.lLen("phonelist");
    const storageResponse = await axios.post('http://storage:3001/create/places',{title: `parsed data for ${city}`});
    return({...storageResponse.data, approxTime: Math.ceil(len*CALL_TIMEOUT/1000/60)});
}

const coreItemsParser = async function(slug){
    const response = await axios.get(`https://restaurant-api.wolt.com/v4/venues/slug/${slug}/menu/data?unit_prices=true&show_weighted_items=true&show_subcategories=true`);
    await axios.post('http://database:3002/deleteAll', {collection: "items"});
    const storageResponse = await axios.post('http://storage:3001/create/items',{title: `parsed data for ${slug}`});
    let parsedElements = []
    for (const element of response.data.items) {
        let parsedElement = {
            price: element.baseprice,
            name: element.name,
            description: element.description,
            image: element.image,
        }
        parsedElements.push(parsedElement);
        await axios.post('http://database:3002/add', {collection: "items", data: parsedElement});
    }
    await axios.post('http://storage:3001/update/items',{
        sheet: storageResponse.data.id,
        data: parsedElements
    });

    return({...storageResponse.data});
}

const TaskManager = async function(redisClient, list, docId){
    let intervalId;

    await new Promise((resolve) => {
         intervalId = setInterval(() => {
            processTask(resolve);
        }, CALL_TIMEOUT);
    });
    async function processTask(resolve) {
       try {
            const task = await redisClient.lPop(list);
            if (task) {
                const dbElement = await axios.post('http://database:3002/getOne', {
                    collection: "places",
                    query: {id: task}
                });
                const response = await axios.get(`https://consumer-api.wolt.com/order-xp/web/v1/pages/venue/slug/${dbElement.data.slug}/static`);
                await axios.post('http://database:3002/updateOne', {
                    collection: "places",
                    filter: {id: task},
                    update: {phone: response.data?.venue?.phone}
                });
                const dbElementUpdated = {...dbElement.data, phone: response.data?.venue?.phone};
                await axios.post('http://storage:3001/update/places',{
                    sheet: docId,
                    data: dbElementUpdated
                });

            } else {
                clearInterval(intervalId);
                resolve()
            }
        } catch (error) {
            console.error('error while task working:', error);
        }
    }
}
module.exports = router;