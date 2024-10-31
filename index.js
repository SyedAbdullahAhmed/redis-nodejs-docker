const express = require('express');
const redis = require('redis');
const axios = require('axios');

const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Create Redis client
const client = redis.createClient({
    host: 'localhost',
    port: 6379
});

// Connect to Redis once when the application starts
client.connect()
    .then(() => console.log('Connected to Redis'))
    .catch(err => console.error('Redis connection error:', err));

// Endpoint to save data in Redis with a 1-minute expiration
app.post('/save', async (req, res) => {
    try {
        // Fetch data from an external API
        const { data } = await axios.get("https://fakestoreapi.com/products");
        console.log(data[0])

        // Convert data to a JSON string and save it in Redis with a 2-minute expiration (120 seconds)
        await client.setEx("Products", 120, JSON.stringify(data));
        res.send('Data saved with expiration time of 2 minutes');
    } catch (err) {
        console.error('Error saving data in Redis:', err);
        res.status(500).send('Error saving data in Redis');
    }
});

// Endpoint to retrieve data from Redis
app.get('/get/:key', async (req, res) => {
    const { key } = req.params;

    try {
        // Retrieve the data from Redis
        const result = await client.get(key);

        if (result) {
            // Parse the JSON string back to an object
            res.json(JSON.parse(result));
        } else {
            res.send('Key not found or has expired');
        }
    } catch (err) {
        console.error('Error retrieving data from Redis:', err);
        res.status(500).send('Error retrieving data from Redis');
    }
});
app.get('/', async (req, res) => {

    try {
        const { data } = await axios.get("https://fakestoreapi.com/products");

        if (data) {
            // Parse the JSON string back to an object
            res.json(data);
        } else {
            res.send('Key not found or has expired');
        }
    } catch (err) {
        console.error('Error retrieving data from Redis:', err);
        res.status(500).send('Error retrieving data from Redis');
    }
});

// Gracefully handle process termination and disconnect Redis
process.on('SIGINT', async () => {
    console.log('Disconnecting from Redis...');
    await client.disconnect();
    console.log('Redis disconnected');
    process.exit(0);
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
