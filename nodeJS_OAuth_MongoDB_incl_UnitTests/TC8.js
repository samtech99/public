//TC8: Nick and Olga “like” Mary’s post on the Tech topic.

const axios = require('axios');

const BASE_URL = process.env.BASE_URL;




const users = [
    { username: "Nick", password: "NickPass123" } ,
    { username: "Olga", password: "OlgaPass123" }
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


async function likePost(user, post) {
    try {
        const token = await authenticateUser(user);
        if (token) {
            // Adjust the endpoint to match your server's route definition
            const response = await axios.post(`${BASE_URL}/posts/${post._id}/interact`, {
                interaction: 'like'
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 200) {
                console.log(`${user.username} liked the post: PASS`);
            } else {
                console.log(`${user.username} failed to like the post: FAIL`);
            }
        }
    } catch (error) {
        console.log(`${user.username} failed to like the post: FAIL`);
        console.error(error.response ? error.response.data : error.message);
    }
}


async function getMarysPostFromTech(user, topic) {
    try {
        const token = await authenticateUser(user);
        if (token) {
            const postsResponse = await axios.get(`${BASE_URL}/posts/${topic}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (postsResponse.status === 200 && Array.isArray(postsResponse.data)) {
                // Find Mary's post in the array of posts
                const marysPost = postsResponse.data.find(post => post.owner.username === 'Mary');
                if (marysPost) {
                    return marysPost; // Return Mary's post
                } else {
                    console.log("Mary's post not found in the Tech topic.");
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

async function testCase8() {
    console.log(``);
    console.log(`...................`);
    console.log(`Test Case 8 - TC8:`);

    const nick = { username: "Nick", password: "NickPass123" };
    const olga = { username: "Olga", password: "OlgaPass123" };

    // Retrieve Mary's post from the Tech topic
    const marysPost = await getMarysPostFromTech(nick, 'Tech');

    if (marysPost) {
        await likePost(nick, marysPost);
        await likePost(olga, marysPost);
    } else {
        console.log(`Failed to retrieve Mary's post: FAIL`);
    }
}

testCase8();