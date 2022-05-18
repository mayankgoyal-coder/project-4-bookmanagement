const mongoose = require('mongoose')

const urlModel = new mongoose.Schema({
    longUrl: {
        type: String, required: true, unique: true, trim: true,lowercase:true
    },
    shortUrl: {
        type: String, required: true, trim: true
    },
    urlCode: {
        type: String, required: true, unique: true, trim: true
    }
}, { timestamps: true })

module.exports = mongoose.model('URL', urlModel)