const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('config');

const cities = config.get('cities');


router.get('/parse/city', async (req, res) => {
    try {
        if(req.query.city && cities.hasOwnProperty(req.query.city)){
            let docLink = await axios.post('http://parser:3003/parsePlaces', {city: req.query.city, lon: cities[req.query.city].lon, lat:cities[req.query.city].lat});
            res.send(`<a href="${docLink.data.url}">${docLink.data.url}</a> <p>Here is a link for document where you can see online  how it  filled of data. As parsing cannot be fast to avoid baning us by parsed site we are using timeout between the calls. Aproximately total time for this operation is ${docLink.data.approxTime} minute(s).</p>`);
        }else{
            res.status(400).send(`wrong city parameter, use one of allowed cities as city parameter: ${Object.keys(cities).toString()}`);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('error call parser');
    }
});

router.get('/parse/place', async (req, res) => {
    try {
        if(req.query.slug ){
            let docLink = await axios.post('http://parser:3003/parseItems', {slug: req.query.slug});
            res.send(`<a href="${docLink.data.url}">${docLink.data.url}</a> <p>Here is a link for document with parsed data.</p>`);
        }else{
            res.status(400).send(`wrong slug parameter, You can get correct slug after parsing some city by '/parse/city?city=' request`);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('error call parser');
    }
});

module.exports = router;