//TC10: Nick browses all the available posts on the Tech topic; at this stage, he can see the number 
// of likes and dislikes for each post (Mary has two likes and one dislike, and Nick has one
// like). There are no comments made yet.

const axios = require('axios');

const BASE_URL = process.env.BASE_URL;

const users = [
    { username: "Nick", password: "NickPass123" } 
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


async function browsePostsInTopic(user, topic) {
    try {
        const token = await authenticateUser(user);
        if (token) {
            const response = await axios.get(`${BASE_URL}/posts/${topic}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 200 && Array.isArray(response.data)) {
                console.log(`Posts in the ${topic} topic:`);
                response.data.forEach(post => {
                    console.log(`Post by ${post.owner.username}: ${post.title}`);
                    console.log(`Likes: ${post.likes}, Dislikes: ${post.dislikes}`);
                });
            } else {
                console.log(`Failed to retrieve posts from the ${topic} topic: FAIL`);
            }
        }
    } catch (error) {
        console.log(`Failed to retrieve posts from the ${topic} topic: FAIL`);
        console.error(error.response ? error.response.data : error.message);
    }
}

async function testCase10() {
    console.log(``);
    console.log(`...................`);
    console.log(`Test Case 10 - TC10:`);

    const nick = { username: "Nick", password: "NickPass123" };

    // Browse all posts in the Tech topic
    await browsePostsInTopic(nick, 'Tech');
}

testCase10();
