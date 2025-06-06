
const { MongoClient, GridFSBucket } = require('mongodb');
const { GridFsStorage } = require('multer-gridfs-storage');

const mongoHost = process.env.MONGO_HOST || 'localhost'
const mongoPort = process.env.MONGO_PORT || 27017
const mongoUser = process.env.MONGO_USER
const mongoPassword = process.env.MONGO_PASSWORD
const mongoDbName = process.env.MONGO_DB_NAME
const mongoAuthDbName = process.env.MONGO_AUTH_DB_NAME || mongoDbName
const mongoUrl = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoAuthDbName}`

const submissionsBucketName = 'submissions';
exports.submissionsMetadataCollection = `${submissionsBucketName}.files`

let db;
let gfs_submissions_bucket;
let _closeDbConnection;

exports.connectToDb = function (callback) {
  MongoClient.connect(mongoUrl, function (err, client) {
    if (err) {
      throw err
    }
    db = client.db(mongoDbName)
    gfs_submissions_bucket = new GridFSBucket(db, { bucketName: submissionsBucketName });
    _closeDbConnection = function (callback) {
      client.close()
      callback()
    }
    callback()
  })
}

exports.submissions_storage = new GridFsStorage({
  url: mongoUrl,
  file: (req, file) => {
    return {
      bucketName: submissionsBucketName,
      metadata:{
        assignmentId: req.body.assignmentId,
        studentId: req.body.studentId,
        timestamp: req.body.timestamp,
        grade: req.body.grade,
        mimeType: file.mimetype 
      }
    };
  }
});

exports.getDbReference = function () {
  return db
}

exports.getSubmissionsBucket = function () {
  return gfs_submissions_bucket
}

exports.closeDbConnection = function (callback) {
  _closeDbConnection(callback)
}