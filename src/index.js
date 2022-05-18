const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const router = require('./routes/route')
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

mongoose.connect("mongodb+srv://bkrajor:Bk.190196@cluster0.bn0kl.mongodb.net/group106Database", { useNewUrlParser: true })
    .then(() => console.log("MongoDb is connected"))
    .catch((err) => console.log(err))

app.use('/', router)

app.listen(process.env.PORT || 3000, () => {
    console.log("Express app running on port" + (process.env.PORT || 3000))
})

