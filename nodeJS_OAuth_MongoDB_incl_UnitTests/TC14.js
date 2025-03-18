//TC14: Nestor posts a message in the Health topic with an expiration time using her token.

const axios = require('axios');

const BASE_URL = process.env.BASE_URL; 
const { v4: uuidv4 } = require('uuid');


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

async function postMessage(user, topic, title, body, expirationTime) {
    try {
        const token = await authenticateUser(user);
        if (token) {
            const identifier = uuidv4(); // Generate a unique identifier using uuid
            const postResponse = await axios.post(`${BASE_URL}/posts`, {
                identifier, // Use the generated identifier
                title,
                body,
                topic: [topic], // As your schema expects an array
                expirationTime
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (postResponse.status === 200 || postResponse.status === 201) {
                console.log(`Post Message Test for ${user.username}: PASS`);
                return postResponse.data;
            } else {
                console.log(`Post Message Test for ${user.username}: FAIL`);
            }
        }
    } catch (error) {
        console.log(`Post Message Test for ${user.username}: FAIL`);
        console.error(error.response ? error.response.data : error.message);
    }
}

async function testCase14() {
    console.log(``);
    console.log(`...................`);
    console.log(`Test Case 14 - TC14:`);

    const nestor = { username: "Nestor", password: "NestorPass123" };
    const topic = 'Health';
    const title = "Health Tips";
    const body = "Stay hydrated and sleep well.";
    const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Set expiration time to 24 hours from now

    const post = await postMessage(nestor, topic, title, body, expirationTime);

    if (post) {
        console.log(`Nestor successfully posted a message in the ${topic} topic.`);
    } else {
        console.log(`Failed to post message for Nestor in the ${topic} topic.`);
    }
}

testCase14();
