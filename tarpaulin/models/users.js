const { ObjectId } = require('mongodb')
const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')
const { getNextSequenceValue } = require('../lib/idGenerator')
const bcrypt = require('bcryptjs')
const usersCollection = "users"
exports.usersCollection = usersCollection

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
 * Schema for user login - only email and password required
 */
const loginSchema = {
  email: { required: true },
  password: { required: true }
}
exports.loginSchema = loginSchema

/*
 * Executes a DB query to insert a new user into the database.
 */
async function createNewUser(user_details) {
  const new_user = extractValidFields(user_details, usersSchema);
  new_user.password = await bcrypt.hash(new_user.password, 8);
  new_user._id = await getNextSequenceValue(usersCollection)
  const db = getDbReference();
  const returnObj = await db.collection(usersCollection).insertOne(new_user);
  return returnObj.insertedId ?? null;
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
  const user = db.collection(usersCollection).findOne({_id: parseInt(id)})
  return user;
}
exports.getUserById = getUserById

/*
 * Executes a DB query to bulk insert an array new business into the database.
 * Returns a Promise that resolves to a map of the IDs of the newly-created
 * business entries.
 */
async function bulkInsertNewUsers(users) {
  const db = getDbReference()
  const collection = db.collection(usersCollection)
  
  // Hash passwords before inserting
  const usersWithHashedPasswords = await Promise.all(
    users.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, 8)
    }))
  )
  
  const result = await collection.insertMany(usersWithHashedPasswords)
  return result.insertedIds
}
exports.bulkInsertNewUsers = bulkInsertNewUsers