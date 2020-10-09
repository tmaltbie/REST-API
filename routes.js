'use strict';

const { sequelize, User, Course } = require('./models');
const express = require('express');
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');

// Construct a router instance.
const router = express.Router();

/* Handler function wrap for necessary routes. */
/* middleware for async abstraction: https://teamtreehouse.com/library/create-entries */
function asyncHandler(cb){
    return async(req, res, next) => {
      try {
        await cb(req, res, next)
      } catch(error){
        console.error(error)
        res.status(500).send(error)
      }
    }
  }

// custome authenticateUser middleware
const authenticateUser = async(req, res, next) => {
    let message = null;

    // Parse the user's credentials from the Authorization header.
    const credentials = auth(req)
    // console.log(credentials)

    // If a user was successfully retrieved from the data store...
    if (credentials) {
        const user = await User.findOne({ where: { emailAddress: credentials.name }})
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
        fullName: `${user.firstName} ${user.lastName}`
    });
  });

// Create a new user ~ 
// Remember that app.use(express.json()); must be included in app.js for this to work!
router.post('/users', asyncHandler(async(req, res) => {
    let user = req.body;
    user.password = bcryptjs.hashSync(user.password);
    user = await User.create(req.body);
    return res.status(201).end();
}));

// Returns a list of courses
router.get('/courses', asyncHandler( async(req, res) => {
    // const Users = await User.findAll()
    const courses = await Course.findAll({
        include: [{ // `include` takes an ARRAY
            model: User,      
            attributes: ['firstName', 'lastName', 'emailAddress'],
        }]
    });
    res.status(200).json(courses);
  }));

// Returns the courses (w/owner) for the provided course ID
router.get('/courses/:id', asyncHandler(async (req, res) => {
    const course = await Course.findByPk(
        req.params.id,
        {
            include: [{
                model: User,
                attributes: ['firstName', 'lastName', 'emailAddress']
            }]
        }
    )
    if (course) {
        res.status(200).json(course)
    } else {
        const error = new Error("Uh-oh! That course does not exist")
        error.status = 404
        next(error)
    }
}));

module.exports = router;
