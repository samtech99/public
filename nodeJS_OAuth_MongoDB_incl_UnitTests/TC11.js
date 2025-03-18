//TC11: Mary likes her post on the Tech topic. This call should be unsuccessful; in Piazza, a post owner cannot like their messages.

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

async function getPostFromTech(user, topic, username) {
    try {
        const token = await authenticateUser(user);
        if (token) {
            const postsResponse = await axios.get(`${BASE_URL}/posts/${topic}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (postsResponse.status === 200 && Array.isArray(postsResponse.data)) {
                // Find the specified user's post in the array of posts
                const userPost = postsResponse.data.find(post => post.owner.username === username);
                if (userPost) {
                    return userPost; // Return the user's post
                } else {
                    console.log(`${username}'s post not found in the ${topic} topic.`);
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

async function interactWithPost(user, post, interaction) {
    try {
        const token = await authenticateUser(user);
        if (token) {
            const response = await axios.post(`${BASE_URL}/posts/${post._id}/interact`, {
                interaction: interaction
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 200) {
                console.log(`${user.username} ${interaction}d the post: FAIL`);
            } else {
                console.log(`${user.username} failed to ${interaction} the post: Fail (Expeted FAIL)`);
            }
        }
    } catch (error) {
        console.log(`${user.username} failed to ${interaction} the post: PASS (Expeted FAIL)`);
        console.error(error.response ? error.response.data : error.message);
    }
}


async function testCase11() {
    console.log(``);
    console.log(`...................`);
    console.log(`Test Case 11 - TC11:`);

    const mary = { username: "Mary", password: "MaryPass123" };

    // Attempt to retrieve Mary's post from the Tech topic
    const marysPost = await getPostFromTech(mary, 'Tech', 'Mary');

    if (marysPost) {
        // Attempt to like Mary's post
        try {
            await interactWithPost(mary, marysPost, 'like');
        } catch (error) {
            // If the error is due to Mary trying to like her own post, it should be considered a PASS for the test case.
            if (error.response && error.response.status === 400 && error.response.data.error === "Post owners cannot like their own post") {
                console.log(`Mary's attempt to like her own post correctly failed: PASS`);
            } else {
                console.log(`Mary's attempt to like her own post failed for an unexpected reason: FAIL`);
                console.error(error.response ? error.response.data : error.message);
            }
        }
    } else {
        console.log(`Failed to retrieve Mary's post: FAIL`);
    }
}

testCase11();
