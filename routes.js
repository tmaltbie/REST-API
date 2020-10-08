'use strict';

const { sequelize, User, Course } = require('./models');
const express = require('express');
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');

// Construct a router instance.
const router = express.Router();

// custome authenticateUser middleware
const authenticateUser = async(req, res, next) => {
    let message = null;

    // Parse the user's credentials from the Authorization header.
    const credentials = auth(req)
    console.log(credentials)

    let debugUser = await User.findOne({ where: {
        emailAddress: credentials.name
    }})
    console.log("debugUser:", debugUser.emailAddress)
    console.log("debugUserPass:", debugUser.password)

    let user = await User.findOne({ where: {
        emailAddress: credentials.name,
        password: credentials.pass
    }})

    // If a user was successfully retrieved from the data store...
    if (credentials) {
        if (user) {
            const authenticated = bcryptjs
                .compareSync(credentials.pass, user.password);
            if (authenticated) {
                console.log(`Authentication successful for user: ${user.emailAddress}`);
                req.currentUser = user;
                
            } else {
                message = `Authentication failure for user: ${user.emailAddress}`;
            }
        } else {
            message = `User not found for user:: ${credentials.emailAddress}`;
        }
    } else {
        message = 'Auth header not found';
    }

    // If user authenticaion failed...
    if (message) {
        console.warn(message)
        res.status(401).json({ message: 'Access Denied '});
    } else {
        next();
    }
};

// Returns the currently authenticated user
router.get('/users',  authenticateUser, (req, res) => {
    const user = req.currentUser;

    res.status(200).json({
        login: user.emailAddress,
        name: user.firstName
    });
  });

router.get('/courses', async (req, res) => {
    const courses = await Course.findAll();
    res.json(courses);
  });

module.exports = router;
