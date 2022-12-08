const { MongoGridFSChunkError } = require('mongodb')
const mongoose = require('mongoose')

const clinicSchema = new mongoose.Schema({
    id : {type : String},
    imageUrl : {type : String},
    clinicName : {type : String},
    address : {type : String},
    town : {type : String},
    openingHours : {type : String},
    phoneNumber : {type : String},
    doctor : {type : String},
    clinicType : {type : String},
    clinicProgramme : {type : String},
    paymentMethod : {type : String},
    publicTransport : {type : String},
    carpark : {type : String},
    price : {type : String},
    rating : {type : String},
    currentQueue : {type : String},
    queueDetails : {type : String},
    lastQueueNumber : {type : String}
})

module.exports = mongoose.model('ClinicDetails', clinicSchema)