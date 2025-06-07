const jwt = require('jsonwebtoken')
const {
  User,
  Business,
  Photo,
  Review
} = require('../models/index')

function verifyToken(req, res){
  const user_jwt = req.headers.authorization.split(' ')[1] // Expect: {token: Bearer jahsdfv...}
  let decodedJWT

  try {
    decodedJWT = jwt.verify(user_jwt, process.env.JWT_SECRET_KEY)
  } catch (err) {
    (err.name === 'TokenExpiredError') ? res.status(401).send("Token Expired") : res.status(401).send("UnAuthorized")
    return false;
  }

  return decodedJWT
}

/**
 * Verifies that the bearer token UserId and the query string UserId match
 * @return boolean whether the given user is an admin or not
 */
async function isUserAdmin(userId){
  const user = await User.findOne({ where: { userId: userId } });
  // user.admin is a boolean
  return (user.admin)
}

/**
 * Verifies that the bearer token houses a user id that belongs to an admin
 */
async function verifyAdmin(req, res, next){
  // Verify existence of needed vars
  if (!(req.headers.authorization)){
    return res.status(400).send("Malformed Request")
  }

  const decodedJWT = verifyToken(req, res)
  if (!decodedJWT) {
    return
  }

  return (await isUserAdmin(decodedJWT.sub)) ? next() : res.status(401).send("UnAuthorized")
}

/**
 * Verifies that the bearer token UserId and the query string UserId match
 */
async function verifyBearerBody(req, res, next){

  // Verify existence of needed vars
  if (!((req.body.userId || req.body.ownerId) && req.headers.authorization)){
    return res.status(400).send("Malformed Request")
  }

  const decodedJWT = verifyToken(req, res)
  if (!decodedJWT) {
    return
  }

  const givenUserId = req.body.userId ?? req.body.ownerId
  return ((await isUserAdmin(decodedJWT.sub)) || (decodedJWT.sub == givenUserId)) ? next() : res.status(401).send("UnAuthorized")
}

/**
 * Verifies that the bearer token UserId and the query string UserId match
 */
async function verifyBearerQuery(req, res, next){
  // Verify existence of needed vars
  if (!(req.params.userId && req.headers.authorization)){
    return res.status(400).send("Malformed Request")
  }

  const decodedJWT = verifyToken(req, res)
  if (!decodedJWT) {
    return
  }

  return ((await isUserAdmin(decodedJWT.sub)) || (decodedJWT.sub == req.params.userId)) ? next() : res.status(401).send("UnAuthorized")
}

/**
 * Verifies that the bearer token UserId and the query string UserId match
 */
async function verifyBearerBusiness(req, res, next){
  // Verify existence of needed vars
  if (!(req.params.businessId && req.headers.authorization)){
    return res.status(400).send("Malformed Request")
  }

  const decodedJWT = verifyToken(req, res)
  if (!decodedJWT) {
    return
  }

  const business = await Business.findOne({ where: { businessId: req.params.businessId } });
  return ((await isUserAdmin(decodedJWT.sub)) || (decodedJWT.sub == business.ownerId)) ? next() : res.status(401).send("UnAuthorized")
}

module.exports = {
  verifyBearerBody,
  verifyBearerQuery,
  verifyBearerBusiness,
  isUserAdmin,
  verifyAdmin
}