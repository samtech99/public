#!/bin/bash

export JWT_SECRET="69c053b604af3e0bebc0d0ca18394a373e8f17"
export MONGODB_STRING="mongodb://34.39.1.141:27017/piazza"
export BASE_URL="http://34.147.228.191:8080/api"

node TC_CleanupDB.js

# TC 1:
# Define users to register
usernames=("Olga" "Nick" "Mary" "Nestor")
passwords=("OlgaPass123" "NickPass123" "MaryPass123" "NestorPass123")
emails=("olga@example.com" "nick@example.com" "mary@example.com" "nestor@example.com")

# Function to register a user
register_user() {
    local username=$1
    local password=$2
    local email=$3

    # Make sure to correct the curl data section as previously mentioned
    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/register" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$username\",\"password\":\"$password\",\"email\":\"$email\"}")

    if [[ $response -eq 201 ]]; then
        echo "Registration Test for $username: PASS"
    else
        echo "Registration Test for $username: FAIL"
    fi
}

echo ""
echo "..................."
echo "Test Case 1 - TC1:"
# Loop over the users and call the register_user function
for ((i=0; i<${#usernames[@]}; i++)); do
    register_user "${usernames[i]}" "${passwords[i]}" "${emails[i]}"
done


# TC 2:
# Define users to authenticate
usernames=("Olga" "Nick" "Mary" "Nestor")
passwords=("OlgaPass123" "NickPass123" "MaryPass123" "NestorPass123")

# Function to authenticate a user
authenticate_user() {
    local username=$1
    local password=$2

    response=$(curl -s -X POST "$BASE_URL/oauth/token" \
        -H "Content-Type: application/json" \
        -d "{\"grant_type\": \"password\", \"username\": \"$username\", \"password\": \"$password\"}")

    # Assuming the response is a valid JSON with access_token field
    token=$(echo $response | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')

    if [[ -n $token ]]; then
        echo "$token"  # echo only the token to "return" it from the function
    else
        echo "Authentication Test for $username: FAIL"
        return 1  # Return a non-zero exit code to indicate failure
    fi
}


echo ""
echo "..................."
echo "Test Case 2 - TC2:"
# Loop over the users and call the authenticate_user function
for ((i=0; i<${#usernames[@]}; i++)); do
    authenticate_user "${usernames[i]}" "${passwords[i]}"
done


# TC 3:
# Function to test unauthorized access to a protected resource
test_unauthorized_access() {
    # Make the GET request and capture the HTTP status code
    http_status=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/protected-resource")

    # Check if the status code is 401 Unauthorized
    if [[ $http_status -eq 401 ]]; then
        echo "Unauthorized Access Test: PASS"
    else
        echo "Unauthorized Access Test: FAIL (received unexpected status code: $http_status)"
    fi
}

# Run the unauthorized access test
echo ""
echo "..................."
echo "Test Case 3 - TC3:"
test_unauthorized_access



# TC 4:
authenticate_user() {
    local username=$1
    local password=$2

    # Perform the authentication request
    response=$(curl -s -X POST "$BASE_URL/oauth/token" \
        -H "Content-Type: application/json" \
        -d "{\"grant_type\": \"password\", \"username\": \"$username\", \"password\": \"$password\"}")

    # Extract the token value from the response
    token=$(echo $response | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')

    # Check if we got a token
    if [[ -n $token ]]; then
        # If you want to keep the status messages, direct them to a different file descriptor
        echo "Authentication Test for $username: PASS" >&2
        #echo "$username Token: $token" >&2
        # Output the token so it can be captured when calling the function
        echo "$token"
    else
        echo "Authentication Test for $username: FAIL" >&2
        return 1 # Indicate failure
    fi
}



post_message() {
    local token=$1
    local expirationTime=$(date -u -v+5M +"%Y-%m-%dT%H:%M:%SZ") # 5 minutes from now in UTC

    uuid=$(uuidgen)
    # Execute the curl command and save the response
    response=$(curl -s -X POST "$BASE_URL/posts" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "{\"topic\": \"Tech\", \"title\": \"Test Post\", \"body\": \"This is a test post with expiration\", \"expirationTime\": \"$expirationTime\", \"identifier\": \"$uuid\"}")

    # Assuming the response contains a post ID
    postId=$(echo $response | jq -r '._id')
    if [[ -n $postId ]]; then
        echo "$postId"  # Only output the postId here.
    else
        echo "Post Message Test: FAIL" >&2
        return 1 # Indicate failure
    fi
}


# Main execution
echo ""
echo "..................."
echo "Test Case 4 - TC4:"
token=$(authenticate_user "Olga" "OlgaPass123")
#echo "Token after authenticate_user function: $token"  # Debugging line

if [[ -n $token ]]; then
    postId=$(post_message "$token")  # Ensure quotes are used to preserve the value
    #echo "PostId after post_message function: $postId"  # This line should now correctly print only the postId.
else
    echo "Failed to authenticate user and get token"
fi
#echo "Constructed URL: ${BASE_URL}/posts/${postId}/interact"

echo ""
# Instruction to the user to wait 5 minutes before attempting to interact with the post
echo "Please wait for 5 minutes before attempting to interact with the post."
echo "After 5 minutes it will run the following command to test interaction with the post (replace <POST_ID> with the actual post ID):"
echo "curl -s -X POST \"${BASE_URL}/posts/${postId}/interact\" -H \"Content-Type: application/json\" -H \"Authorization: Bearer ${token}\" -d '{\"interaction\": \"like\"}'"
echo ""
sleep 300

#echo "Attempting to interact with the post ID: ${postId}"
#echo "Using token: ${token}"
#echo "Constructed URL: ${BASE_URL}/posts/${postId}/interact"


# Then the curl command
response=$(curl -i -s -X POST "${BASE_URL}/posts/${postId}/interact" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $token" \
  -d '{"interaction": "like"}')

echo ""
echo "Response: " $response
# Check for HTTP status 200 OK
if echo "$response" | grep -q "Post has expired"; then
  echo "Interaction Test: PASS"
else
  echo "Interaction Test: FAIL"
fi



# TC 5:
# Function to post a message with an expiration time and a unique identifier
post_message_with_expiration() {
    local token=$1
    local expirationInMinutes=$2

    local expirationTime=$(date -u -v +"${expirationInMinutes}M" +"%Y-%m-%dT%H:%M:%SZ")
    local identifier="post_$(date +%s)"  # Unique identifier based on the current timestamp

    response=$(curl -s -X POST "$BASE_URL/posts" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "{\"identifier\": \"$identifier\", \"topic\": \"Tech\", \"title\": \"Nick's Test Post\", \"body\": \"This is a test post with expiration\", \"expirationTime\": \"$expirationTime\"}")

    if [ $(echo $response | grep -c '"_id":') -gt 0 ]; then
        echo "Post Message Test: PASS"
        echo $response | grep -o '"_id":"[^"]*' | grep -o '[^"]*$'
    else
        echo "Post Message Test: FAIL"
    fi
}


echo ""
echo "..................."
echo "Test Case 5 - TC5:"
nick_token=$(authenticate_user "Nick" "NickPass123")

if [[ -n $nick_token ]]; then
    #set -x  # Enable debugging to see the commands being executed
    nick_postId=$(post_message_with_expiration $nick_token 5)
    #set +x  # Disable debugging
    echo "Nick posted a message with ID: $nick_postId"
fi

#TC 6
EXPIRATION_TIME_IN_MINUTES=5

get_expiration_date() {
    expirationTimeInMinutes=$1
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        date -u -d "+${expirationTimeInMinutes} minutes" +"%Y-%m-%dT%H:%M:%SZ"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        date -u -v +${expirationTimeInMinutes}M +"%Y-%m-%dT%H:%M:%SZ"
    else
        echo "Unsupported OS for date calculation"
        exit 1
    fi
}

# Then you would call it like this in your post_message_with_expiration function:
expirationTime=$(get_expiration_date "$EXPIRATION_TIME_IN_MINUTES")

post_message_with_expiration2() {
    token=$1
    expirationTime=$(date -u -v +${EXPIRATION_TIME_IN_MINUTES}M +"%Y-%m-%dT%H:%M:%SZ")
    identifier="post_$(date +%s)"

    response=$(curl -s -X POST "$BASE_URL/posts" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "{\"identifier\": \"$identifier\", \"topic\": \"Tech\", \"title\": \"Mary's Test Post\", \"body\": \"This is a test post with expiration\", \"expirationTime\": \"$expirationTime\"}")

    if echo "$response" | grep -q "_id"; then
        postId=$(echo "$response" | jq -r '._id')
        echo "Post Message Test: PASS"
        echo "Post ID: $postId"
    else
        echo "Post Message Test: FAIL"
        exit 1
    fi
}

# Main execution
echo ""
echo "..................."
echo "Test Case 6 - TC6:"
token=$(authenticate_user "Mary" "MaryPass123")
if [[ -n $token ]]; then
    post_message_with_expiration2 "$token"
else
    echo "Failed to authenticate user and get token"
fi



#TC7

# Function to browse posts of a specific topic
browse_posts() {
    local user=$1
    local password=$2
    local topic=$3

    # Authenticate and get the token
    local token=$(authenticate_user $user $password)
    if [[ -z $token ]]; then
        echo "Failed to get token for $user"
        return 1
    fi

    # Browse posts
    local response=$(curl -s -X GET "$BASE_URL/posts/$topic" \
        -H "Authorization: Bearer $token")

    # Print the response for debugging
    #echo "Response for $user:"
    #echo "$response" | jq .

    # Assuming the response is a JSON array of posts
    local post_count=$(echo "$response" | jq length)
    echo "$user retrieved $post_count posts from $topic topic."

    # Validate the posts
    local valid_posts=true
    for ((i=0; i<post_count; i++)); do
        local likes=$(echo "$response" | jq ".[$i].likes")
        local dislikes=$(echo "$response" | jq ".[$i].dislikes")
        local comments=$(echo "$response" | jq ".[$i].comments | length")
        if [[ $likes -ne 0 || $dislikes -ne 0 || $comments -ne 0 ]]; then
            valid_posts=false
            break
        fi
    done

    if [[ $valid_posts == true ]]; then
        echo "All posts have zero likes, zero dislikes, and no comments: PASS"
    else
        echo "Some posts do not meet the expected criteria: FAIL"
    fi
}



# Function to run Test Case 7
test_case_7() {
    echo ""
    echo "..................."
    echo "Test Case 7 - TC7:"


    browse_posts "Nick" "NickPass123" "Tech"
    browse_posts "Olga" "OlgaPass123" "Tech"

}

test_case_7


#TC8
# Function to like a post
like_post() {
    local user=$1
    local password=$2
    local post_id=$3

    local token=$(authenticate_user $user $password)
    if [[ -z $token ]]; then
        echo "Failed to authenticate $user"
        return 1
    fi

    local http_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/posts/$post_id/interact" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d '{"interaction": "like"}')

    if [[ $http_status == 200 ]]; then
        echo "$user liked the post: PASS"
    else
        echo "$user failed to like the post: FAIL"
        echo "HTTP status code: $http_status"
    fi
}


# Function to get Mary's post from the Tech topic
get_marys_post_from_tech() {
    local user=$1
    local password=$2
    local topic=$3

    # Authenticate and get the token
    local token=$(authenticate_user $user $password)
    if [[ -z $token ]]; then
        echo "Failed to authenticate $user"
        return 1
    fi

    # Get the posts from the Tech topic
    local posts_response=$(curl -s -X GET "$BASE_URL/posts/$topic" \
        -H "Authorization: Bearer $token")

    # Output the raw response for debugging
    #echo "Raw response for $user:"
    #echo "$posts_response"

    # Directly parse Mary's post if the response is valid JSON
    local marys_post=$(echo "$posts_response" | jq '.[] | select(.owner.username == "Mary")')
    if [[ -z $marys_post ]]; then
        echo "Mary's post not found or invalid JSON"
        return 1
    fi

    # Output Mary's post for debugging
    #echo "Mary's post:"
    #echo "$marys_post"
    echo "$marys_post" | jq -r '._id'
}


# Test Case 8
test_case_8() {
    echo ""
    echo "..................."
    echo "Test Case 8 - TC8:"

    local marys_post=$(get_marys_post_from_tech "Nick" "NickPass123" "Tech")
    local post_id=$marys_post

    if [[ -n $post_id ]]; then
        like_post "Nick" "NickPass123" $post_id
        like_post "Olga" "OlgaPass123" $post_id
    else
        echo "Failed to retrieve Mary's post: FAIL"
    fi
}

# Run Test Case 8
test_case_8




#TC9
# Function to get a post by topic and username
get_post_from_tech() {
    local token=$1
    local topic=$2
    local username=$3

    local posts=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/posts/$topic")
    echo $posts | jq ".[] | select(.owner.username == \"$username\")"
}

# Function to interact with a post
interact_with_post() {
    local token=$1
    local post_id=$2
    local interaction=$3

    local http_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/posts/$post_id/interact" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "{\"interaction\": \"$interaction\"}")

    echo $http_status
}

# Main test case function
test_case_9() {
    echo ""
    echo "..................."
    echo "Test Case 9 - TC9:"
    
    local nestor_token=$(authenticate_user "Nestor" "NestorPass123")

    if [[ -n $nestor_token ]]; then
        echo "Authentication for Nestor: PASS"

        local nicks_post=$(get_post_from_tech "$nestor_token" "Tech" "Nick")
        local nicks_post_id=$(echo $nicks_post | jq -r '._id')

        local marys_post=$(get_post_from_tech "$nestor_token" "Tech" "Mary")
        local marys_post_id=$(echo $marys_post | jq -r '._id')

        if [[ -n $nicks_post_id ]]; then
            local like_status=$(interact_with_post "$nestor_token" "$nicks_post_id" "like")
            if [[ $like_status == 200 ]]; then
                echo "Nestor liked Nick's post: PASS"
            else
                echo "Nestor failed to like Nick's post: FAIL"
            fi
        else
            echo "Failed to retrieve Nick's post: FAIL"
        fi

        if [[ -n $marys_post_id ]]; then
            local dislike_status=$(interact_with_post "$nestor_token" "$marys_post_id" "dislike")
            if [[ $dislike_status == 200 ]]; then
                echo "Nestor disliked Mary's post: PASS"
            else
                echo "Nestor failed to dislike Mary's post: FAIL"
            fi
        else
            echo "Failed to retrieve Mary's post: FAIL"
        fi
    else
        echo "Authentication for Nestor: FAIL"
    fi
}

# Run Test Case 9
test_case_9



#TC10
# Function to browse posts in a topic
browse_posts_in_topic() {
    local token=$1
    local topic=$2

    local response=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/posts/$topic")
    
    echo "$response" | jq -c '.[]' | while read post; do
        local owner=$(echo $post | jq -r '.owner.username')
        local title=$(echo $post | jq -r '.title')
        local likes=$(echo $post | jq -r '.likes')
        local dislikes=$(echo $post | jq -r '.dislikes')
        
        # Validation for Nick's and Mary's posts
        if [[ "$owner" == "Mary" && "$likes" == "2" && "$dislikes" == "1" ]]; then
            echo "Mary's post validation: PASS"
        elif [[ "$owner" == "Nick" && "$likes" == "1" ]]; then
            echo "Nick's post validation: PASS"
        fi
        
        echo "Post by $owner: $title"
        echo "Likes: $likes, Dislikes: $dislikes"
    done
}

# Main test case function
test_case_10() {
    echo ""
    echo "..................."
    echo "Test Case 10 - TC10:"
    
    local nick_token=$(authenticate_user "Nick" "NickPass123")

    if [[ -n $nick_token ]]; then
        echo "Authentication for Nick: PASS"
        browse_posts_in_topic "$nick_token" "Tech"
    else
        echo "Authentication for Nick: FAIL"
    fi
}

# Run Test Case 10
test_case_10



#TC11:
# Function to get Mary's post from the Tech topic
get_marys_post_from_tech() {
    local token=$1
    local topic=$2

    local response=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/posts/$topic")
    local marys_post=$(echo $response | jq '.[] | select(.owner.username == "Mary")')
    
    echo "$marys_post" | jq -r '._id'
}

# Function to interact with post
interact_with_post() {
    local user_token=$1
    local post_id=$2
    local interaction=$3

    local response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/posts/$post_id/interact" \
        -H "Authorization: Bearer $user_token" \
        -H "Content-Type: application/json" \
        -d "{\"interaction\": \"$interaction\"}")

local response_body=$(curl -s -X POST "$BASE_URL/posts/$post_id/interact" \
    -H "Authorization: Bearer $user_token" \
    -H "Content-Type: application/json" \
    -d "{\"interaction\": \"$interaction\"}")
local response_code=$(echo $response_body | jq -r '.statusCode')

echo "Response Body: $response_body"
#echo "Response Code: $response_code"

    if [[ $response == 200 ]]; then
        echo "Interaction with post successful: FAIL"
    elif [[ $response == 400 ]]; then
        echo "Interaction with post correctly failed (Post owners cannot like their own post): PASS"
    else
        echo "Interaction with post failed with unexpected status code $response: FAIL"
    fi
}

# Main test case function
test_case_11() {
    echo ""
    echo "..................."
    echo "Test Case 11 - TC11:"
    
    local mary_token=$(authenticate_user "Mary" "MaryPass123")

    if [[ -n $mary_token ]]; then
        local marys_post_id=$(get_marys_post_from_tech "$mary_token" "Tech")
        if [[ -n $marys_post_id ]]; then
            interact_with_post "$mary_token" "$marys_post_id" "like"
        else
            echo "Failed to retrieve Mary's post: FAIL"
        fi
    else
        echo "Authentication for Mary: FAIL"
    fi
}

# Run Test Case 11
test_case_11



#TC12
# Function to get Mary's post from the Tech topic
get_marys_post_from_tech() {
    local token=$1
    local topic=$2
    local response=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/posts/$topic")
    echo $response | jq -r '.[] | select(.owner.username == "Mary") | ._id'
}


# Function to comment on a post
comment_on_post() {
    local user_token=$1
    local post_id=$2
    local comment_text=$3
    local user_name=$4

    # Make the POST request and capture the full response
    local response=$(curl -s -X POST "$BASE_URL/posts/$post_id/interact" \
        -H "Authorization: Bearer $user_token" \
        -H "Content-Type: application/json" \
        -d "{\"interaction\": \"comment\", \"commentText\": \"$comment_text\"}")

    # Debug
    #echo "Response: $response"

    # Check if the response contains success indication
    if echo "$response" | grep -q '"_id"'; then
        echo "Comment by $user_name on the post successful: PASS"
    else
        echo "Comment by $user_name on the post failed: FAIL"
    fi
}






# Main test case function
test_case_12() {
    echo ""
    echo "..................."
    echo "Test Case 12 - TC12:"

    local nick_token=$(authenticate_user "Nick" "NickPass123")
    local olga_token=$(authenticate_user "Olga" "OlgaPass123")
    
    if [[ -n $nick_token && -n $olga_token ]]; then
        local marys_post_id=$(get_marys_post_from_tech "$nick_token" "Tech")
        if [[ -n $marys_post_id ]]; then
            # Round-robin commenting
            comment_on_post "$nick_token" "$marys_post_id" "Nick's first comment" "Nick"
            comment_on_post "$olga_token" "$marys_post_id" "Olga's first comment" "Olga"
            comment_on_post "$nick_token" "$marys_post_id" "Nick's second comment" "Nick"
            comment_on_post "$olga_token" "$marys_post_id" "Olga's second comment" "Olga"
        else
            echo "Failed to retrieve Mary's post: FAIL"
        fi
    else
        echo "Authentication failed for Nick or Olga: FAIL"
    fi
}

# Run Test Case 12
test_case_12



#TC13

# Function to get all posts from a specific topic
get_all_posts_from_topic() {
    local token=$1
    local topic=$2
    local response=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/posts/$topic")
    echo $response
}

display_post_details() {
    local posts=$1
    echo "$posts" | jq -c '.[]' | while read -r post; do
        local post_id=$(echo $post | jq -r '._id')
        local likes=$(echo $post | jq -r '.likes')
        local dislikes=$(echo $post | jq -r '.dislikes')
        local comments=$(echo $post | jq -r '.comments | length')

        echo "Post ID: $post_id"
        echo "Likes: $likes, Dislikes: $dislikes"
        echo "Comments: $comments"
        echo "Comments Detail:"
        
        # Extract and display the username of the commenter and the comment text
        echo $post | jq -r '.comments[] | "- \(.user): \(.comment) on \(.date)"' 
    done
}



# Main test case function
test_case_13() {
    echo ""
    echo "..................."
    echo "Test Case 13 - TC13:"

    local nick_token=$(authenticate_user "Nick" "NickPass123")
    local topic="Tech"

    if [[ -n $nick_token ]]; then
        local posts=$(get_all_posts_from_topic "$nick_token" "$topic")
        if [[ -n $posts ]]; then
            display_post_details "$posts"
        else
            echo "Failed to retrieve posts for topic $topic: FAIL"
        fi
    else
        echo "Authentication failed for Nick: FAIL"
    fi
}

# Run Test Case 13
test_case_13



#TC 14
# Function to post a message
post_message() {
    local token=$1
    local topic=$2
    local title=$3
    local body=$4
    local expirationTime=$5
    local identifier=$(uuidgen) # Generate a unique identifier

    local response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/posts" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "{\"identifier\": \"$identifier\", \"title\": \"$title\", \"body\": \"$body\", \"topic\": [\"$topic\"], \"expirationTime\": \"$expirationTime\"}")
    echo "$response"
}



# Main test case function
test_case_14() {
    echo ""
    echo "..................."
    echo "Test Case 14 - TC14:"

    local nestor_token=$(authenticate_user "Nestor" "NestorPass123")
    local topic="Health"
    local title="Health Tips"
    local body="Stay hydrated and sleep well."
    local expirationTime=$(date -u -v+1M '+%Y-%m-%dT%H:%M:%SZ') # 1 minute from now in UTC

    if [[ -n $nestor_token ]]; then
        local response_and_status=$(post_message "$nestor_token" "$topic" "$title" "$body" "$expirationTime")
        
        # Extract the HTTP status code and response body
        local http_status=$(echo "$response_and_status" | tail -n1)
        local response_body=$(echo "$response_and_status" | sed '$d') # Remove the last line (HTTP status)

        #For debug
        #echo "Response Body: $response_body"
        #echo "HTTP Status: $http_status"

        if [[ $http_status -eq 200 || $http_status -eq 201 ]]; then
            echo "Nestor successfully posted a message in the $topic topic: PASS"
        else
            echo "Failed to post message for Nestor in the $topic topic: FAIL"
        fi
    else
        echo "Authentication failed for Nestor: FAIL"
    fi
}

# Run Test Case 14
test_case_14



# TC15

# Function to get all posts from a specific topic
get_all_posts_from_topic() {
    local token=$1
    local topic=$2
    local response=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/posts/$topic")
    echo $response
}

# Main test case function
test_case_15() {
    echo ""
    echo "..................."
    echo "Test Case 15 - TC15:"

    local mary_token=$(authenticate_user "Mary" "MaryPass123")
    local topic="Health"

    if [[ -n $mary_token ]]; then
        local posts=$(get_all_posts_from_topic "$mary_token" "$topic")
        local count=$(echo $posts | jq '[.[] | select(.owner.username == "Nestor")] | length')

        if [[ $count -eq 1 ]]; then
            echo "Mary successfully retrieved only Nestor's post in the $topic topic: PASS"
        else
            echo "Mary did not retrieve only Nestor's post in the $topic topic: FAIL"
        fi
    else
        echo "Authentication failed for Mary: FAIL"
    fi
}

# Run Test Case 15
test_case_15



#TC16

# Function to get Nestor's post from the Health topic
get_nestors_post_from_health() {
    local token=$1
    local response=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/posts/Health")
    echo $response | jq -r '.[] | select(.owner.username == "Nestor") | ._id'
}

# Function to post a comment on a post
comment_on_post() {
    local token=$1
    local post_id=$2
    local comment=$3
    local response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/posts/$post_id/interact" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "{\"interaction\": \"comment\", \"commentText\": \"$comment\"}")
    echo "$response"
}


# Main test case function
test_case_16() {
    echo ""
    echo "..................."
    echo "Test Case 16 - TC16:"

    local mary_token=$(authenticate_user "Mary" "MaryPass123")

        if [[ -n $mary_token ]]; then
        local nestors_post_id=$(get_nestors_post_from_health "$mary_token")

        if [[ -n $nestors_post_id ]]; then
            local response_and_status=$(comment_on_post "$mary_token" "$nestors_post_id" "Mary's comment on Nestor's post")
            local http_status=$(echo "$response_and_status" | tail -n1)
            local response_body=$(echo "$response_and_status" | sed '$d')  # Use sed to remove the last line

            #For debug
            #echo "Response Body: $response_body"
            #echo "HTTP Status: $http_status"

            if [[ $http_status -eq 200 ]]; then
                echo "Mary successfully commented on Nestor's post in the Health topic: PASS"
            else
                echo "Mary failed to comment on Nestor's post in the Health topic: FAIL"
            fi
        else
            echo "Failed to retrieve Nestor's post in the Health topic: FAIL"
        fi
    else
        echo "Authentication failed for Mary: FAIL"
    fi
}

# Run Test Case 16
test_case_16




sleep 60
#TC17
# Function to get Nestor's post from the Health topic
get_nestors_post_from_health() {
    local token=$1
    local response=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/posts/Health")
    echo $response | jq -r '.[] | select(.owner.username == "Nestor") | ._id'
}

# Function to dislike a post
dislike_post() {
    local token=$1
    local post_id=$2
    local response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/posts/$post_id/interact" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "{\"interaction\": \"dislike\"}")
    echo "$response"
}

# Main test case function
test_case_17() {
    echo ""
    echo "..................."
    echo "Test Case 17 - TC17:"

    local mary_token=$(authenticate_user "Mary" "MaryPass123")

    if [[ -n $mary_token ]]; then
        local nestors_post_id=$(get_nestors_post_from_health "$mary_token")

        if [[ -n $nestors_post_id ]]; then
            local response_and_status=$(dislike_post "$mary_token" "$nestors_post_id")
            local http_status=$(echo "$response_and_status" | tail -n1)
            local response_body=$(echo "$response_and_status" | sed '$d')  # Use sed to remove the last line

            #for debug
            #echo "Response Body: $response_body"
            #echo "HTTP Status: $http_status"

            if [[ $http_status -eq 400 ]]; then
                echo "Mary correctly failed to dislike the expired post in the Health topic: PASS"
            else
                echo "Mary incorrectly managed to dislike the post in the Health topic: FAIL"
            fi
        else
            echo "Failed to retrieve Nestor's post in the Health topic: FAIL"
        fi
    else
        echo "Authentication failed for Mary: FAIL"
    fi
}

# Run Test Case 17
test_case_17




#TC18

# Function to get posts from the Health topic
get_health_topic_posts() {
    local token=$1
    local response=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/posts/Health")
    echo "$response"
}

# Main test case function
test_case_18() {
    echo ""
    echo "..................."
    echo "Test Case 18 - TC18:"

    local nestor_token=$(authenticate_user "Nestor" "NestorPass123")

    if [[ -n $nestor_token ]]; then
        local posts=$(get_health_topic_posts "$nestor_token")
        local post_count=$(echo "$posts" | jq '[.[] | select(.owner.username == "Nestor")] | length')
        local comment_count=$(echo "$posts" | jq '.[0].comments | length')

        if [[ $post_count -eq 1 && $comment_count -eq 1 ]]; then
            echo "Nestor's post with Mary's comment is present: PASS"
        else
            echo "Nestor's post with Mary's comment is not present as expected: FAIL"
        fi
    else
        echo "Authentication failed for Nestor: FAIL"
    fi
}

# Run Test Case 18
test_case_18



#TC19
# Function to get expired posts from the Sports topic
get_expired_sports_topic_posts() {
    local token=$1
    local response=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/posts/Sports/expired")
    echo "$response"
}

# Main test case function
test_case_19() {
    echo ""
    echo "..................."
    echo "Test Case 19 - TC19:"

    local nick_token=$(authenticate_user "Nick" "NickPass123")

    if [[ -n $nick_token ]]; then
        local expired_posts=$(get_expired_sports_topic_posts "$nick_token")
        local count=$(echo $expired_posts | jq 'length')

        if [[ $count -eq 0 ]]; then
            echo "No expired posts in the Sports topic as expected: PASS"
        else
            echo "Expired posts were found in the Sports topic or the array was not empty: FAIL"
        fi
    else
        echo "Authentication failed for Nick: FAIL"
    fi
}

# Run Test Case 19
test_case_19



#TC20
# Function to get the most active post from the Tech topic
get_most_active_post() {
    local token=$1
    local topic=$2
    local response=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/posts/$topic/most-active")
    echo "$response"
}

# Main test case function
test_case_20() {
    echo ""
    echo "..................."
    echo "Test Case 20 - TC20:"

    local nestor_token=$(authenticate_user "Nestor" "NestorPass123")

    if [[ -n $nestor_token ]]; then
        local most_active_post=$(get_most_active_post "$nestor_token" "Tech")
        local owner_username=$(echo $most_active_post | jq -r '.owner.username')

        if [[ "$owner_username" == "Mary" ]]; then
            echo "The most active post in the Tech topic is Mary's post as expected: PASS"
        else
            echo "The most active post in the Tech topic is not Mary's post: FAIL"
        fi
    else
        echo "Authentication failed for Nestor: FAIL"
    fi
}

# Run Test Case 20
test_case_20



