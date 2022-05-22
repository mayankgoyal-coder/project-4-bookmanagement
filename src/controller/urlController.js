const mongoose = require('mongoose')
const redis = require('redis')
const urlModel = require('../model/urlModel')
const shortId = require('shortid')
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
        if (Object.keys(req.body).length == 0)
            return res.status(400).send({ status: false, message: "Invalid request parameters" })

        let longUrl = req.body.longUrl

        // ---------validating longUrl---------
        if (!longUrl) return res.status(400).send({ status: false, message: "Please provide a longUrl" })
        if (!isValidUrl(longUrl)) return res.status(400).send({ status: false, message: "Invalid URL" })

        // ---------finding urlData in cache-------
        const cacheUrlData = await GET_ASYNC(`${longUrl}`)
        if (cacheUrlData) return res.status(200).send({ status: true, data: JSON.parse(cacheUrlData) })

        // ---------finding urlData in DB----------
        let isURLPresent = await urlModel.findOne({ longUrl }).select({ _id: 0, longUrl: 1, shortUrl: 1, urlCode: 1 })
        console.log(isURLPresent)
        if (isURLPresent) {
            // -------setting urlData in cache-------
            await SET_ASYNC(`${longUrl}`, JSON.stringify(isURLPresent))
            
            return res.status(200).send({ status: true, data: isURLPresent })
        }

        // ----------creating urlCode and shortUrl-------
        let baseUrl = 'http://localhost:3000'
        let urlCode = shortId.generate().toLowerCase()
        let shortUrl = baseUrl + '/' + urlCode

        await urlModel.create({ longUrl, shortUrl, urlCode })

        res.status(201).send({ status: true, message: "url created successfully", longUrl, shortUrl, urlCode })
    }
    catch (err) {
        res.status(500).send({ Error: err.message })
    }
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const getUrl = async (req, res) => {
    try {
        let urlCode = req.params.urlCode

        // ------finding longUrl in cache--------
        let urlFromCache = await GET_ASYNC(`${urlCode}`)
        console.log("urlFromCache")
        if (urlFromCache) return res.status(302).redirect(JSON.parse(urlFromCache))

        // ------finding urlData in DB-------
        let urlDataFromDB = await urlModel.findOne({ urlCode })
        if (!urlDataFromDB) return res.status(404).send({ status: false, message: "No longUrl found with this urlCode" })

        // ------setting longUrl in cache-------
        await SET_ASYNC(`${urlCode}`, JSON.stringify(urlDataFromDB.longUrl))
        console.log("urlDataFromDB.longUrl")

        return res.status(302).redirect(urlDataFromDB.longUrl)
    }
    catch (err) {
        res.status(500).send({ Error: err.message })
    }
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

module.exports = { createUrl, getUrl }
