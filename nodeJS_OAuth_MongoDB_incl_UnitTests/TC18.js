//TC18: Nestor browses all the messages on the Health topic. There should be only one post (his own) with one comment (Mary’s).

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


async function getHealthTopicPosts(user) {
    try {
        const token = await authenticateUser(user);
        if (token) {
            const response = await axios.get(`${BASE_URL}/posts/Health`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 200 && Array.isArray(response.data)) {
                console.log(`Retrieved posts from the Health topic: PASS`);
                return response.data;
            } else {
                console.log(`Failed to retrieve posts from the Health topic: FAIL`);
            }
        }
    } catch (error) {
        console.log(`Failed to retrieve posts from the Health topic: FAIL`);
        console.error(error.response ? error.response.data : error.message);
    }
}

async function testCase18() {
    console.log(``);
    console.log(`...................`);
    console.log(`Test Case 18 - TC18:`);

    const nestor = { username: "Nestor", password: "NestorPass123" };

    const posts = await getHealthTopicPosts(nestor);

    if (posts && posts.length === 1 && posts[0].comments.length === 1) {
        console.log(`Nestor's post with Mary's comment is present: PASS`);
        // You can add additional checks here to verify the contents of the post and the comment
    } else {
        console.log(`Nestor's post with Mary's comment is not present as expected: FAIL`);
    }
}

testCase18();
