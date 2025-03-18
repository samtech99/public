const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('./schema').User; // Assuming this is your User model

// This is a very simplified version and lacks many checks and features of a real OAuth implementation!
module.exports = function(router) {
    router.post('/token', async (req, res) => {
        try {
            const user = await User.findOne({ username: req.body.username });
            if (!user || !await bcrypt.compare(req.body.password, user.password)) {
                return res.status(400).send({ error: 'Invalid credentials' });
            }

            // Simulate issuing an access token. In a real implementation, you'd also have refresh tokens, client validation, etc.
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.send({ access_token: token, token_type: 'Bearer', expires_in: 3600 });
        } catch (error) {
            res.status(500).send(error);
        }
    });
    return router;
};