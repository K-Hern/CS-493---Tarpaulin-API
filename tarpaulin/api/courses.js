/*
 * API sub-router for Courses collection endpoints.
 */
const { Router } = require('express')
const { getDbReference } = require('../lib/mongo')
const { validateAgainstSchema, extractValidFields } = require('../lib/validation')
const { } = require('../models/users');
const { deleteCourseById, coursesSchema, getCourseDetailsById, updateCourse, getRosterById, createCourse } = require('../models/courses');
const { deleteAllAssignmentsByCourseId, getAllAssignmentsByCourseId } = require('../models/assignments');
const { requireAdmin, requireCourseAccess } = require('../lib/auth_middleware');
const _500_obj = {error: "Internal Server Error"}
const _400_obj = {error: "Malformed Request"}
const _404_obj = {error: "Not Found"}

const { Parser } = require('json2csv');


const router = Router()

// Fetch the list of all Courses.
router.get('/', async (req, res, next) => {
    // allows users to see information about all Courses
    // not return information about a Course's enrolled students or its Assignments

    // declare database, init collection
    const db = getDbReference();
    const collection = db.collection("courses");

    const filter = {};
    if (req.query.subject) {
        filter.subject = req.query.subject;
    }
    if (req.query.number) {
        filter.number = req.query.number;
    }
    if (req.query.term) {
        filter.term = req.query.term;
    }

    const coursesNumber = await collection.countDocuments(filter);

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

    // Get records from MongoDB with filter
    const pageCourses = await collection.find(filter)
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
router.post('/', requireAdmin, async (req, res, next) => {

    //validate against schema
    if (validateAgainstSchema(req.body, coursesSchema)) {

        //extract fields
        const course = extractValidFields(req.body, coursesSchema);

        //call function to insert into database
        const courseId = await createCourse(course)
        if (courseId) {
            res.status(201).json({ id: courseId })
        } else {
            res.status(500).json({ error: "Failed to create course" })
        }

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

    if (course) {
        res.status(200).send(course);
    } else {
        return next();
    }
});

// Update data for a specific Course.
// Auth: Only an authenticated User with 'admin'
//  role or an authenticated 'instructor' User whose
//  ID matches the instructorId of the Course can update
//  Course information.
router.patch('/:id', requireCourseAccess, async (req, res, next) => {
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
router.delete('/:id', requireAdmin, async (req, res, next) => {
  if (await getCourseDetailsById(req.params.id)){
    await deleteAllAssignmentsByCourseId(req.params.id)
    await deleteCourseById(req.params.id)
    return res.status(204).send();
  } else {
    return next();
  }
})

// Fetch a list of the students enrolled in the Course.
// AUTH:  Only an authenticated User with 'admin' role or
//  an authenticated 'instructor' User whose ID matches the
//  instructorId of the Course can fetch the list of enrolled students.
router.get('/:id/students', requireCourseAccess, async (req, res, next) => {
  const course = await getCourseDetailsById(req.params.id);
  if (course){
    res.status(200).send(course.students)
  } else {
    return next();
  }
})

// Update enrollment for a Course.
// AUTH: Only admin or course instructor can update enrollment
router.post('/:id/students', requireCourseAccess, async (req, res, next) => {
  const course = await getCourseDetailsById(req.params.id);
  if (!course){
    return next();
  }

  if (req.body.add || req.body.remove){
    let result = course.students || [];
    if (req.body.remove){
      const toRemove = new Set(req.body.remove);
      result = result.filter(indStud => !toRemove.has(indStud));
    }
    if (req.body.add){
      const uniqueNewStudents = req.body.add.filter(newStud => !result.includes(newStud));
      result = result.concat(uniqueNewStudents);
    }
    
    try {
      await updateCourse(req.params.id, {students: result});
      res.status(200).send();
    } catch (err) {
      console.error("Error updating course enrollment:", err);
      res.status(500).send(_500_obj);
    }
  } else {
    res.status(400).send(_400_obj);
  }
})

// Fetch a CSV file containing list of the students enrolled in the Course.
router.get('/:id/roster', requireCourseAccess, async (req, res, next) => {
  const courseId = parseInt(req.params.id);

  const roster = await getRosterById(courseId);

  if (!roster) {
    res.status(404).send(_404_obj);
    return;
  }

  const fields = [
    { label: 'id', value: 'id', quote: false }, //keeping ids as ints because our ids are ints and don't have characters
    { label: 'name', value: 'name', quote: true },  
    { label: 'email', value: 'email', quote: true }
  ];
  
  const parser = new Parser({ fields, header: false });  
  const csv = parser.parse(roster);
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=course-${courseId}-roster.csv`);
  res.status(200).send(csv);
  return;

})

// Fetch a list of assignments for the Course
router.get('/:id/assignments', requireCourseAccess, async (req, res, next) => {
  const assignmentsList = await getAllAssignmentsByCourseId(req.params.id)
  if (assignmentsList.length > 0){
    const assignmentIds = []
    assignmentsList.map((assObj)=>assignmentIds.push(`/assignments/${assObj._id}`))
    return res.status(200).send({assignments: assignmentIds})
  } else {
    return next();
  }
})

module.exports = router 