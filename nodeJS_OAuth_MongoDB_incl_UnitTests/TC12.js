//TC12: Nick and Olga comment on Mary’s post on the Tech topic in a round-robin fashion (one after the other, adding at least two comments each).


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

async function commentOnPost(user, post, commentText) {
    try {
        const token = await authenticateUser(user);
        if (token) {
            const response = await axios.post(`${BASE_URL}/posts/${post._id}/interact`, {
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



async function testCase12() {
    console.log(``);
    console.log(`...................`);
    console.log(`Test Case 12 - TC12:`);

    const nick = { username: "Nick", password: "NickPass123" };
    const olga = { username: "Olga", password: "OlgaPass123" };
    const marysPost = await getPostFromTech(nick, 'Tech', 'Mary');

    if (marysPost) {
        // Round-robin commenting
        await commentOnPost(nick, marysPost, "Nick's first comment");
        await commentOnPost(olga, marysPost, "Olga's first comment");
        await commentOnPost(nick, marysPost, "Nick's second comment");
        await commentOnPost(olga, marysPost, "Olga's second comment");
    } else {
        console.log(`Failed to retrieve Mary's post: FAIL`);
    }
}

testCase12();
