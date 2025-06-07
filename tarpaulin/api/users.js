/*
 * API sub-router for User collection endpoints.
 */

const { Router } = require('express')
const { validateAgainstSchema } = require('../lib/validation')
const bcrypt = require('bcryptjs')
const { usersSchema, user_roles, getUserById, getUserByEmail } = require('../models/users');
const router = Router()

// Create a new User.
// Auth: Only an authenticated User with 'admin' role can create users with the 'admin' or 'instructor' roles.
router.post('/', async (req, res, next) => {
  if (!validateAgainstSchema(req.body, usersSchema)){
    return res.status(400).send({error: "Malformed Request"})
  }
  try {
    const user = await createNewUser(req.body)
    res.status(201).send({ id: user.id })
  } catch (e) {
    if (e instanceof ValidationError) {
      res.status(400).send({ error: e.message })
    } else {
      throw e
    }
  }
})

// Log in a User.
router.post('/login', async (req, res, next) => {
  if (!validateAgainstSchema(req.body, usersSchema)){
    return res.status(400).send({error: "Malformed Request"})
  }

  const user = await getUserByEmail(req.body.email);
  if (user) {
    if (await bcrypt.compare(req.body.password, user.password)){

      const payload = {
        sub: user.userId,
        user: user.email,
        role: user.role
      };

      const expiration = { expiresIn: "24h" };
      const user_token = jwt.sign(payload, process.env.JWT_SECRET_KEY, expiration);

      const response = {
        status: "ok",
        token: user_token,
        valid: "24h"
      }

      res.status(200);
      res.send(response);
      return;
    }
  } else {
    res.status(401);
    res.send("Invalid Credentials")
    return;
  }
})

// Fetch data about a specific User.
// AUTH: ONLY jwt id must match id param
router.get('/:id', async (req, res, next) => {
  const user = await getUserById(req.params.id)
  if (user){
    if (user.role == user_roles.student || user.role == user_roles.instructor){
      delete user._id
      return res.status(200).send(user)
    } else {
      return res.status(500).send({error: "Internal Server Error"})
    }
  } else {
    // 404 - user DNE
    return next();
  }
})

module.exports = router
