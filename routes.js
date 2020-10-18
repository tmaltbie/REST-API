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

// Create a new user ~ Remember => app.use(express.json());
router.post('/users', asyncHandler(async(req, res) => {
    try {
        const user = req.body;
        user.password = bcryptjs.hashSync(user.password);
        await User.create(req.body);
        res.location('/')
        return res.status(201).end();
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            await User.build(req.body);
            res.status(400).json(error.message)
        } else if (error.name === 'SequelizeUniqueConstraintError') {
            await User.build(req.body);
            res.status(400).json(error.message)
        } else {
            console.error(error) // error caught in the asyncHandler's catch block
            res.json(error.message)
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
        {
            attributes: { exclude: [ 'createdAt', 'updatedAt'] },
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
router.post('/courses', authenticateUser, asyncHandler(async (req, res, next) => {
    let course;
    try {
        // if ((req.body.title == undefined) || (req.body.description == undefined)) {
        //     return res.status(400).json({ error: 'The course must include a title and description' })
        // }
        if (req.currentUser.id != 0) { // validate there user by check for an id #
            course = await Course.create(req.body);
            res.location(`/courses/${course.id}`)
            return res.status(201).end();
        } else {
            return res.status(403).end();
        }
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            course = await Course.build(req.body)
            res.status(400).json(error.message)
        } else {
            res.status(403).json(error.message)
        }
    }
}))

// PUT Updates a course and returns no content
router.put('/courses/:id', authenticateUser, asyncHandler(async (req, res, next) => {
    const course = await Course.findByPk(req.params.id)
    try {
        if ((course) && (course.userId === req.currentUser.id)) { // check for course && that it belongs to current user
            if ((req.body.title != undefined) || (req.body.description != undefined)) { // check title & desc aren't empty
                course.update(req.body)
                return res.status(204).end();
            } else {
                let e = new Error('The course must include a title and description');
                e.status = 400
                throw e
                // return res.status(400).json(e.message)
            }
        } else {
            return res.status(403).end();
        }
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            course = await Course.build(req.body);
            res.status(400).json(error.message);
        } else {
            res.status(403).json(error.message)
        }
    }
}));

// DELETE a course and returns no content
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res, next) => {
    const course = await Course.findByPk(req.params.id);
    if (course){
        if (course.userId === req.currentUser.id) {
            await course.destroy();
            return res.status(204).end();
        } else {
            res.status(403).end()
        }
    } else {
        const error = new Error('Uh-oh! That course doesn\'t exist !' )
        error.status = 404
        next(error)
    }
}));

module.exports = router;
