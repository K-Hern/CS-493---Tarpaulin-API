const { ObjectId } = require('mongodb')
const { getDbReference, getSubmissionsBucket, submissionsMetadataCollection} = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

/*
 * Schema describing required/optional fields of a submission object.
 */
const submissionSchema = {
  assignmentId: { required: true },
  studentId: { required: true },
  timestamp: { required: true },
  grade: { required: true },
  file: { required: false }
}
exports.submissionSchema = submissionSchema

/*
 * Executes a DB query to delete a photo (both image and thumb) from the DB (
 both chunk and file)
 */
async function deleteSubmission(id) {
  const bucket = getSubmissionsBucket();
  // Must be the _id obj id
  await bucket.delete(new ObjectId(id));
  return
}
exports.deleteSubmission = deleteSubmission

/*
 * Deletes all files from the Submissions GridFS bucket with a metadata field 'assignmentId' matching the given argument.
 * Returns a boolean denoting success or failure
 */
async function deleteAllSubmissionsByAssignmentId(assignmentId) {
  const db = getDbReference();
  const bucket = getSubmissionsBucket();
  let success_count = 0

  const submissionFiles = await db.collection(submissionsMetadataCollection).find({ 'metadata.assignmentId': assignmentId }).toArray();
  for (const file of submissionFiles) {
    try {
      await bucket.delete(file._id);
      success_count++;
    } catch (err) {
      console.log(`Failed to delete file: ${file._id}`)
    }
  }

  return (success_count == submissionFiles.length)
}
exports.deleteAllSubmissionsByAssignmentId = deleteAllSubmissionsByAssignmentId

/*
 * Retrieves all files from the Submissions GridFS bucket with a metadata field 'assignmentId' matching the given argument.
 */
async function getAllSubmissionsByAssignmentId(assignmentId) {
  const db = getDbReference();
  const submissionFiles = await db.collection(submissionsMetadataCollection).find({ 'metadata.assignmentId': assignmentId }).toArray();
  return submissionFiles
}
exports.getAllSubmissionsByAssignmentId = getAllSubmissionsByAssignmentId


/*
 * Executes a DB query to fetch a single specified photo's data based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * photo.
 */
async function getSubmissionDetailsById(id) {
  const db = getDbReference();
  const file = await db.collection(submissionsMetadataCollection).findOne({ _id: new ObjectId(id) });
  return file;
}
exports.getSubmissionDetailsById = getSubmissionDetailsById

/*
 * Executes a DB query to fetch a single specified submission's data based on its ID.
 * Returns a Promise that resolves to an object containing the requested file.
 */
async function getSubmissionDownloadStreamById(id) {
  const bucket = getSubmissionsBucket();
  const download_stream = bucket.openDownloadStream(new ObjectId(id));
  return download_stream; 
}

exports.getSubmissionDownloadStreamById = getSubmissionDownloadStreamById