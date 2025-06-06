// load dummy data in Mongo
const { connectToDb, getDbReference, closeDbConnection } = require('./lib/mongo')
const { bulkInsertNewAssignments } = require('./models/bulkInsertNewAssignments')
const { bulkInsertNewCourses } = require('./models/courses')
const { bulkInsertNewSubmissions } = require('./models/submissions')
const { bulkInsertNewUsers } = require('./models/users')

const assignmentsData = require('./data/assignments.json')
const coursesData = require('./data/courses.json')
const submissionsData = require('./data/submissions.json')
const usersData = require('./data/users.json')

const mongoCreateUser = process.env.MONGO_CREATE_USER
const mongoCreatePassword = process.env.MONGO_CREATE_PASSWORD

connectToDb(async function () {
  /*
   * Insert initial business data into the database
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