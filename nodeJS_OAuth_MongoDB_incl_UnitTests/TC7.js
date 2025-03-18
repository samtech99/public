//TC7: Nick and Olga browse all the available posts in the Tech topic; three posts should be available with zero likes, zero dislikes and no comments.

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

async function browsePosts(user, topic) {
    try {
        const token = await authenticateUser(user);
        if (token) {
            console.log(`${user.username}'s Token: ${token}`);
            const postsResponse = await axios.get(`${BASE_URL}/posts/${topic}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log(`${user.username} retrieved ${postsResponse.data.length} posts from ${topic} topic.`);

            if (postsResponse.status === 200 && Array.isArray(postsResponse.data)) {
                console.log(`Browse Posts Test for ${user.username}: PASS`);
                //console.log(postsResponse.data); // Log the retrieved posts
                return postsResponse.data; // Return the posts
            } else {
                console.log(`Browse Posts Test for ${user.username}: FAIL`);
            }
        }
    } catch (error) {
        console.log(`Browse Posts Test for ${user.username}: FAIL`);
        console.error(error.response ? error.response.data : error.message);
    }
}


async function testCase7() {
    console.log(``);
    console.log(`...................`);
    console.log(`Test Case 7 - TC7:`);
    const nick = { username: "Nick", password: "NickPass123" };
    const olga = { username: "Olga", password: "OlgaPass123" };

    const nickPosts = await browsePosts(nick, 'Tech');
    const olgaPosts = await browsePosts(olga, 'Tech');

    // Check if both users retrieved three posts with zero likes, zero dislikes, and no comments
    if (nickPosts && olgaPosts && nickPosts.length === 3 && olgaPosts.length === 3) {
        let allPostsValid = true;
        for (let post of [...nickPosts, ...olgaPosts]) {
            if (post.likes !== 0 || post.dislikes !== 0 || post.comments.length !== 0) {
                allPostsValid = false;
                break;
            }
        }

        if (allPostsValid) {
            console.log('All posts have zero likes, zero dislikes, and no comments: PASS');
        } else {
            console.log('Some posts do not meet the expected criteria: FAIL');
        }
    } else {
        console.log('Did not retrieve the expected number of posts: FAIL');
    }
}

testCase7();
