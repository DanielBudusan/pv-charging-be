const express = require('express')
const app = express()
const axios = require('axios');
const fs = require('fs');
const https = require('https');
const path = require('path');

let accessData = {
    accessToken: "x-nseolf5htf448bmlpd3x6qmq9j3u9d493uldhj2p88mrnxqogakb6lqqiohf2r2m1hc4c5fxirtglhrzqnc44504vz0aryaq1ins8ao4862miqo83zs4pciqnt9g467t",
    plantNumber: "NE=152408210"
};

let fetchedData = {}

app.use(express.json());

app.listen(8080)

app.get('/', (req, res) => {
    res.send("test")
})

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

        const response = await axios.post(`https://vehicle-command.railway.internal/api/1/vehicles/${vehicleTag}/command/set_charging_amps`, proxyRequestBody, {
            httpsAgent: httpsAgent,
            headers: headers
        });

        res.send(response.data);
    } catch (error) {
        if (error.response && error.response.data !== undefined) {
            res.status(500).json({ message: error.response.data })
        } else {
            res.status(500).json({ message: error.message })
        }
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

app.post('/set_access', (req, res) => {
    const { accessToken, plantNumber } = req.body;
    if (!accessToken || !plantNumber) {
        return res.status(400).send({ message: 'Both accessToken and plantNumber are required' });
    }
    accessData = { accessToken, plantNumber };  // Update the stored data
    res.send({ message: 'Data received successfully' });

});

async function fetchData(plantNumber, accessToken) {
    const url = `https://uni002eu5.fusionsolar.huawei.com:32800/rest/pvms/web/station/v1/overview/energy-flow?stationDn=${plantNumber}`;
  
    const httpsAgent = new https.Agent({
        rejectUnauthorized: false
    });

    try {
      const response = await axios.get(url, {
        httpsAgent: httpsAgent,
        headers: {
          'Cookie': `locale=en-us; dp-session=${accessToken}; bspsession=${accessToken}; HWWAFSESID=2184119cc8548e5b51c0; path=/`,
          'Content-Type': 'application/json'
        }  
      });
  
      if (response.status === 200) {
        fetchedData = response.data.data.flow.nodes[0].description.value
        console.log(fetchedData, new Date().toLocaleString()); 
      } else {
        console.log(`HTTP request failed with status code: ${response.status}`);
      }
    } catch (error) {
      console.log(`Request failed with error: ${error.message}`);
    }
  }


// Trigger fetch every 5 minutes (300,000 ms)
setInterval(() => {
    fetchData(accessData.plantNumber, accessData.accessToken);
}, 2000);

app.get('/get_power', (req, res) => {
    if (fetchedData) {
        res.json(fetchedData);
    } else {
        res.status(404).send({ message: 'No data found' });
    }
});