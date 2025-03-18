//TC13: Nick browses all the available posts in the Tech topic; at this stage, he can see the number of likes and dislikes of each post and the comments made.

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


async function getAllPostsFromTopic(user, topic) {
    try {
        const token = await authenticateUser(user);
        if (token) {
            const response = await axios.get(`${BASE_URL}/posts/${topic}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 200 && Array.isArray(response.data)) {
                console.log(`Retrieved all posts from the ${topic} topic: PASS`);
                return response.data; // This will be an array of posts
            } else {
                console.log(`Failed to retrieve posts from the ${topic} topic: FAIL`);
            }
        }
    } catch (error) {
        console.log(`Failed to retrieve posts from the ${topic} topic: FAIL`);
        console.error(error.response ? error.response.data : error.message);
    }
}

async function getAllPostsFromTopic(user, topic) {
    try {
        const token = await authenticateUser(user);
        if (token) {
            // Make a GET request to the server to retrieve all posts for the topic
            const response = await axios.get(`${BASE_URL}/posts/${topic}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 200 && Array.isArray(response.data)) {
                // Log the success and return the posts
                console.log(`Retrieved all posts from the ${topic} topic: PASS`);
                return response.data; // This will be an array of posts
            } else {
                // If the status code is not 200 or the data is not an array, log a failure
                console.log(`Failed to retrieve posts from the ${topic} topic: FAIL`);
            }
        }
    } catch (error) {
        // If there's an error in the request, log the failure and the error message
        console.log(`Failed to retrieve posts from the ${topic} topic: FAIL`);
        console.error(error.response ? error.response.data : error.message);
    }
}


async function testCase13() {
    console.log(``);
    console.log(`...................`);
    console.log(`Test Case 13 - TC13:`);

    const nick = { username: "Nick", password: "NickPass123" };
    const topic = 'Tech';

    const posts = await getAllPostsFromTopic(nick, topic);

    if (posts) {
        posts.forEach(post => {
          console.log(`Post ID: ${post._id}`);
          console.log(`Likes: ${post.likes}, Dislikes: ${post.dislikes}`);
          console.log(`Comments: ${post.comments.length}`);
          console.log(`Comments Detail:`);
          post.comments.forEach(comment => {
            // Log the comment object to see its actual structure
//            console.log('Comment object:', comment); //detail log comment if needed
            // Then attempt to access the username if the user object exists
            if (comment.user) {
                
              console.log(`- ${comment.user.username}: ${comment.comment}: PASS`); 
            } else {
              console.log(`- User not found for comment: ${comment.comment}`);
            }
          });
        });
      } else {
        console.log(`Failed to retrieve posts for topic ${topic}: FAIL`);
      }
}

testCase13();
