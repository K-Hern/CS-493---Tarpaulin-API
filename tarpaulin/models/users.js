const { ObjectId } = require('mongodb')
const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')
const bcrypt = require('bcryptjs')
const usersCollection = "users"
const user_roles = {
  admin : 'admin',
  instructor : 'instructor',
  student : 'student',
}
exports.user_roles = user_roles;

/*
 * Schema describing required/optional fields of a user object.
 */
const usersSchema = {
  name: { required: true },
  email: { required: true },
  password: { required: true },
  role: { required: true }
}
// NOTE - users should also include a list of course ids which they are enrolled in/teach
exports.usersSchema = usersSchema

/*
 * Executes a DB query to insert a new user into the database.
 */
async function createNewUser(user_details) {
  const new_user = extractValidFields(user_details, usersSchema);
  new_user.password = await bcrypt.hash(new_user.password, 8);
  const db = getDbReference();
  const returnObj = await db.collection(usersCollection).insertOne(new_user);
  return (returnObj.insertedId) ? returnObj.insertedId : null;
}
exports.createNewUser = createNewUser

async function getUserByEmail(email){
  const db = getDbReference();
  const user = db.collection(usersCollection).findOne({email: email})
  return user;
}
exports.getUserByEmail = getUserByEmail

async function getUserById(id){
  const db = getDbReference();
  const user = db.collection(usersCollection).findOne({_id: new ObjectId(id)})
  return user;
}
exports.getUserById = getUserById

/*
 * Executes a DB query to bulk insert an array new business into the database.
 * Returns a Promise that resolves to a map of the IDs of the newly-created
 * business entries.
 */
async function bulkInsertNewUsers(users) {
  const usersToInsert = users.map(function (user) {
    return extractValidFields(user, usersSchema)
  })
  const db = getDbReference()
  const collection = db.collection(usersCollection)
  const result = await collection.insertMany(usersToInsert)
  return result.insertedIds
}
exports.bulkInsertNewUsers = bulkInsertNewUsers