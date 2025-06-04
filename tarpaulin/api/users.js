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
router.post('/users', async (req, res, next) => {

})

// Log in a User.
router.post('/users/login', async (req, res, next) => {

})  

// Fetch data about a specific User.
router.get('/users/:id', async (req, res, next) => {

})

module.exports = router
