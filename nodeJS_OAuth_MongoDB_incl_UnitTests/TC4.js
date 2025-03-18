//TC4: Olga posts a message in the Tech topic with an expiration time (e.g. 5 minutes) using her
// token. After the end of the expiration time, the message will not accept any further user
// interactions (likes, dislikes, or comments).

const axios = require('axios');

const BASE_URL = process.env.BASE_URL;

const users = [
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

async function testPostExpiration(olgaToken) {
    // Step 1: Olga posts a message with an expiration time
    let postId;
    try {
        const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
        const postResponse = await axios.post(`${BASE_URL}/posts`, {
            identifier: `post_${new Date().getTime()}`, // Ensure a unique identifier
            topic: 'Tech',
            title: 'Test Post',
            body: 'This is a test post with expiration',
            expirationTime: expirationTime.toISOString() // Send the expiration time
        }, {
            headers: { 'Authorization': `Bearer ${olgaToken}` } // Use olgaToken here
        });


        if (postResponse.status === 200) {
            console.log('Post Message Test: PASS');
            postId = postResponse.data._id; // Assuming the post ID is returned
        } else {
            console.log('Post Message Test: FAIL');
            return;
        }
    } catch (error) {
        console.log('Post Message Test: FAIL');
        console.error(error.response ? error.response.data : error.message);
        return;
    }

    // Step 2: Wait for the expiration time to elapse
    console.log('Waiting for expiration time...');
    await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000)); // Wait 5 minutes

    // Step 3: Attempt to interact with the post after expiration
    try {
        const interactionResponse = await axios.post(`${BASE_URL}/posts/${postId}/interact`, {
            interaction: 'like'
        }, {
            headers: { 'Authorization': `Bearer ${olgaToken}` } // Use olgaToken here as well
        });

        // If the request does not fail, the test should fail
        console.log('Post Interaction After Expiration Test: FAIL');
    } catch (error) {
        // Check if the error status code indicates that the post is expired
        if (error.response && error.response.status === 400 && error.response.data === 'Post has expired.') {
            console.log('Post Interaction After Expiration Test: PASS');
        } else {
            console.log(error)
            console.log('Post Interaction After Expiration Test: FAIL');
        }
    }
}

async function runTests() {
    console.log(``);
    console.log(`...................`);
    console.log(`Test Case 4 - TC4:`);
    const token = await authenticateUser(users[0]);
    if (token) {
        console.log(`${users[0].username}'s Token: ${token}`);
        await testPostExpiration(token); // Call testPostExpiration directly with the token
    }
}


runTests();

