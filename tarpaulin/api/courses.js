const { Router } = require('express')
const multer = require('multer');
const { images_storage, imageFilter, getDbReference } = require('../lib/mongo')
const { validateAgainstSchema } = require('../lib/validation')
const { } = require('../models/users');

const router = Router()
const images_upload = multer({ storage: images_storage, fileFilter: imageFilter });



// Fetch the list of all Courses.
router.get('/', async (req, res, next) => {

    // declare database, init collection
    const db = getDbReference();
    const collection = db.collection("courses");

    // implement pagination
    // get number of records (courses)
    const coursesNumber = await collection.countDocuments();

    /*
    * Compute page number based on optional query string parameter `page`.
    * Make sure page is within allowed bounds.
    */
    let page = parseInt(req.query.page) || 1;
    const numPerPage = 10;
    const lastPage = Math.ceil(coursesNumber / numPerPage);
    page = page > lastPage ? lastPage : page;
    page = page < 1 ? 1 : page;

    // compute skip limit for MongoDB
    const skip = (page - 1) * numPerPage;

    // Get records from MongoDB
    const pageCourses = await collection.find()
    .skip(skip)
    .limit(numPerPage)
    .toArray();


})

// Create a new course.
router.post('/', async (req, res, next) => {

})

// Fetch data about a specific Course.
router.get('/:id', async (req, res, next) => {

})

// Update data for a specific Course.
router.patch('/:id', async (req, res, next) => {

})

// Remove a specific Course from the database.
router.delete('/:id', async (req, res, next) => {

})

// Fetch a list of the students enrolled in the Course.
router.get('/:id/students', async (req, res, next) => {

})

// Update enrollment for a Course.
router.post('/:id/students', async (req, res, next) => {

})

// Fetch a CSV file containing list of the students enrolled in the Course.
router.get('/:id/roster', async (req, res, next) => {

})

// Fetch a list of the Assignments for the Course.
router.get('/:id/assignments', async (req, res, next) => {

})

module.exports = router 