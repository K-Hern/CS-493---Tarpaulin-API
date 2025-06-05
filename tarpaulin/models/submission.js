const { ObjectId } = require('mongodb')
const { getDbReference, getImagesBucket, getThumbsBucket} = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

/*
 * Schema describing required/optional fields of a submission object.
 */
const submissionSchema = {
  assignmentId: { required: true },
  studentId: { required: true },
  timestamp: { required: true },
  grade: { required: true },
  file: { required: true }
}
exports.submissionSchema = submissionSchema

/*
 * Executes a DB query to insert a new photo's metadata into the database.
 */
async function createNewAssignment(req) {
  metadata = extractValidFields(req.body, PhotoSchema)
  metadata.businessId = new ObjectId(metadata.businessId)
  metadata.extension = imageTypes[req.file.mimetype];
  metadata.thumbId = new ObjectId(req.file._id)
  const db = getDbReference();
  await db.collection('images.files').updateOne(
    { _id: new ObjectId(req.file.id) },
    { $set: { metadata: metadata } }
  )
  req.file.extension = metadata.extension;
  push_item(`${req.file.id}.${metadata.extension}`)
  return
}
exports.insertNewPhoto = insertNewPhoto
