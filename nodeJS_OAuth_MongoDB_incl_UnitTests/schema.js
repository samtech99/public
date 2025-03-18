const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

const User = mongoose.model('User', userSchema);


const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to the User model
    comment: String,
    date: { type: Date, default: Date.now }
});


const postSchema = new mongoose.Schema({
    identifier: { type: String, required: true },
    title: { type: String, required: true },
    topic: [{ type: String, enum: ['Politics', 'Health', 'Sport', 'Tech'] }],
    timestamp: { type: Date, default: Date.now },
    body: { type: String, required: true },
    expirationTime: Date,
    status: { type: String, enum: ['Live', 'Expired'], default: 'Live' },
    owner: userSchema,
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    comments: [commentSchema]
});

const Post = mongoose.model('Post', postSchema);

module.exports = { User, Post };