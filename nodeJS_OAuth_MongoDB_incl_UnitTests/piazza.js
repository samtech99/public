const express = require('express');
const bodyParser = require('body-parser');
const { User, Post } = require('./schema.js');
const mongodb = require('./mongodb.js');
const routes = require('./routes.js');

const app = express();

// Middleware to parse JSON payloads
app.use(bodyParser.json());

// Set up your login routes
const { router: loginRouter } = require('./login.js'); // Destructure to get the router
app.use('/api', loginRouter); // Use the login router

// Set up OAuth routes
const oauthRouter = express.Router(); // Create a new router for OAuth
const setupOAuthRoutes = require('./oauth.js');
setupOAuthRoutes(oauthRouter); // Pass the router to the setup function
app.use('/api/oauth', oauthRouter); // Mount the OAuth router at '/api/oauth'

// Set up other routes
app.use('/api', routes);

// Generic Error Handler (optional but recommended)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});