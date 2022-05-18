const mongoose = require('mongoose')
const redis = require('redis')
const urlModel = require('../model/urlModel')

const shortId = require('shortid')


const createUrl = async (req, res) => {
    try {
        let data =req.body
        if(Object.keys(data).length==0){
            return res.status(400).send({status:false,message:"Invali url, please provide valid parameter"})
        }
        if(!data.longUrl){
            return res.status(400).sens({status:false, message:"Please give the LongUrl"})
        }
        let url = await urlModel.findOne({longUrl: data.longUrl})
            if(url){
            return res.status(400).send({status:false,message:"url is already preasent in db"})
        }

        const baseUrl = 'http://localhost:3000'
        let urlCode = shortId.generate().toLowerCase();
        const shortUrl= baseUrl+ '/'+urlCode
        
        data.urlCode= urlCode;
        data.shortUrl=shortUrl;

        let bodyData = await urlModel.create(data);
        await urlModel.findOne({urlCode:urlCode}).select({_id:0, __v:0,})
        res.status(201).send({status:true,message:"url created successfully",data:bodyData})




    }
    catch (err) {
        res.status(500).send({ Error: err.message })
    }
}
//******************************************************************************************************************************** */
const getUrl = async (req, res) => {
    try {
        let urlCode = req.params.urlCode;
        let getUrl = await urlModel.findOne({urlCode:urlCode})
        res.status(303).send({status:true,data:getUrl})

    }
    catch (err) {
        res.status(500).send({ Error: err.message })
    }
}


module.exports = { createUrl, getUrl }