const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('./schema').User;
const bcrypt = require('bcrypt');

const router = express.Router();


router.post('/login', async (req, res) => {
    res.send('Login route is working');
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user || !await bcrypt.compare(req.body.password, user.password)) {
            return res.status(400).send({ error: 'Invalid login credentials' });
        }
        
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.send({ user, token });
    } catch (error) {
        res.status(500).send(error);
    }
});


const loginMiddleware = function(req, res, next) {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).send({ error: 'Unauthorized' });
    }
};


module.exports = {
    router,
    loginMiddleware
};
