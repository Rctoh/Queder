const express = require('express')
const router = express.Router()
const app = express()
const Clinic = require('../models/clinicDetails')
const clinicDetails = require('../models/clinicDetails');
const Pusher = require("pusher");
const { castObject } = require('../models/clinicDetails');
const { parse } = require('dotenv');
const User = require('../models/loginDetails');
const loginDetailsDB = require('../models/loginDetails');
const nodemailer = require("nodemailer");

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}


const pusher = new Pusher({
    appId: "1485916",
    key: "c828f4b49017af8eb250",
    secret: "c07c3748fc8215f691dc",
    cluster: "ap1",
    useTLS: true
  });


  /// GET CLINIC DATA

  router.get('/', async (req, res) => {
    
    const allClinic = await clinicDetails.find({});

    try {
        res.send(allClinic)
        
    } catch {
        res.send("Fail")
    }

})

//// CREATE NEW CLINIC

router.post('/add', async (req, res) => {
    const clinicDetails = new Clinic({
        id : req.body.id,
        imageUrl : req.body.imageUrl,
        clinicName : req.body.clinicName,
        address : req.body.address,
        town : req.body.town,
        openingHours : req.body.openingHours,
        phoneNumber : req.body.phoneNumber,
        doctor : req.body.doctor,
        clinicType : req.body.clinicType,
        clinicProgramme : req.body.clinicProgramme,
        paymentMethod : req.body.paymentMethod,
        publicTransport : req.body.publicTransport,
        carpark : req.body.carpark,
        price : req.body.price,
        rating : req.body.rating,
        currentQueue : req.body.currentQueue,
        queueDetails : req.body.queueDetails,
        lastQueueNumber : req.body.lastQueueNumber
    })

    try {
        await clinicDetails.save()
        console.log("Successful")
        pusher.trigger("Queder", "my-event", {
            message: "Updated"
          });
          
        res.send("Success")
        
    } catch {
        res.send("Fail")
    }

})

/////GET QUEUE NUMBER

router.post('/getqueuenumber', async (req, res) => {

    try {

        //Get the specific clinic's data object from mongoDB based on the id user give
        const individualClinicDetails = await clinicDetails.find({"id" : req.body.id});

        //Add 1 to the {lastQueueNumber} in the clinic data object
        const newQueueNumber = parseInt((individualClinicDetails[0]["lastQueueNumber"])) + 1

        //Get the current {queueDetails}
        const currentQueueDetails = (individualClinicDetails[0]["queueDetails"])

        //Remove the [] to convert from JSON Array to normal string 
        const unJSONarray = currentQueueDetails.replace("[", "").replace("]", "")

        let newQueueDetails = ""

        //Add in the new JSON object together with the [] to convert it back to JSON Array
        if (unJSONarray == "") {
            newQueueDetails = "[" + JSON.stringify({"name" : req.body.name , "queueNumber" : newQueueNumber}) + "]"
        } else {
            newQueueDetails = "[" + unJSONarray + ", " + JSON.stringify({"name" : req.body.name , "queueNumber" : newQueueNumber}) + "]"
        }
        
        console.log(newQueueDetails)

        //Instantiate the variables to update mongoDB
        const filter = {id : req.body.id}
        const update = {
            queueDetails : newQueueDetails,
            lastQueueNumber : newQueueNumber
        }

        //Actually update mongoDB
        await clinicDetails.findOneAndUpdate(filter, update)

        //Send a pusher event to make all devices that has app on to update their queue status
        pusher.trigger("Queder", "my-event", {
            message: "queueDetailsModified",
            id : req.body.id,
            queueDetails : newQueueDetails
          });
                
        res.send(JSON.stringify({
        "queueNumber" : newQueueNumber, 
        "newQueueDetails" : newQueueDetails,
        "transactionCode" : req.body.transactionCode}))
        
    } catch {
        res.send("Fail")
    }

})

///If someone cancel their queue number

router.post('/cancelqueuenumber', async (req, res) => {

    //User Req Data Needed: id and name
    
    try {

    //Get details
    const individualClinicDetails = await clinicDetails.find({"id" : req.body.id});
    const currentQueueDetails = JSON.parse((individualClinicDetails[0]["queueDetails"]))

    //Double check if name exists
    const ifExists = currentQueueDetails.filter(function(el) {
        return el.name == req.body.name;
      });

      console.log(ifExists)

      //Function to check the ifExists function whether the name that user entered is empty anot (Return boolean)
      var isEmpty = function(obj) {
        return Object.keys(obj).length === 0;
      }

     if (isEmpty(ifExists) == true) {

        res.send({"message" : "Error, name not found"})

        } else {

         //Delete name from queue details JSON array
         const newQueueDetails = currentQueueDetails.filter(function(el) {
            return el.name !== req.body.name;
          });

        let newLastQueueNumberString = ""

        if (newQueueDetails == "") {
           newLastQueueNumberString = ifExists[0]["queueNumber"]
        } else {
            newLastQueueNumberString = newQueueDetails[(newQueueDetails.length)-1]["queueNumber"]
        }

        const newLastQueueNumber = parseInt(newLastQueueNumberString) - 1 

         //Instantiate the variables to update mongoDB
         const filter = {id : req.body.id}
         const update = {
             queueDetails : JSON.stringify(newQueueDetails),
             lastQueueNumber : newLastQueueNumber
         }

         //Actually remove it from mongoDB
         let newResult = await clinicDetails.findOneAndUpdate(filter, update, {
             new: true
           });
        
         res.send({"message" : "Success", "result" : newResult})

         //Send a pusher event to make all devices that has app on to update their queue status
         pusher.trigger("Queder", "my-event", {
             message: "queueDetailsModified",
             id : req.body.id,
             queueDetails : newQueueDetails

           });
         }
    
    } catch {
        res.send("Fail")
    }
    
})

module.exports = router