const { getDbReference } = require('../lib/mongo')
const { deleteAllSubmissionsByAssignmentId } = require('./submissions')
const { getNextSequenceValue } = require('../lib/idGenerator')
const assignmentsCollection = 'assignments';
exports.assignmentsCollection = assignmentsCollection


/*
 * Schema describing required/optional fields of an assignment object.
 */
const assignmentsSchema = {
  courseId: { required: true },
  title: { required: true },
  points: { required: true },
  due: { required: true }
}
exports.assignmentsSchema = assignmentsSchema

/*
 * Executes a DB query to insert a new user into the database.
 */
async function createNewAssignment(assignment_details) {
  const new_assignment = extractValidFields(assignment_details, assignmentsSchema);
  new_assignment._id = await getNextSequenceValue(assignmentsCollection);
  const db = getDbReference();
  const returnObj = await db.collection(assignmentsCollection).insertOne(new_assignment);
  return returnObj.insertedId ?? null;
}
exports.createNewAssignment = createNewAssignment

// Returns a boolean indicating success or failure
async function updateAssignment(id, assignment_details) {
  const new_assignment_vals = extractValidFields(assignment_details, assignmentsSchema);
  const db = getDbReference();
  const returnObj = await db.collection(assignmentsCollection)
    .updateOne(
      {_id: id},
      { $set: new_assignment_vals}
    )
  return (returnObj.matchedCount == 1)
}
exports.updateAssignment = updateAssignment

async function getAssignmentById(id){
  const db = getDbReference();
  const assignment = await db.collection(assignmentsCollection).findOne({_id: id})
  return assignment;
}
exports.getAssignmentById = getAssignmentById

async function getAllAssignmentsByCourseId(courseId){
  const db = getDbReference();
  const assignmentsList = await db.collection(assignmentsCollection).find({courseId: courseId}).toArray();
  return assignmentsList;
}
exports.getAllAssignmentsByCourseId = getAllAssignmentsByCourseId

// Returns boolean indicating success/fail
// Also deletes all corresponding submission files
async function deleteAssignmentById(id) {
  const db = getDbReference();
  const result = await db.collection(assignmentsCollection).deleteOne({ _id: id });
  if (result.deletedCount){
    deleteAllSubmissionsByAssignmentId(id)
  }
  return (result.deletedCount == 1);
}
exports.deleteAssignmentById = deleteAssignmentById

// Also deletes all corresponding submissions before deleting self
async function deleteAllAssignmentsByCourseId(courseId) {
  const db = getDbReference();
  const assignments = await getAllAssignmentsByCourseId(courseId);
  for (const ass of assignments) {
    await deleteAllSubmissionsByAssignmentId(ass._id);
  }
  await db.collection(assignmentsCollection).deleteMany({ courseId: courseId });
}
exports.deleteAllAssignmentsByCourseId = deleteAllAssignmentsByCourseId

/*
 * Executes a DB query to bulk insert an array new business into the database.
 * Returns a Promise that resolves to a map of the IDs of the newly-created
 * business entries.
 */
async function bulkInsertNewAssignments(assignments) {
  const db = getDbReference()
  const collection = db.collection(assignmentsCollection)
  const result = await collection.insertMany(assignments)
  return result.insertedIds
}
exports.bulkInsertNewAssignments = bulkInsertNewAssignments