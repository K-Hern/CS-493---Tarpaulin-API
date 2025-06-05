// boilerplate
const { Router } = require('express')
const router = Router()

// Create a new Assignment.
router.post('/', async (req, res, next) => {console.log("hjgqwd")})

// Fetch data about a specific Assignment.
router.get('/:id', async (req, res, next) => {console.log("hjgqwd")})

// Update data for a specific Assignment.
router.patch('/:id', async (req, res, next) => {console.log("hjgqwd")})

// Remove a specific Assignment from the database.
router.delete('/:id', async (req, res, next) => {console.log("hjgqwd")})

// Fetch the list of all Submissions for an Assignment.
router.get('/:id/submissions', async (req, res, next) => {console.log("hjgqwd")})

// create a new submission
router.post('/:id/submissions', async (req, res, next) => {console.log("hjgqwd")})

module.exports = router