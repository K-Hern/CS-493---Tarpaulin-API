const { getDbReference} = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')
const { getNextSequenceValue } = require('../lib/idGenerator')

const coursesCollection = 'courses'
exports.coursesCollection = coursesCollection

/*
 * Schema describing required/optional fields of a courses object.
 */
const coursesSchema = {
  subject: { required: true },
  number: { required: true },
  title: { required: true },
  term: { required: true },
  instructorId:{ required: true },
  students: {required: false}
}
// NOTE - Courses schema should also include a list of students ids
exports.coursesSchema = coursesSchema

// Returns the new id on success or null on failure
// pass in req.body
async function createCourse(courseDetails){
  const new_course = extractValidFields(courseDetails, coursesSchema);
  new_course._id = await getNextSequenceValue(coursesCollection)
  const db = getDbReference();
  // create an empty student roster if not included
  if (!Object.hasOwn(new_course, 'students')){
    new_course.students = []
  }
  const returnObj = await db.collection(coursesCollection).insertOne(new_course);
  return returnObj.insertedId ?? null;
}
exports.createCourse = createCourse

// Returns a boolean indicating success or failure
async function updateCourse(id, course_details) {
  const new_course_vals = extractValidFields(course_details, coursesSchema);
  const db = getDbReference();
  const returnObj = await db.collection(coursesCollection)
    .updateOne(
      {_id: id},
      { $set: new_course_vals}
    )
  return (returnObj.matchedCount == 1)
}
exports.updateCourse = updateCourse

// Returns a boolean indicating success or failure
async function deleteCourseById(id) {
  const db = getDbReference();
  const result = await db.collection(coursesCollection).deleteOne({_id: id});
  return result.deletedCount === 1;
}
exports.deleteCourseById = deleteCourseById


// returns the course object on 200 else null
async function getCourseDetailsById(id){
  const db = getDbReference();
  const course = await db.collection(coursesCollection).findOne({_id: id});
  return course;
}
exports.getCourseDetailsById = getCourseDetailsById

// Returns a list of ids on success or [] on failure
// pass in {field: value}
async function findAllCoursesByCondition(queryObj){
  const db = getDbReference();
  const courses = await db.collection(coursesCollection).find(queryObj).toArray();
  return courses;
}
exports.findAllCoursesByCondition = findAllCoursesByCondition

/*
 * Executes a DB query to bulk insert an array new business into the database.
 * Returns a Promise that resolves to a map of the IDs of the newly-created
 * business entries.
 */
async function bulkInsertNewCourses(courses) {
  const db = getDbReference()
  const collection = db.collection(coursesCollection)
  const result = await collection.insertMany(courses)
  return result.insertedIds
}
exports.bulkInsertNewCourses = bulkInsertNewCourses

