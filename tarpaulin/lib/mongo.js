
const { MongoClient, GridFSBucket } = require('mongodb');
const { GridFsStorage } = require('multer-gridfs-storage');

const mongoHost = process.env.MONGO_HOST || 'localhost'
const mongoPort = process.env.MONGO_PORT || 27017
const mongoUser = process.env.MONGO_USER
const mongoPassword = process.env.MONGO_PASSWORD
const mongoDbName = process.env.MONGO_DB_NAME
const mongoAuthDbName = process.env.MONGO_AUTH_DB_NAME || mongoDbName

const mongoUrl = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${
mongoPort}/${mongoAuthDbName}`

let db;
let gfs_images_bucket;
let gfs_thumbs_bucket;
let _closeDbConnection;

exports.connectToDb = function (callback) {
  MongoClient.connect(mongoUrl, function (err, client) {
    if (err) {
      throw err
    }
    db = client.db(mongoDbName)
    gfs_images_bucket = new GridFSBucket(db, { bucketName: 'images' });
    gfs_thumbs_bucket = new GridFSBucket(db, { bucketName: 'thumbs' });
    _closeDbConnection = function (callback) {
      client.close()
      callback()
    }
    callback()
  })
}

exports.images_storage = new GridFsStorage({
  url: mongoUrl,
  file: (req, file) => {
    return {
      bucketName: 'images'
    };
  }
});

exports.thumbs_storage = new GridFsStorage({
  url: mongoUrl,
  file: (req, file) => {
    return {
      bucketName: 'thumbs'
    };
  },
});

exports.imageFilter = function (req, file, callback) {
  return callback(null, ((file.mimetype == 'image/jpeg') || (file.mimetype == 
  'image/png')))
}

exports.getDbReference = function () {
  return db
}

exports.getImagesBucket = function () {
  return gfs_images_bucket
}

exports.getThumbsBucket = function () {
  return gfs_thumbs_bucket
}

exports.closeDbConnection = function (callback) {
  _closeDbConnection(callback)
}