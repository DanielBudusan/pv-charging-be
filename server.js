const express = require('express')
const app = express()
const axios = require('axios');
const fs = require('fs');
const https = require('https');
const path = require('path');

app.use(express.json());

app.listen(8080)

app.get('/', (req, res) => {
    res.send("test")
})

//url
app.post('/set_charging_amps/:vehicleTag', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        let token = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7, authHeader.length);
        }
        const { vehicleTag } = req.params
        const { charging_amps } = req.body;

        const proxyRequestBody = { charging_amps };

        const httpsAgent = new https.Agent({
            rejectUnauthorized: false
        });

        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await axios.post(`https://127.0.0.1:4443/api/1/vehicles/${vehicleTag}/command/set_charging_amps`, proxyRequestBody, {
            httpsAgent: httpsAgent,
            headers: headers
        });

        res.send(response.data);
    } catch (error) {
        res.status(500).json({ message: error.response.data })
    }
})

app.get('/vehicle_data/:vehicleTag', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        let token = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7, authHeader.length);
        }
        const { vehicleTag } = req.params

        const httpsAgent = new https.Agent({

        });

        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await axios.get(`https://fleet-api.prd.eu.vn.cloud.tesla.com/api/1/vehicles/${vehicleTag}/vehicle_data`, {
            httpsAgent: httpsAgent,
            headers: headers
        });

        res.send(response.data);
    } catch (error) {
        res.status(500).json({ message: error.response.data })
    }
})