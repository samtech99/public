const express = require('express');
const bodyParser = require('body-parser');
const login = require('./login.js');
const { User, Post } = require('./schema.js'); // Import User as well, assuming it's defined in schema.js
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const router = express.Router();
const { router: loginRouter, loginMiddleware } = require('./login.js');

router.use(bodyParser.json());

console.log('Routes file loaded');

router.post('/posts', [
  check('title').notEmpty(),
  check('body').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    // Step 1: Extract the token
    const token = req.headers.authorization.split(' ')[1];

    // Step 2: Decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    
    // Step 3: Fetch the user's details from the database
    const user = await User.findById(decoded._id); // Replace _id with the actual field name from the token

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Step 4: Create a new Post document with the user's details as the owner
    const post = new Post({
      ...req.body,
      owner: {
        _id: user._id,
        username: user.username,
        password: user.password,
        email: user.email
      },
      expirationTime: new Date(req.body.expirationTime)
    });

    await post.save();
    res.send(post);

  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({ error: 'Error processing request', details: error.message });
  }
});





// Action 3: Browse messages per topic
router.get('/posts/:topic', loginMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ topic: req.params.topic })
      .populate('comments.user', 'username') // Populate the username of the user in comments
      .exec(); // Execute the query

    // Prepare the posts for the response
    const preparedPosts = posts.map(post => {
      return {
        ...post.toObject(), // Convert the Mongoose document to a plain JavaScript object
        comments: post.comments.map(comment => {
          return {
            user: comment.user ? comment.user.username : null, // Include username
            comment: comment.comment, // Include comment text
            date: comment.date
          };
        })
      };
    });

    res.send(preparedPosts); // Send the prepared posts
  } catch (error) {
    console.error(`Error fetching posts: ${error}`);
    res.status(500).send('Internal Server Error');
  }
});



// Action 4: Like, Dislike or Comment on a Post
router.post('/posts/:identifier/interact', loginMiddleware, async (req, res) => {
  const { identifier } = req.params;
  const { interaction, commentText } = req.body; 
  // for debug
  console.log('Received request body:', req.body); 
  
  try {
    const post = await Post.findById(identifier);
    const userId = req.user._id; 

    if (!post) {
      return res.status(404).send('Post not found.');
    }

    if (new Date() > new Date(post.expirationTime)) {
      return res.status(400).send('Post has expired.');
    }

    
    //Debug
    //console.log('User ID:', userId.toString());
    //console.log('Post Owner ID:', post.owner._id.toString());


    
    // Check if the user is trying to like their own post
    if (interaction === 'like' && post.owner._id.toString() === userId.toString()) {
      return res.status(400).json({ error: "Post owners cannot like their own post" });
    }

    if (interaction === 'like') {
      post.likes++;
    } else if (interaction === 'dislike') {
      post.dislikes++;
    } else if (interaction === 'comment') {
      if (!commentText) {
        return res.status(400).send('Comment text is required.');
      }
      console.log(`Comment added: ${commentText}`);
      post.comments.push({ user: userId, comment: commentText });
      await post.save();
      res.send(post);
      return;
    }

    await post.save();
    res.send(post);
  } catch (error) {
    console.error(`Error interacting with post: ${error}`);
    res.status(500).send('Internal Server Error');
  }
});






// Action 5: Browse for the Most Active Post per Topi
router.get('/posts/:topic/most-active',  loginMiddleware, async (req, res) => {
  const { topic } = req.params;
  const posts = await Post.find({ topic, status: 'Live' });
  const mostActivePost = posts.sort((a, b) => (b.likes + b.dislikes + b.comments.length) - (a.likes + a.dislikes + a.comments.length))[0];
  res.send(mostActivePost);
});


// Action 6: Browse the History Data of Expired Posts per Topic
router.get('/posts/:topic/expired',  loginMiddleware, async (req, res) => {
  const { topic } = req.params;
  const posts = await Post.find({ topic, status: 'Expired' });
  res.send(posts);
});

// Registration route
router.post('/register', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    console.log(`User registered: ${user.username}`);
    res.status(201).send(user);
  } catch (error) {
    console.log("Error during registration:", error.message);
    res.status(400).send(error);
  }
});


router.get('/protected-resource', loginMiddleware, async (req, res) => {
  // If the request reaches here, it means it's authenticated
  res.status(200).send({ message: 'You have accessed a protected resource!' });
});

module.exports = router;