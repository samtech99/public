//TC6: Mary posts a message in the Tech topic with an expiration time using her token.

const axios = require('axios');

const BASE_URL = process.env.BASE_URL;

const users = [
    { username: "Mary", password: "MaryPass123" }
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

async function postMessageWithExpiration(user, topic, title, body, expirationInMinutes) {
    try {
        const token = await authenticateUser(user);
        if (token) {
            console.log(`${user.username}'s Token: ${token}`);
            const expirationTime = new Date(new Date().getTime() + expirationInMinutes * 60000);
            const identifier = `post_${new Date().getTime()}`; // Unique identifier based on the current timestamp
            const postResponse = await axios.post(`${BASE_URL}/posts`, {
                identifier: identifier,
                topic: topic,
                title: title,
                body: body,
                expirationTime: expirationTime // Corrected field name and value
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (postResponse.status === 200) {
                console.log('Post Message Test: PASS');
                return postResponse.data; // Return the post data
            } else {
                console.log('Post Message Test: FAIL');
            }
        }
    } catch (error) {
        console.log('Post Message Test: FAIL');
        console.error(error.response ? error.response.data : error.message);
    }
}

async function testCase6() {
    console.log(``);
    console.log(`...................`);
    console.log(`Test Case 6 - TC6:`);
    const mary = { username: "Mary", password: "MaryPass123" };
    await postMessageWithExpiration(mary, 'Tech', 'Mary\'s Test Post', 'This is a test post with expiration', 5);
}

testCase6();
