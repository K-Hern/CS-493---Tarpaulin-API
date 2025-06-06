const { Router } = require('express')
const { getDbReference } = require('../lib/mongo')
const { validateAgainstSchema } = require('../lib/validation')
const { } = require('../models/users');
const { deleteCourseByID, coursesSchema, getCourseDetailsById, updateCourse } = require('../models/courses');
const _500_obj = {error: "Internal Server Error"}
const _400_obj = {error: "Malformed Request"}

const router = Router()

// Fetch the list of all Courses.
router.get('/', async (req, res, next) => {
    // allows users to see information about all Courses
    // not return information about a Course's enrolled students or its Assignments

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

    // Send response
    res.status(200).json({
        courses: pageCourses,
        page: page,
        totalPages: lastPage,
        pageSize: numPerPage,
        totalCount: coursesNumber
    });
})

// Create a new course.
router.post('/', async (req, res, next) => {

    //validate against schema
    if (validateAgainstSchema(req.body, coursesSchema)) {

        //extract fields
        const course = extractValidFields(req.body, coursesSchema);

        //call function to insert into database
        insertNewCourse(course)

    } else {
        res.status(400).json({
            error: "Request body is not a valid course object"
        });
    }
})

// Fetch data about a specific Course.
router.get('/:id', async (req, res, next) => {
    // not return information about a Course's enrolled students or its Assignments

    // grab courseid from params
    const courseid = parseInt(req.params.id);

    // call function to grab course by id
    course = await getCourseDetailsById(courseid);

    //return course
    res.status(200).send(course);
});

// Update data for a specific Course.
// Auth: Only an authenticated User with 'admin'
//  role or an authenticated 'instructor' User whose
//  ID matches the instructorId of the Course can update
//  Course information.
router.patch('/:id', async (req, res, next) => {
  if (await getCourseDetailsById(req.params.id)){
    if (validateAgainstSchema(req.body, coursesSchema)){
      (await updateCourse(req.params.id, req.body)) ? 
      res.status(200).send()
      : 
      res.status(500).send(_500_obj)
    } else {
      return res.status(400).send(_400_obj)
    }
  } else {
    return next()
  }

})

// Remove a specific Course from the database.
// AUTH: Only an authenticated User with 'admin' role can remove a Course
router.delete('/:id', async (req, res, next) => {
  if (await getCourseDetailsById(req.params.id)){
    await deleteAllAssignmentsByCourseId(req.params.id)
    return res.status(204).send();
  } else {
    return next();
  }
})

// Fetch a list of the students enrolled in the Course.
// AUTH:  Only an authenticated User with 'admin' role or
//  an authenticated 'instructor' User whose ID matches the
//  instructorId of the Course can fetch the list of enrolled students.
router.get('/:id/students', async (req, res, next) => {
  const course = await getCourseDetailsById(req.params.id);
  if (course){
    res.status(200).send(course.students)
  } else {
    return next();
  }
})

// Update enrollment for a Course.
router.post('/:id/students', async (req, res, next) => {
  const course = await getCourseDetailsById(req.params.id);
  if (course){
    if (req.body.add || req.body.remove){
      let result = course.students;
      if (req.body.remove){
        const toRemove = new Set(req.body.remove);
        result = course.students.filter(indStud => !toRemove.has(indStud));
      }
      if (req.body.add){
        req.body.add.map((newStud)=>result.push(newStud))
      }
      updateCourse(course.id, {students: result})
    } else {
      res.status(400).send(_400_obj)
    }
  } else {
    return next();
  }
})

// Fetch a CSV file containing list of the students enrolled in the Course.
router.get('/:id/roster', async (req, res, next) => {

})

// Fetch a list of the Assignments for the Course.
router.get('/:id/assignments', async (req, res, next) => {
  const assignmentsList = getAllAssignmentsByCourseId(req.params.id)
  if (assignmentsList.length > 0){
    const assignmentIds = []
    assignmentsList.map((assObj)=>assignmentIds.push(`/assignments/${assObj._id}`))
    return res.status(200).send({assignments: assignmentIds})
  } else {
    return next();
  }
})

module.exports = router 