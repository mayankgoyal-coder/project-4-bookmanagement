const mongoose = require('mongoose')
const urlController = require("../model/urlModel")


const createUrl = (req, res) => {
    try {

    }
    catch (err) {
        res.status(500).send({ Error: err.message })
    }
}

const getUrl = (req, res) => {
    try {

    }
    catch (err) {
        res.status(500).send({ Error: err.message })
    }
}


module.exports = { createUrl, getUrl }