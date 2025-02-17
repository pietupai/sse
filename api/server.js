const express = require('express');
const { DateTime } = require('luxon');
const app = express();
const port = process.env.PORT || 3000;

// Globaali muuttuja viimeisimmälle lähetysajalle
let globalLastSentTime = Date.now();

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    next();
});

const sendServerTime = (res) => {
    const currentTime = Date.now();
    const elapsed = ((currentTime - globalLastSentTime) / 1000).toFixed(2);
    if (elapsed >= 30) {
        const now = DateTime.now().setZone('Europe/Helsinki').toLocaleString(DateTime.TIME_WITH_SECONDS);
        const message = `Server time: ${now} - elapsed: ${elapsed}s`;
        res.write(`data: ${message}\n\n`);
        globalLastSentTime = currentTime; // Päivitetään lähetysaika viestin jälkeen
        console.log('SSE message sent:', message);
    }
};

app.listen(port, () => {
    console.log(`SSE server running on http://localhost:${port}`);
});

app.get('/api/events', (req, res) => {
    try {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        console.log(`SSE connection established: ${DateTime.now().setZone('Europe/Helsinki').toLocaleString(DateTime.TIME_WITH_SECONDS)}`);

        let checkInterval;

        const checkAndSend = () => {
            sendServerTime(res);
        };

        // Lähetetään viestejä 30 sekunnin välein
        checkInterval = setInterval(checkAndSend, 1000);

        req.on('close', () => {
            console.log('SSE connection closed');
            clearInterval(checkInterval);
        });
    } catch (error) {
        console.error('Error in /api/events:', error);
        res.status(500).send('Internal Server Error');
    }
});
