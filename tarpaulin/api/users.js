/*
 * API sub-router for User collection endpoints.
 */

const { Router } = require('express')
const { validateAgainstSchema } = require('../lib/validation')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { usersSchema, loginSchema, user_roles, getUserById, getUserByEmail, createNewUser } = require('../models/users');
const { requireAdmin, requireSelfOrAdmin } = require('../lib/auth_middleware');
const { findAllCoursesByCondition } = require('../models/courses');
const router = Router()

// Create a new User
// Auth: Only an authenticated User with 'admin' role can create users with the 'admin' or 'instructor' roles.
router.post('/', requireAdmin, async (req, res, next) => {
  if (!validateAgainstSchema(req.body, usersSchema)){
    return res.status(400).send({error: "Malformed Request"})
  }
  try {
    const user = await createNewUser(req.body)
    res.status(201).send({ id: user })
  } catch (e) {
    console.error("Error creating user:", e)
    res.status(500).send({ error: "Internal server error" })
  }
})

// Log in a User
router.post('/login', async (req, res, next) => {
  if (!validateAgainstSchema(req.body, loginSchema)){
    return res.status(400).send({error: "Malformed Request"})
  }

  const user = await getUserByEmail(req.body.email);
  if (user && await bcrypt.compare(req.body.password, user.password)) {
    const payload = {
      sub: user._id,
      user: user.email,
      role: user.role
    };

    const expiration = { expiresIn: "24h" };
    const user_token = jwt.sign(payload, process.env.JWT_SECRET_KEY, expiration);

    const response = {
      token: user_token
    }

    res.status(200).send(response);
  } else {
    res.status(401).send({ error: "Invalid credentials" });
  }
})

// Fetch data about a specific User
router.get('/:id', requireSelfOrAdmin, async (req, res, next) => {
  const user = await getUserById(req.params.id)
  if (user){
    if (user.role == user_roles.student || user.role == user_roles.instructor){
      let courses = []
      try {
        if (user.role === user_roles.student) {
          const allCourses = await findAllCoursesByCondition({})
          courses = allCourses
            .filter(course => course.students && course.students.includes(user._id))
            .map(course => course._id)
        } else if (user.role === user_roles.instructor) {
          const instructorCourses = await findAllCoursesByCondition({ instructorId: user._id })
          courses = instructorCourses.map(course => course._id)
        }
      } catch (err) {
        console.error("Error fetching user courses:", err)
      }

      const userResponse = {
        name: user.name,
        email: user.email,
        role: user.role,
        courses: courses
      }

      return res.status(200).send(userResponse)
    } else {
      return res.status(500).send({error: "Internal Server Error"})
    }
  } else {
    return next();
  }
})

module.exports = router
