const { Router } = require('express')
const multer = require('multer');
const { images_storage, imageFilter, getDbReference } = require('../lib/mongo')
const { validateAgainstSchema } = require('../lib/validation')
const { } = require('../models/users');

const router = Router()
const images_upload = multer({ storage: images_storage, fileFilter: imageFilter });



// Fetch the list of all Courses.
router.get('/courses', async (req, res, next) => {

    // declare database
    const db = getDbReference();

    // implement pagination

    // get number of records (courses)
    const coursesNumber = db.courses.countDocuments();

    /*
    * Compute page number based on optional query string parameter `page`.
    * Make sure page is within allowed bounds.
    */
    let page = parseInt(req.query.page) || 1;
    const numPerPage = 10;
    const lastPage = Math.ceil(coursesNumber / numPerPage);
    page = page > lastPage ? lastPage : page;
    page = page < 1 ? 1 : page;

    //
    const pageCourses = await db.courses.find();



})

// Create a new course.
router.post('/courses', async (req, res, next) => {

})

// Fetch data about a specific Course.
router.get('/courses/:id', async (req, res, next) => {

})

// Update data for a specific Course.
router.patch('/courses/:id', async (req, res, next) => {

})

// Remove a specific Course from the database.
router.delete('/courses/:id', async (req, res, next) => {

})

// Fetch a list of the students enrolled in the Course.
router.get('/courses/:id/students', async (req, res, next) => {

})

// Update enrollment for a Course.
router.post('/courses/:id/students', async (req, res, next) => {

})

// Fetch a CSV file containing list of the students enrolled in the Course.
router.get('/courses/:id/roster', async (req, res, next) => {

})

// Fetch a list of the Assignments for the Course.
router.get('/courses/:id/assignments', async (req, res, next) => {

})

module.exports = router 