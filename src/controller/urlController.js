const mongoose = require('mongoose')
const urlModel = require('../model/urlModel')
const shortId = require('shortid')
const redis = require("redis")
const { promisify } = require("util")

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const isValidUrl = (url) => {
    if (/(ftp|http|https|FTP|HTTP|HTTPS):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/.test(url.trim()))
        return true
    else
        return false
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//----------Connect to redis-----------
const redisClient = redis.createClient(
    18028,
    "redis-18028.c301.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
)
redisClient.auth("501kcw3yEnL19M6yDNpki4p6i7fB30Bb", function (err) {
    if (err) throw err
})

redisClient.on("connect", async function () {
    console.log("Connected to Redis..")
})

//-----------Connection setup for redis-----------
const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const createUrl = async (req, res) => {
    try {
        if (Object.keys(req.body).length == 0 || Object.keys(req.body).length > 1)
            return res.status(400).send({ status: false, message: "Invalid request parameters" })

        let longUrl = req.body.longUrl

        if (!longUrl) return res.status(400).send({ status: false, message: "Please provide a longUrl" })
        if (!isValidUrl(longUrl)) return res.status(400).send({ status: false, message: "Invalid URL" })

        let isURLPresent = await urlModel.findOne({ longUrl })
        if (isURLPresent) {
            await SET_ASYNC(`${longUrl}`, JSON.stringify(isURLPresent))
            return res.status(200).send({ status: true, message: "shortUrl for this longUrl is already present in DB" })
        }

        let baseUrl = 'http://localhost:3000'
        let urlCode = shortId.generate().toLowerCase()
        let shortUrl = baseUrl + '/' + urlCode

        await urlModel.create({ longUrl, shortUrl, urlCode })

        res.status(201).send({ status: true, message: "url created successfully", longUrl,shortUrl,urlCode })
    }
    catch (err) {
        res.status(500).send({ Error: err.message })
    }
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const getUrl = async (req, res) => {
    try {
        let urlCode = req.params.urlCode

        let urlDataFromCache = await GET_ASYNC(`${urlCode}`)
        if (urlDataFromCache) {
            console.log("redirect from cache")
            return res.status(302).redirect(JSON.parse(urlDataFromCache).longUrl)
        }
        
        let getLongUrl = await urlModel.findOne({ urlCode })
        if (!getLongUrl) return res.status(404).send({ status: false, message: "No longUrl found with this urlCode" })

        await SET_ASYNC(`${urlCode}`, JSON.stringify(getLongUrl))

        console.log("redirect from DB")
        return res.status(302).redirect(getLongUrl.longUrl)
    }
    catch (err) {
        res.status(500).send({ Error: err.message })
    }
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

module.exports = { createUrl, getUrl }
