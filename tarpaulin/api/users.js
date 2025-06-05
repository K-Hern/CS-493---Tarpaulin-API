/*
 * API sub-router for businesses collection endpoints.
 */

const { Router } = require('express')
const multer = require('multer');
const { images_storage, imageFilter } = require('../lib/mongo')
const { validateAgainstSchema } = require('../lib/validation')
const { } = require('../models/users');

const router = Router()
const images_upload = multer({ storage: images_storage, fileFilter: imageFilter });

// Create a new User.
router.post('/', async (req, res, next) => {
  // Select fields before entry to deter auth elevations
  const new_user = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password
  }

  try {
    const user = await User.create(new_user, UserClientFields)
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

})  

// Fetch data about a specific User.
router.get('/:id', async (req, res, next) => {

})

module.exports = router
