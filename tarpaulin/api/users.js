/*
 * API sub-router for businesses collection endpoints.
 */

const { Router } = require('express')
const { validateAgainstSchema } = require('../lib/validation')
const bcrypt = require('bcryptjs')
const { usersSchema } = require('../models/users');
const router = Router()

// Create a new User.
router.post('/', async (req, res, next) => {
  if (!validateAgainstSchema(req.body, usersSchema)){
    return res.status(400).send({error: "invalid user fields"})
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
  const user = await getUser(req.body.email);
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
  }
  
  res.status(401);
  res.send("Invalid Credentials")
  return;
})

// Fetch data about a specific User.
router.get('/:id', async (req, res, next) => {
  const user = await getUser(req.user.email);
  if (user) {
    const userObj = user.toJSON();
    delete userObj.password;
    res.status(200);
    res.send(userObj);
  } else {
    next()
  }
})

module.exports = router
