'use strict';

const { User, Course } = require('./models');
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

//const userExcludedContent = {attributes: { exclude: [ 'password', 'createdAt', 'updatedAt'] }}
const courseExcludedContent = {attributes: { exclude: [ 'createdAt', 'updatedAt'] }}

// Returns the currently authenticated user
router.get('/users', authenticateUser, (req, res, next) => {
    const user = req.currentUser;
    res.status(200).json({
        login: user.emailAddress,
        forename: user.firstName,
        surname: user.lastName,
        id: user.id
    });
  });

// Create a new user ~ Remember that app.use(express.json());
router.post('/users', asyncHandler(async(req, res) => {
    let user;
    try {
        user = req.body;
        user.password = bcryptjs.hashSync(user.password);
        user = await User.create(req.body);
        res.location('/')
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
    const courses = await Course.findAll({
        attributes: { exclude: [ 'createdAt', 'updatedAt'] },
        include: [{ // `include` takes an ARRAY
            model: User,
            attributes: ['firstName', 'lastName', 'emailAddress']
        }]
    });
    res.status(200).json(courses);
}));

// Returns the courses (w/owner) for the provided course ID
router.get('/courses/:id', asyncHandler(async (req, res, next) => {
    const course = await Course.findByPk(
        req.params.id,
        courseExcludedContent,
        {
            include: [{
                model: User,
                attributes: ['firstName', 'lastName', 'emailAddress', 'id']
            }]
        })
    if (course) {
        res.status(200).json(course)
    } else {
        const error = new Error("Uh-oh! That course does not exist")
        error.status = 404
        next(error)
    }
}));

// Creates a course, sets the Location header to the URI for the course
router.post('/courses', asyncHandler(async (req, res, next) => {
    try {
        const course = await Course.create(req.body);
        res.location(`/courses/${course.id}`)
        return res.status(201).end();
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            course = await Course.build(req.body)
            res.status(400).json(error)
        } else {
            res.status(403).json(error)
        }
    }
}))

// PUT Updates a course and returns no content
router.put('/courses/:id', authenticateUser, asyncHandler(async (req, res, next) => {
    const course = await Course.findByPk(req.params.id)
    try {
        if(course){
            if (course.id === req.currentUser.id) {
                course.update(req.body)
                return res.status(204).end();
            } else {
                return res.status(403).end();
            }
        } else {
            const error = new Error('Uh-oh! That course doesn\'t exist !' )
            error.status = 404
            next(error)
        }
    } catch (error) {
        if (error === 'SequelizeValidationError') {
            course = await Course.build(req.body);
            res.status(400).json(error.message);
        } else {
            throw error;
        }
    }
}));

// DELETE a course and returns no content
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res, next) => {
    const course = await Course.findByPk(req.params.id);
    if (course.id === req.currentUser.id) {
        await course.destroy();
        return res.status(204).end();
    } else {
        res.status(403).end()
    }
}));

module.exports = router;
