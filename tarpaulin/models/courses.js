const { ObjectId } = require('mongodb')
const { getDbReference, getImagesBucket, getThumbsBucket} = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

/*
 * Schema describing required/optional fields of a courses object.
 */
const coursesSchema = {
  subject: { required: true },
  number: { required: true },
  title: { required: true },
  term: { required: true },
  instructorid:{ required: true }
}
exports.coursesSchema = coursesSchema

//TO DO: change to insert new course
/*
 * Executes a DB query to insert a new photo's metadata into the database.
 */
async function insertNewPhoto(req) {
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

/*
 * Executes a DB query to delete a photo (both image and thumb) from the DB (
 both chunk and file)
 */
async function deletePhoto(id) {
  const image_bucket = getImagesBucket();
  await image_bucket.delete(new ObjectId(id));
  push_item(`DELETE ${id}`)
  return
}
exports.deletePhoto = deletePhoto

/*
 * Executes a DB query to fetch a single specified photo's data based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * photo.
 */
async function getPhotoDetailsById(id) {
  const db = getDbReference();
  const file = await db.collection(`submission.files`).findOne({ _id: new ObjectId(id) });
  return file;
}
exports.getPhotoDetailsById = getPhotoDetailsById

/*
 * Executes a DB query to fetch a single specified photo's data based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * photo.
 */
async function getPhotoDownloadStreamById(id, type) {
  const bucket = (type == "images") ? getImagesBucket() : getThumbsBucket();
  const download_stream = bucket.openDownloadStream(new ObjectId(id));
  return download_stream; 
}

exports.getPhotoDownloadStreamById = getPhotoDownloadStreamById