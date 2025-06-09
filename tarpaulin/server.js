const express = require('express')

const api = require('./api')
const { connectToDb } = require('./lib/mongo')
const { initRedis, rateLimit } = require('./lib/redis')
const app = express()
const port = process.env.PORT || 3000

app.set('trust proxy', true)

app.use(express.json())

app.use(rateLimit)

app.use('/', api)

app.use('*', function (req, res, next) {
  res.status(404).json({
    error: `Requested resource ${req.originalUrl} does not exist`
  })
})

connectToDb(async function () {
  await initRedis()
  
  app.listen(port, function () {
    console.log("== Server is running on port", port)
  })
})