const { ObjectId } = require('mongodb')
const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')
const bcrypt = require('bcryptjs')
const usersCollection = "users"

/*
 * Schema describing required/optional fields of a user object.
 */
const usersSchema = {
  name: { required: true },
  email: { required: true },
  password: { required: true },
  role: { required: true }
}
exports.usersSchema = usersSchema

/*
 * Executes a DB query to insert a new user into the database.
 */
async function createNewUser(user_details) {
  const new_user = extractValidFields(user_details, usersSchema);
  new_user.password = await bcrypt.hash(new_user.password, 8);
  const db = getDbReference();
  await db.collection(usersCollection).insertOne(new_user);
  return
}
exports.createNewUser = createNewUser

async function getUser(email){
  const db = getDbReference();
  const user = db.collection(usersCollection).findOne({email: email})
  return user;
}
exports.getUser = getUser