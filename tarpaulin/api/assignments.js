// boilerplate
const router = require('express').Router();

//require mongodb?

//grab mongo object (similar to mysql?)?

//export router?

//schema for validation? (I think we're not doing that correct?)

// Create a new Assignment.
router.post('/assignments', async (req, res, next) => {})


// Fetch data about a specific Assignment.
router.get('/assignments/:id', async (req, res, next) => {})


// Update data for a specific Assignment.
router.patch('/assignments/:id', async (req, res, next) => {})


// Remove a specific Assignment from the database.
router.delete('/assignments/:id', async (req, res, next) => {})


// Fetch the list of all Submissions for an Assignment.
router.get('/assignments/:id/submissions', async (req, res, next) => {})

// 
router.post('/assignments/:id/submissions', async (req, res, next) => {})

