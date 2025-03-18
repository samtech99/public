//TC19: Nick browses all the expired messages on the Sports topic. These should be empty.

const axios = require('axios');
const BASE_URL = process.env.BASE_URL; // Ensure this is set to your API's base URL

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

async function getExpiredSportsTopicPosts(user) {
    try {
        const token = await authenticateUser(user);
        if (token) {
            const response = await axios.get(`${BASE_URL}/posts/Sports/expired`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 200) {
                console.log(`Retrieved expired posts from the Sports topic: PASS`);
                return response.data;
            } else {
                console.log(`Failed to retrieve expired posts from the Sports topic: FAIL`);
            }
        }
    } catch (error) {
        console.log(`Failed to retrieve expired posts from the Sports topic: FAIL`);
        console.error(error.response ? error.response.data : error.message);
    }
}

async function testCase19() {
    console.log(``);
    console.log(`...................`);
    console.log(`Test Case 19 - TC19:`);

    const nick = { username: "Nick", password: "NickPass123" };

    const expiredPosts = await getExpiredSportsTopicPosts(nick);

    if (Array.isArray(expiredPosts) && expiredPosts.length === 0) {
        console.log(`No expired posts in the Sports topic as expected: PASS`);
    } else {
        console.log(`Expired posts were found in the Sports topic or the array was not empty: FAIL`);
    }
}

testCase19();


