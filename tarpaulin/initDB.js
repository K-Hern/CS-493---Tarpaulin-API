// load dummy data in Mongo
const { connectToDb, getDbReference, closeDbConnection } = require('./lib/mongo')
const { bulkInsertNewAssignments, assignmentsCollection } = require('./models/assignments')
const { bulkInsertNewCourses, coursesCollection } = require('./models/courses')
const { bulkInsertNewSubmissions } = require('./models/submissions')
const { bulkInsertNewUsers, usersCollection } = require('./models/users')

const assignmentsData = require('./data/assignments.json')
const coursesData = require('./data/courses.json')
const submissionsData = require('./data/submissions.json')
const usersData = require('./data/users.json')

const mongoCreateUser = process.env.MONGO_CREATE_USER
const mongoCreatePassword = process.env.MONGO_CREATE_PASSWORD

connectToDb(async function () {
  /*
   * Insert initial model data into the database
   */
  const busIds = await bulkInsertNewAssignments(assignmentsData)
  console.log("== Inserted Assignments with IDs:", busIds)

  const crsIds = await bulkInsertNewCourses(coursesData)
  console.log("== Inserted Courses with IDs:", crsIds)

  const subIds = await bulkInsertNewSubmissions(submissionsData)
  console.log("== Inserted Submissions with IDs:", subIds)

  const UsrIds = await bulkInsertNewUsers(usersData)
  console.log("== Inserted Users with IDs:", UsrIds)

  /*
   * Initialize Id sequencing to avoid conflicts with dummy data
   */
  const db = getDbReference();
  // Will raise error on fail
  await db.collection('counters').insertMany([
    { _id: usersCollection, sequenceValue: 202 },
    { _id: assignmentsCollection, sequenceValue: 3 },
    { _id: coursesCollection, sequenceValue: 4 }
  ])

  /*
   * Create a new, lower-privileged database user if the correct environment
   * variables were specified.
   */
  if (mongoCreateUser && mongoCreatePassword) {
    const db = getDbReference()
    const result = await db.addUser(mongoCreateUser, mongoCreatePassword, {
      roles: "readWrite"
    })
    console.log("== New user created:", result)
  }

  closeDbConnection(function () {
    console.log("== DB connection closed")
    process.exit(0)
  })
})