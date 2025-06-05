// boilerplate
const router = require('express').Router();

//require mongodb?

//grab mongo object (similar to mysql?)?

//export router?

//schema for validation? (I think we're not doing that correct?)

// Create a new Assignment.
router.post('/', async (req, res, next) => {})

// Fetch data about a specific Assignment.
router.get('/:id', async (req, res, next) => {})

// Update data for a specific Assignment.
router.patch('/:id', async (req, res, next) => {})

// Remove a specific Assignment from the database.
router.delete('/:id', async (req, res, next) => {})

// Fetch the list of all Submissions for an Assignment.
router.get('/:id/submissions', async (req, res, next) => {})

// create a new submission
router.post('/:id/submissions', async (req, res, next) => {})

