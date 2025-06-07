const { ObjectId } = require('mongodb')
const { getDbReference, getSubmissionsBucket, submissionsMetadataCollection} = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')
const { getNextSequenceValue } = require('../lib/idGenerator')
const { Readable } = require('stream');


/*
 * Schema describing required/optional fields of a submission object.
 */
const submissionsSchema = {
  assignmentId: { required: true },
  studentId: { required: true },
  timestamp: { required: true },
  grade: { required: true },
  file: { required: false }
}
exports.submissionsSchema = submissionsSchema

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

  const submissionFiles = await db.collection(submissionsMetadataCollection).find({ 'metadata.assignmentId': parseInt(assignmentId) }).toArray();
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
  const submissionFiles = await db.collection(submissionsMetadataCollection).find({ 'metadata.assignmentId': ParseInt(assignmentId) }).toArray();
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

// This function created by AI tools for testing purposes (untested)
async function insertNewSubmission(subObj) {
  const bucket = getSubmissionsBucket();
  const { file, ...metadata } = subObj;

  // If file is a binary string, convert to Buffer
  const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file, 'binary');
  const stream = Readable.from(buffer);

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream('submission', { metadata });
    stream.pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => resolve(uploadStream.id));
  });
}

/*
 * Executes a DB query to bulk insert an array new business into the database.
 * Returns a Promise that resolves to a map of the IDs of the newly-created
 * business entries.
 */
async function bulkInsertNewSubmissions(submissions) {
  const insertedIds = [];
  for (const sub of submissions){
    const id = await insertNewSubmission(sub);
    insertedIds.push(id);
  }
  return insertedIds;
}
exports.bulkInsertNewSubmissions = bulkInsertNewSubmissions