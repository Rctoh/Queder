const { MongoGridFSChunkError } = require('mongodb')
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    firstName : {type : String},
    fullName : {type : String},
    nric : {type : String},
    email : {type : String},
    phoneNumberEx : {type : String},
    phoneNumber : {type : String},
    password : {type : String},
    imageUrl : {type : String}
})

module.exports = mongoose.model('loginDetails', userSchema)