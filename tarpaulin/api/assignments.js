/*
 * API sub-router for Assignment collection endpoints.
 */

const { Router } = require('express')
const multer = require('multer');
const { submissions_storage } = require('../lib/mongo')
const { getSubmissionDetailsById, getSubmissionDownloadStreamById, assignmentsSchema, getAssignmentById } = require('../models/assignments');
const { submissionSchema } = require('../models/submissions');
const { validateAgainstSchema } = require('../lib/validation');

const router = Router()
const submission_upload = multer({ storage: submissions_storage});
const _500_obj = {error: "Internal Server Error"}
const _400_obj = {error: "Malformed Request"}

// Create a new Assignment.
// AUTH: Only an authenticated User with 'admin' role or an authenticated 'instructor'
// User whose ID matches the instructorId of the Course corresponding to the Assignment's
// courseId can create an Assignment.
router.post('/', async (req, res, next) => {
  if (validateAgainstSchema(req.body, assignmentsSchema)){
    const id = await createNewAssignment(req.body)
    return (id) ? res.status(201).send({id: id}) : res.status(500).send(_500_obj)
  } else {
    res.status(400).send(_400_obj)
  }
})

// Fetch data about a specific Assignment.
router.get('/:id', async (req, res, next) => {
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
router.patch('/:id', async (req, res, next) => {
  if (! await getAssignmentById(req.params.id)){
    // assignment DNE - 404
    return next();
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
router.delete('/:id', async (req, res, next) => {
  if (await getAssignmentById(req.params.id)){
    const result = await deleteAssignmentById(req.params.id)
    return (result) ? res.status(204).send() : res.status(500).send(_500_obj)
  } else {
    return next();
  }
})

// Fetch the list of all Submissions for an Assignment.
// AUTH: Only an authenticated User with 'admin' role or an authenticated
//  'instructor' User whose ID matches the instructorId of the Course corresponding
//   to the Assignment's courseId can fetch the Submissions for an Assignment
router.get('/:id/submissions', async (req, res, next) => {
  if (await getAssignmentById(req.params.id)) {
    // **************** Must still be paginated *****************
    const submissionsList = []
    const submissions = await getAllSubmissionsByAssignmentId(req.params.id)
    submissions.map((subObj)=>{
      subObj.metadata.file = `assignments/history/${subObj._id}`
      submissionsList.push(subObj.metadata)
    })

    return res.status(200).send({submission: submissionsList});
  } else {
    return next();
  }
})

// create a new submission
// allows authorized student Users to upload a file submission for a specific assignment.
// AUTH: Only an authenticated User with 'student' role who is enrolled in the Course corresponding to the Assignment's courseId can create a Submission.
router.post('/:id/submissions', submission_upload.single('file'), async (req, res, next) => {
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
    // OR auth ERROR: res.status(403).send({error: "string"})
})

// download a submission file by id
// AUTH: must ensure the user requesting is the user this file belongs to
router.get('/history/:id', async (req, res, next) => {
  const file = await getSubmissionDetailsById(req.params.id)
  if (file){
    res.type(file.contentType)
    res.status(200)
    const download_stream = await getSubmissionDownloadStreamById(req.params.id, 'images')
    download_stream.on('error', err => {res.status(400).send(`Error: ${err}`);});
    return download_stream.pipe(res);
  } else {
    // DNE - 404
    return next();
  } 

})

module.exports = router