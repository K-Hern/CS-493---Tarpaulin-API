"use strict";

const express = require('express');
const app = express();
const redis = require('redis');

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || '6379';

const redisClient = redis.createClient({
    url: `redis://${redisHost}:${redisPort}`
});

const port = 8086;

const TOKEN_COUNT = 3;
const REFRESH_RATE = .0003;


async function rateLimit(req, res, next) {
  const ip = req.ip;
  const currentTime = Date.now();
  const exists = await redisClient.exists(ip);

  if (!exists) {
    await redisClient.hSet(ip, { token_count: TOKEN_COUNT, last_time: currentTime });
  }
  const userToken = await redisClient.hGetAll(ip);
  userToken.token_count = parseInt(userToken.token_count, 10);
  userToken.last_time = parseInt(userToken.last_time, 10);

  
  const elapsedTime = currentTime - userToken.last_time;
  const tokensToAdd = Math.floor(elapsedTime * REFRESH_RATE);
  
  userToken.token_count = Math.min(TOKEN_COUNT, userToken.token_count + tokensToAdd);
  userToken.last_time = currentTime;

  if (userToken.token_count > 0) {
        console.log(userToken);
        userToken.token_count -= 1;
        await redisClient.hSet(ip, userToken);
        
        next();
    } else {
        res.status(429).send("TOO MANY REQUESTS\n");
    }
  }



app.get("/", rateLimit, async (req, res) => {
    res.send("Here's some data!\n");
});


redisClient.connect().then(function () {
app.listen(port, function () {
    console.log("== Server listening on port", port);
});
});
