//TC15: Mary browses all the available posts on the Health topic; at this stage, she can see only Nestor’s post.

const axios = require('axios');

const BASE_URL = process.env.BASE_URL;

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

async function getAllPostsFromTopic(user, topic) {
    try {
        const token = await authenticateUser(user);
        if (token) {
            const response = await axios.get(`${BASE_URL}/posts/${topic}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 200 && Array.isArray(response.data)) {
                console.log(`Retrieved all posts from the ${topic} topic: PASS`);
                return response.data; // This will be an array of posts
            } else {
                console.log(`Failed to retrieve posts from the ${topic} topic: FAIL`);
            }
        }
    } catch (error) {
        console.log(`Failed to retrieve posts from the ${topic} topic: FAIL`);
        console.error(error.response ? error.response.data : error.message);
    }
}

async function testCase15() {
    console.log(``);
    console.log(`...................`);
    console.log(`Test Case 15 - TC15:`);

    const mary = { username: "Mary", password: "MaryPass123" };
    const topic = 'Health';

    const posts = await getAllPostsFromTopic(mary, topic);

    if (posts && posts.length === 1 && posts[0].owner.username === 'Nestor') {
        console.log(`Mary successfully retrieved only Nestor's post in the ${topic} topic: PASS`);
    } else {
        console.log(`Mary did not retrieve only Nestor's post in the ${topic} topic: FAIL`);
    }
}

testCase15();
