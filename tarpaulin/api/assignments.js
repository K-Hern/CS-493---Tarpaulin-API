/*
 * API sub-router for Assignment collection endpoints.
 */

const { Router } = require('express')
const multer = require('multer');
const { submissions_storage } = require('../lib/mongo')
const { assignmentsSchema, getAssignmentById, createNewAssignment, updateAssignment, deleteAssignmentById } = require('../models/assignments');
const { submissionSchema, deleteSubmission, getSubmissionDetailsById, getSubmissionDownloadStreamById, getAllSubmissionsByAssignmentId } = require('../models/submissions');
const { validateAgainstSchema } = require('../lib/validation');
const { requireAdmin, requireCourseAccess, requireAssignmentSubmissionAccess, requireAuth } = require('../lib/auth_middleware');

const router = Router()
const submission_upload = multer({ storage: submissions_storage});
const _500_obj = {error: "Internal Server Error"}
const _400_obj = {error: "Malformed Request"}

// Create a new Assignment.
// AUTH: Only an authenticated User with 'admin' role or an authenticated 'instructor'
// User whose ID matches the instructorId of the Course corresponding to the Assignment's
// courseId can create an Assignment.
router.post('/', requireAuth, async (req, res, next) => {
  if (!validateAgainstSchema(req.body, assignmentsSchema)){
    return res.status(400).send(_400_obj)
  }

  if (req.user.role !== 'admin') {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ error: "Instructor access required" })
    }
    
    const { getCourseDetailsById } = require('../models/courses')
    try {
      const course = await getCourseDetailsById(req.body.courseId)
      if (!course || course.instructorId !== req.user.id) {
        return res.status(403).json({ error: "Course access denied" })
      }
    } catch (err) {
      console.error("Course access check error:", err)
      return res.status(500).send(_500_obj)
    }
  }

  const id = await createNewAssignment(req.body)
  return (id) ? res.status(201).send({id: id}) : res.status(500).send(_500_obj)
})

// Fetch data about a specific Assignment.
// AUTH: Only authenticated users can view assignment details
router.get('/:id', requireAuth, async (req, res, next) => {
  const assignment = await getAssignmentById(req.params.id);
  if (assignment){
    res.status(200).send(assignment)
  } else {
    return next();
  }
})

// Update data for a specific Assignment.
// AUTH: Only an authenticated User with 'admin' role or an authenticated
// 'instructor' User whose ID matches the instructorId of the Course corresponding
// to the Assignment's courseId can update an Assignment.
router.patch('/:id', requireAuth, async (req, res, next) => {
  const assignment = await getAssignmentById(req.params.id)
  if (!assignment){
    return next();
  }

  // Check if user can update this assignment
  if (req.user.role !== 'admin') {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ error: "Instructor access required" })
    }
    
    const { getCourseDetailsById } = require('../models/courses')
    try {
      const course = await getCourseDetailsById(assignment.courseId)
      if (!course || course.instructorId !== req.user.id) {
        return res.status(403).json({ error: "Course access denied" })
      }
    } catch (err) {
      console.error("Course access check error:", err)
      return res.status(500).send(_500_obj)
    }
  }

  if (validateAgainstSchema(req.body, assignmentsSchema)){
    const result = await updateAssignment(req.params.id, req.body);
    return (result) ? res.status(200).send() : res.status(500).send(_500_obj) 
  } else {
    return res.status(400).send(_400_obj);
  }
})

// Remove a specific Assignment from the database.
// Completely removes the data for the specified Assignment, including all submissions
// AUTH: Only an authenticated User with 'admin' role or an authenticated 'instructor'
//  User whose ID matches the instructorId of the Course corresponding to the Assignment's
//  courseId can delete an Assignment.
router.delete('/:id', requireAuth, async (req, res, next) => {
  const assignment = await getAssignmentById(req.params.id)
  if (!assignment){
    return next();
  }

  if (req.user.role !== 'admin') {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ error: "Instructor access required" })
    }
    
    const { getCourseDetailsById } = require('../models/courses')
    try {
      const course = await getCourseDetailsById(assignment.courseId)
      if (!course || course.instructorId !== req.user.id) {
        return res.status(403).json({ error: "Course access denied" })
      }
    } catch (err) {
      console.error("Course access check error:", err)
      return res.status(500).send(_500_obj)
    }
  }

  const result = await deleteAssignmentById(req.params.id)
  return (result) ? res.status(204).send() : res.status(500).send(_500_obj)
})

// Fetch the list of all Submissions for an Assignment.
// AUTH: Only an authenticated User with 'admin' role or an authenticated
//  'instructor' User whose ID matches the instructorId of the Course corresponding
//   to the Assignment's courseId can fetch the Submissions for an Assignment
router.get('/:id/submissions', requireAuth, async (req, res, next) => {
  const assignment = await getAssignmentById(req.params.id)
  if (!assignment) {
    return next();
  }

  if (req.user.role !== 'admin') {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ error: "Instructor access required" })
    }
    
    const { getCourseDetailsById } = require('../models/courses')
    try {
      const course = await getCourseDetailsById(assignment.courseId)
      if (!course || course.instructorId !== req.user.id) {
        return res.status(403).json({ error: "Course access denied" })
      }
    } catch (err) {
      console.error("Course access check error:", err)
      return res.status(500).send(_500_obj)
    }
  }

  try {
    const submissions = await getAllSubmissionsByAssignmentId(req.params.id)
    const totalSubmissions = submissions ? submissions.length : 0

    let page = parseInt(req.query.page) || 1;
    const numPerPage = 10;
    const lastPage = Math.max(1, Math.ceil(totalSubmissions / numPerPage));
    page = page > lastPage ? lastPage : page;
    page = page < 1 ? 1 : page;

    const skip = (page - 1) * numPerPage;
    const paginatedSubmissions = submissions ? submissions.slice(skip, skip + numPerPage) : [];

    const submissionsList = []
    paginatedSubmissions.map((subObj)=>{
      if (subObj && subObj.metadata) {
        subObj.metadata.file = `assignments/history/${subObj._id}`
        submissionsList.push(subObj.metadata)
      }
    })

    return res.status(200).send({
      submissions: submissionsList,
      page: page,
      totalPages: lastPage,
      pageSize: numPerPage,
      totalCount: totalSubmissions
    });
  } catch (err) {
    console.error("Error fetching submissions:", err)
    return res.status(500).send(_500_obj)
  }
})

// create a new submission
// allows authorized student Users to upload a file submission for a specific assignment.
// AUTH: Only an authenticated User with 'student' role who is enrolled in the Course corresponding to the Assignment's courseId can create a Submission.
router.post('/:id/submissions', requireAssignmentSubmissionAccess, submission_upload.single('file'), async (req, res, next) => {
  // return download link along with the rest of the information about the Submission from the GET /assignments/{id}/submissions endpoint.
  if (req.file) {
    if (validateAgainstSchema(req.file.metadata, submissionSchema)){
      res.status(201).send({
        id: req.file.id,
        links: {
          download: `/assignments/history/${req.file.id}`,
          assignment: `/assignments/${req.body.assignmentId}`
        }
      })
    } else {
      // The request body was either not present or did not contain a valid Submission object.
      // File was alr uploaded by multer, must be deleted
      await deleteSubmission(file.id)
      res.status(400).send(_400_obj)
    }
  }
})

// download a submission file by id
// AUTH: must ensure the user requesting is the user this file belongs to
router.get('/history/:id', requireAuth, async (req, res, next) => {
  const file = await getSubmissionDetailsById(req.params.id)
  if (!file){
    return next();
  }

  if (req.user.role !== 'admin') {
    if (req.user.role === 'student' && file.metadata.studentId !== req.user.id) {
      return res.status(403).json({ error: "Cannot access other students' submissions" })
    }
    
    if (req.user.role === 'instructor') {
      const { getAssignmentById } = require('../models/assignments')
      const { getCourseDetailsById } = require('../models/courses')
      try {
        const assignment = await getAssignmentById(file.metadata.assignmentId)
        if (assignment) {
          const course = await getCourseDetailsById(assignment.courseId)
          if (!course || course.instructorId !== req.user.id) {
            return res.status(403).json({ error: "Cannot access submissions from courses you don't teach" })
          }
        } else {
          return res.status(404).json({ error: "Assignment not found" })
        }
      } catch (err) {
        console.error("File access check error:", err)
        return res.status(500).send(_500_obj)
      }
    }
  }

  res.type(file.contentType)
  res.status(200)
  const download_stream = await getSubmissionDownloadStreamById(req.params.id, 'images')
  download_stream.on('error', err => {res.status(400).send(`Error: ${err}`);});
  return download_stream.pipe(res);
})

module.exports = router