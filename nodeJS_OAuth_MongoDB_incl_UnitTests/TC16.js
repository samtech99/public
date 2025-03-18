//TC16: Mary posts a comment in Nestor’s message on the Health topic.


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
    try {
        const token = await authenticateUser(user);
        if (token) {
            const postsResponse = await axios.get(`${BASE_URL}/posts/${topic}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (postsResponse.status === 200 && Array.isArray(postsResponse.data)) {
                // Find the specified owner's post in the array of posts
                const ownerPost = postsResponse.data.find(post => post.owner.username === ownerUsername);
                if (ownerPost) {
                    return ownerPost; // Return the owner's post
                } else {
                    console.log(`${ownerUsername}'s post not found in the ${topic} topic.`);
                }
            } else {
                console.log(`Failed to retrieve posts from the ${topic} topic: FAIL`);
            }
        }
    } catch (error) {
        console.log(`Failed to retrieve posts from the ${topic} topic: FAIL`);
        console.error(error.response ? error.response.data : error.message);
    }
}

async function commentOnPost(user, postIdentifier, commentText) {
    try {
        const token = await authenticateUser(user);
        if (token) {
            const response = await axios.post(`${BASE_URL}/posts/${postIdentifier}/interact`, {
                interaction: 'comment',
                commentText: commentText 
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 200) {
                console.log(`${user.username} commented on the post: PASS`);
            } else {
                console.log(`${user.username} failed to comment on the post: FAIL`);
            }
        }
    } catch (error) {
        console.log(`${user.username} failed to comment on the post: FAIL`);
        console.error(error.response ? error.response.data : error.message);
    }
}

async function testCase16() {
    console.log(``);
    console.log(`...................`);
    console.log(`Test Case 16 - TC16:`);

    const mary = { username: "Mary", password: "MaryPass123" };
    const topic = 'Health';
    const ownerUsername = 'Nestor'; // Replace with the actual username of Nestor

    // Get Nestor's post from the Health topic
    const nestorsPost = await getPostFromHealth(mary, topic, ownerUsername);

    // Assuming you have some logic to set the identifier of the post
    if (nestorsPost) {
        // Mary comments on Nestor's post
        await commentOnPost(mary, nestorsPost._id, "Mary's comment on Nestor's post");
    } else {
        console.log(`Failed to retrieve Nestor's post: FAIL`);
    }
}

testCase16();
