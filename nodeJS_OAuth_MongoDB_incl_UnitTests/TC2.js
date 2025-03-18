//TC2: Olga, Nick, Mary, and Nestor use the oAuth v2 authorisation service to register and get their tokens.

const axios = require('axios');

const BASE_URL = process.env.BASE_URL;

const users = [
    { username: "Olga", password: "OlgaPass123" },
    { username: "Nick", password: "NickPass123" },
    { username: "Mary", password: "MaryPass123" },
    { username: "Nestor", password: "NestorPass123" }
];

async function authenticateUser(user) {
    try {
        const response = await axios.post(`${BASE_URL}/oauth/token`, {
            grant_type: 'password',
            username: user.username,
            password: user.password
        });

        if (response.status === 200) {
            console.log(`Authentication Test for ${user.username}: PASS`);
            return response.data.access_token; // Return the access token
        } else {
            console.log(`Authentication Test for ${user.username}: FAIL`);
        }
    } catch (error) {
        console.log(`Authentication Test for ${user.username}: FAIL`);
        console.error(error.response ? error.response.data : error.message);
    }
}

async function testUserAuthentications() {
    console.log(``);
    console.log(`...................`);
    console.log(`Test Case 2 - TC2:`);
    for (const user of users) {
        const token = await authenticateUser(user);
        if (token) {
            console.log(`${user.username}'s Token: ${token}`);
        }
    }
}

testUserAuthentications();
