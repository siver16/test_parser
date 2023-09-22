const express = require('express');
const router = express.Router();
const {google} = require('googleapis');
const auth = new google.auth.GoogleAuth({
    keyFile: 'test-parser-399417-7f47965687ca.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/drive'],
});
const sheets = google.sheets({version:'v4', auth});

router.post('/create/places', async (req, res) => {
    try {
        const sheetsClient = sheets.spreadsheets;

        let response = await sheetsClient.create({
            resource: {
                properties: {
                    title: req.body.title,
                },
            },
        })
        const spreadsheetId = response.data.spreadsheetId;
        let values = [
            [
                "ID(slug)","City","Name","Type(s)","Address","Phone"
            ]
        ];
        const resource = {
            values,
        };

        await sheetsClient.values.update({
            spreadsheetId: spreadsheetId,
            range: 'Sheet1',
            valueInputOption: 'RAW',
            resource
        });

        const drive = google.drive({ version: 'v3', auth: auth });
        await drive.permissions.create({
            fileId: spreadsheetId,
            requestBody: {
                type: 'anyone',
                role: 'writer',
            }
        })
        res.send({
            id: response.data.spreadsheetId,
            url: response.data.spreadsheetUrl
        });
    } catch (error) {
        res.status(500).send('error call google sheet api');
    }
});

router.post('/create/items', async (req, res) => {
    try {
        const sheetsClient = sheets.spreadsheets;

        let response = await sheetsClient.create({
            resource: {
                properties: {
                    title: req.body.title,
                },
            },
        })
        const spreadsheetId = response.data.spreadsheetId;
        let values = [
            [
                "Name","Description","Price","Image"
            ]
        ];
        const resource = {
            values,
        };

        await sheetsClient.values.update({
            spreadsheetId: spreadsheetId,
            range: 'Sheet1',
            valueInputOption: 'RAW',
            resource
        });

        const drive = google.drive({ version: 'v3', auth: auth });
        await drive.permissions.create({
            fileId: spreadsheetId,
            requestBody: {
                type: 'anyone',
                role: 'writer',
            }
        })
        res.send({
            id: response.data.spreadsheetId,
            url: response.data.spreadsheetUrl
        });
    } catch (error) {
        res.status(500).send('error call google sheet api');
    }
});

router.post('/update/places', async (req, res) => {
    try {
        const sheetsClient = sheets.spreadsheets;
        let values = [
            [
                req.body.data?.slug,
                req.body.data?.city,
                req.body.data?.name,
                req.body.data?.type.join(', '),
                req.body.data?.address,
                req.body.data?.phone
            ]
        ];
        const resource = {
            values,
        };
        await sheetsClient.values.append({
            spreadsheetId: req.body.sheet,
            range: 'Sheet1',
            valueInputOption: 'RAW',
            resource,
        });
        res.send(`ok`);
    } catch (error) {
        console.error(error);
        res.status(500).send('error call google sheet api');
    }
});

router.post('/update/items', async (req, res) => {
    try {
        const sheetsClient = sheets.spreadsheets;
        let values = [];
        for (let elem of req.body.data){
            values.push([
                elem.name,
                elem.description,
                elem.price,
                elem.image,
            ])
        }
        const resource = {
            values,
        };
        await sheetsClient.values.append({
            spreadsheetId: req.body.sheet,
            range: 'Sheet1',
            valueInputOption: 'RAW',
            resource,
        });
        res.send(`ok`);
    } catch (error) {
        console.error(error);
        res.status(500).send('error call google sheet api');
    }
});

module.exports = router;