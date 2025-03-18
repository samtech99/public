//TC17: Mary dislikes Nestor’s message on the Health topic after the end of post-expiration time. This should fail.


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

async function getPostFromHealth(user, topic, ownerUsername) {
    // Authenticate the user first to get their token
    const token = await authenticateUser(user);
    if (!token) {
        throw new Error('Authentication failed');
    }

    // Fetch posts from the Health topic
    try {
        const response = await axios.get(`${BASE_URL}/posts/${topic}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 200 && Array.isArray(response.data)) {
            // Find the post by the owner's username
            return response.data.find(post => post.owner.username === ownerUsername);
        } else {
            throw new Error(`Failed to retrieve posts from the ${topic} topic`);
        }
    } catch (error) {
        console.error('Error in getPostFromHealth:', error.message);
        throw error; // Rethrow the error to handle it in the calling function
    }
}


async function dislikeExpiredPost(user, postIdentifier) {
    try {
        const token = await authenticateUser(user);
        if (token) {
            const response = await axios.post(`${BASE_URL}/posts/${postIdentifier}/interact`, {
                interaction: 'dislike'
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // If we get here, the request did not fail as it should have, because the post is expired
            console.log(`${user.username} managed to dislike an expired post: PASS`);
        }
    } catch (error) {
        if (error.response && error.response.status === 400 && error.response.data === 'Post has expired.') {
            console.log(`${user.username} could not dislike the post because it is expired: FAIL`);
        } else {
            console.log(`${user.username} failed to dislike the post for an unexpected reason: FAIL`);
            console.error(error.response ? error.response.data : error.message);
        }
    }
}

async function testCase17() {
    console.log(``);
    console.log(`...................`);
    console.log(`Test Case 17 - TC17:`);

    const mary = { username: "Mary", password: "MaryPass123" };
    const topic = 'Health';
    const ownerUsername = 'Nestor'; // Replace with the actual username of Nestor

    // Get Nestor's post from the Health topic
    const nestorsPost = await getPostFromHealth(mary, topic, ownerUsername);

    if (nestorsPost) {
        // Attempt to dislike the post
        await dislikeExpiredPost(mary, nestorsPost._id);
    } else {
        console.log(`Failed to retrieve Nestor's post: FAIL`);
    }
}

testCase17();



