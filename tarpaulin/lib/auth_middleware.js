const jwt = require('jsonwebtoken')
const { getUserById } = require('../models/users')

function verifyToken(req, res) {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    res.status(401).json({ error: "Missing or malformed authorization header" })
    return false
  }

  const token = req.headers.authorization.split(' ')[1]
  let decodedJWT

  try {
    decodedJWT = jwt.verify(token, process.env.JWT_SECRET_KEY)
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: "Token expired" })
    } else {
      res.status(401).json({ error: "Invalid token" })
    }
    return false
  }

  return decodedJWT
}

/**
 * Middleware to require authentication - adds user info to req.user
 */
async function requireAuth(req, res, next) {
  const decodedJWT = verifyToken(req, res)
  if (!decodedJWT) {
    return // verifyToken already sent the response
  }

  try {
    const user = await getUserById(decodedJWT.sub)
    if (!user) {
      return res.status(401).json({ error: "User not found" })
    }
    
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role
    }
    next()
  } catch (err) {
    console.error("Auth error:", err)
    res.status(500).json({ error: "Authentication error" })
  }
}

/**
 * Middleware to require admin role
 */
async function requireAdmin(req, res, next) {
  await requireAuth(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next()
    } else {
      res.status(403).json({ error: "Admin access required" })
    }
  })
}

/**
 * Middleware to require instructor role (or admin)
 */
async function requireInstructor(req, res, next) {
  await requireAuth(req, res, () => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'instructor')) {
      next()
    } else {
      res.status(403).json({ error: "Instructor access required" })
    }
  })
}

/**
 * Middleware to require student role (or admin)
 */
async function requireStudent(req, res, next) {
  await requireAuth(req, res, () => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'student')) {
      next()
    } else {
      res.status(403).json({ error: "Student access required" })
    }
  })
}

/**
 * Middleware to check if user can access their own data or is admin
 */
async function requireSelfOrAdmin(req, res, next) {
  await requireAuth(req, res, () => {
    const requestedUserId = parseInt(req.params.id)
    if (req.user && (req.user.role === 'admin' || req.user.id === requestedUserId)) {
      next()
    } else {
      res.status(403).json({ error: "Access denied" })
    }
  })
}

/**
 * Middleware to check if user can manage a course (admin or course instructor)
 */
async function requireCourseAccess(req, res, next) {
  await requireAuth(req, res, async () => {
    if (req.user.role === 'admin') {
      return next()
    }
    
    if (req.user.role === 'instructor') {
      // Check if this instructor teaches this course
      const { getCourseDetailsById } = require('../models/courses')
      try {
        const course = await getCourseDetailsById(req.params.id)
        if (course && course.instructorId === req.user.id) {
          return next()
        }
      } catch (err) {
        console.error("Course access check error:", err)
      }
    }
    
    res.status(403).json({ error: "Course access denied" })
  })
}

/**
 * Middleware to check if user can submit to an assignment (student enrolled in course)
 */
async function requireAssignmentSubmissionAccess(req, res, next) {
  await requireAuth(req, res, async () => {
    if (req.user.role === 'admin') {
      return next()
    }
    
    if (req.user.role === 'student') {
      // Check if student is enrolled in the course for this assignment
      const { getAssignmentById } = require('../models/assignments')
      const { getCourseDetailsById } = require('../models/courses')
      
      try {
        const assignment = await getAssignmentById(req.params.id)
        if (assignment) {
          const course = await getCourseDetailsById(assignment.courseId)
          if (course && course.students && course.students.includes(req.user.id)) {
            return next()
          }
        }
      } catch (err) {
        console.error("Assignment submission access check error:", err)
      }
    }
    
    res.status(403).json({ error: "Assignment submission access denied" })
  })
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireInstructor,
  requireStudent,
  requireSelfOrAdmin,
  requireCourseAccess,
  requireAssignmentSubmissionAccess
}