'use strict';

const { sequelize, User, Course } = require('./models');
const express = require('express');
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');

// Construct a router instance.
const router = express.Router();

const itemRouter = express.Router({mergeParams: true});
router.use('/:userId/items', itemRouter);


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
        fullName: `${user.firstName} ${user.lastName}`,
        id: user.id
    });
  });

// Create a new user ~ 
// Remember that app.use(express.json()); must be included in app.js for this to work!
router.post('/users', asyncHandler(async(req, res) => {
    let user;
    try {
        user = req.body;
        user.password = bcryptjs.hashSync(user.password);
        user = await User.create(req.body);
        return res.status(201).end();
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            user = await User.build(req.body);
            res.status(400).json(error.message)
        } else {
            throw error
            // return res.status(404).json({message: "Please make a password"}); // error caught in the asyncHandler's catch block 
        }
    }
    
}));

// Returns a list of courses
router.get('/courses', asyncHandler( async(req, res, next) => {
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
router.get('/courses/:id', asyncHandler(async (req, res, next) => {
    const course = await Course.findByPk(
        req.params.id,
        {
            include: [{
                model: User,
                attributes: ['firstName', 'lastName', 'emailAddress', 'id']
            }]
        }
    )
    console.log(course)
    if (course) {
        res.status(200).json(course)
    } else {
        const error = new Error("Uh-oh! That course does not exist")
        error.status = 404
        next(error)
    }
}));

// Creates a course, sets the Location header to the URI for the course, and returns no content
router.post('/courses', asyncHandler(async (req, res, next) => {
    let course;
    try {
        let course = await Course.create(req.body);
        console.log("success, new course")
        return res.status(201).end();
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            course = await Course.build(req.body)
            res.status(400).json(error)
        } else {
            // print the error details
            console.log(error, req.body)
            throw error
        }
    }
}))

// PUT /api/courses/:id 204 - Updates a course and returns no content
router.put('/courses/:id', asyncHandler(async (req, res, next) => {
    let course = await Course.findByPk(req.params.id)
    // let user = req.currentUser
    // console.log(user)
    // console.log(JSON.stringify(course, null, 2));
    // console.log(course.userId)
    try {
        if (course) {
            course.update(req.body)
            return res.status(204).end();
        } else {
            const error = new Error('Uh-oh! That course doesn\'t exist !' )
            error.status = 404
            next(error)
        }
    } catch (error) {
        if (error === 'SequelizeValidationError') {
            course = await Course.build(req.body)
            res.status(400).json(error.message)
        } else {
            console.log(error)
            // throw error
        }
    }
}));

// DELETE /api/courses/:id 204 - Deletes a course and returns no content
router.delete('/courses/:id', asyncHandler(async (req, res, next) => {
    console.log(req.params.id)
    const course = await Course.findByPk(req.params.id)
    if (course) {
        console.log(course)
        await course.destroy()
        return res.status(204).end();
    } else {
        res.status(404);
    }
}))


module.exports = router;
