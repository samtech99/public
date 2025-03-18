//TC20 Nestor queries for an active post with the highest interest (maximum number of likes and dislikes) in the Tech topic. This should be Mary’s post.


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

async function getMostActivePost(user, topic) {
    try {
        const token = await authenticateUser(user);
        if (token) {
            const response = await axios.get(`${BASE_URL}/posts/${topic}/most-active`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 200 && response.data) {
                console.log(`Retrieved most active post from the ${topic} topic: PASS`);
                return response.data;
            } else {
                console.log(`Failed to retrieve the most active post from the ${topic} topic: FAIL`);
            }
        }
    } catch (error) {
        console.log(`Failed to retrieve the most active post from the ${topic} topic: FAIL`);
        console.error(error.response ? error.response.data : error.message);
    }
}

async function testCase20() {
    console.log(``);
    console.log(`...................`);
    console.log(`Test Case 20 - TC20:`);

    const nestor = { username: "Nestor", password: "NestorPass123" };
    const topic = 'Tech';

    const mostActivePost = await getMostActivePost(nestor, topic);

    if (mostActivePost && mostActivePost.owner.username === 'Mary') {
        console.log(`The most active post in the ${topic} topic is Mary's post as expected: PASS`);
    } else {
        console.log(`The most active post in the ${topic} topic is not Mary's post: FAIL`);
    }
}

testCase20();
