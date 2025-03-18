//TC1: Olga, Nick, Mary, and Nestor register and are ready to access the Piazza API.

const axios = require('axios');

const BASE_URL = process.env.BASE_URL;

const users = [
    { username: "Olga", password: "OlgaPass123", email: "olga@example.com" },
    { username: "Nick", password: "NickPass123", email: "nick@example.com" },
    { username: "Mary", password: "MaryPass123", email: "mary@example.com" },
    { username: "Nestor", password: "NestorPass123", email: "nestor@example.com" }
];

async function registerUser(user) {
    try {
        const response = await axios.post(`${BASE_URL}/register`, user);
        if (response.status === 201) {
            console.log(`Registration Test for ${user.username}: PASS`);
        } else {
            console.log(`Registration Test for ${user.username}: FAIL`);
        }
    } catch (error) {
        console.log(`Registration Test for ${user.username}: FAIL`);
        console.error(error.response ? error.response.data : error.message);
    }
}

async function testUserRegistrations() {
    console.log(``);
    console.log(`...................`);
    console.log(`Test Case 1 - TC1:`);
    for (const user of users) {
        await registerUser(user);
    }
}

testUserRegistrations();
