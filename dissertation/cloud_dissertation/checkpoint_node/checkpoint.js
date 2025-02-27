// Import dependencies
const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to receive requests
app.post('/checkpoint/:namespace/:podName', async (req, res) => {
    const { namespace, podName } = req.params;
    const token = process.env.TOKEN; // Get the token from the environment variable
    const kubeApiHost = 'https://kubernetes.default.svc'; // Kubernetes API host

    try {
        const response = await fetch(`${kubeApiHost}/checkpoint/${namespace}/${podName}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            rejectUnauthorized: false, // For self-signed certificates
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error forwarding the checkpoint request:', error);
        res.status(500).json({ error: 'Failed to checkpoint pod' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Node.js app listening at http://localhost:${port}`);
});

