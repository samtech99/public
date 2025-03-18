const axios = require('axios');

const BASE_URL = process.env.BASE_URL;

async function testUnauthorizedAccess() {
    console.log(``);
    console.log(`...................`);
    console.log(`Test Case 3 - TC3:`);
    try {
        // Attempt to access a protected resource without a token
        const response = await axios.get(`${BASE_URL}/protected-resource`);

        // If the request does not fail, the test should fail
        console.log('Unauthorized Access Test: FAIL (request succeeded unexpectedly)');
    } catch (error) {
        // Check if the error status code is 401 (Unauthorized)
        if (error.response && error.response.status === 401) {
            console.log('Unauthorized Access Test: PASS');
        } else {
            console.log('Error:', error);
            console.log('Unauthorized Access Test: FAIL (received unexpected error response)');
        }
    }
}

testUnauthorizedAccess();
