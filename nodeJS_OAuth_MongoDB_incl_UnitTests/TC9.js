//TC9: Nestor “likes” Nick’s post and “dislikes” Mary’s on the Tech topic.

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
                console.log(`${user.username} ${interaction}d the post: PASS`);
            } else {
                console.log(`${user.username} failed to ${interaction} the post: FAIL`);
            }
        }
    } catch (error) {
        console.log(`${user.username} failed to ${interaction} the post: FAIL`);
        console.error(error.response ? error.response.data : error.message);
    }
}

async function testCase9() {
    console.log(``);
    console.log(`...................`);
    console.log(`Test Case 9 - TC9:`);

    const nestor = { username: "Nestor", password: "NestorPass123" };

    // Retrieve Nick's and Mary's posts from the Tech topic
    const nicksPost = await getPostFromTech(nestor, 'Tech', 'Nick');
    const marysPost = await getPostFromTech(nestor, 'Tech', 'Mary');

    if (nicksPost) {
        await interactWithPost(nestor, nicksPost, 'like');
    } else {
        console.log(`Failed to retrieve Nick's post: FAIL`);
    }

    if (marysPost) {
        await interactWithPost(nestor, marysPost, 'dislike');
    } else {
        console.log(`Failed to retrieve Mary's post: FAIL`);
    }
}

testCase9();


