const express = require('express')
const router = express.Router()
const Clinic = require('../models/clinicDetails')
const clinicDetails = require('../models/clinicDetails');
const Pusher = require("pusher");
const User = require('../models/loginDetails');
const UserDetails = require('../models/loginDetails');
const loginDetailsDB = require('../models/loginDetails');
const nodemailer = require("nodemailer");
const { trusted } = require('mongoose');

let OTParray = '[]'
let OTPnumber = 0
let OTPid = 0


if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}


//DEFINING FUNCTION TO SEND OTP TO EMAIL
async function sendOTP(email) {

    //Instantiate the nodemailer variables
    
    let transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USERNAME, 
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      //Generate otp number and unique id

      OTPnumber = Math.floor(Math.random() * 90000) + 10000;
      OTPid = Math.floor(Math.random() * 900000000) + 100000000;
    
      //Send to user's email
      let OTPmail = await transporter.sendMail({
        from: '"Queder" <otp@tohruichen.com>', // sender address
        to: email, // list of receivers
        subject: "One Time Password Verification", // Subject line
        html: `Your One-Time Password is <b>${OTPnumber}</b>. Valid for 3 minutes`,
              
      });

      //First get the current array and turn into json array then add the newly generate data 
      //into the temp array and convert it back to string

      let OTParrayJSON = JSON.parse(OTParray)
      OTParrayJSON.push({"id" : OTPid , "otp" : OTPnumber})
      OTParray = JSON.stringify(OTParrayJSON)

      //res.send({"status" : "Success", "OTPid" : OTPid})
       
}

//// CHECK IF EMAIL EXISTS

router.post('/checkEmail', async (req, res) => {

    try {

        ///Check DB if there is any same email
        const checkDB = await loginDetailsDB.find({"email" : req.body.email});

         if (checkDB.length > 0) {
            sendOTP(req.body.email)  
            const firstName = checkDB[0]["firstName"]
            const fullName = checkDB[0]["fullName"]
            const imageUrl = checkDB[0]["imageUrl"]
            res.send({"message" : "oldUser" , "accessType" : "login", "OTPid" : OTPid, "firstName" : firstName, "fullName" : fullName, "imageUrl" : imageUrl})
            } else {
            res.send({"message" : "newUser"})
         }
    } catch {
        res.send({"message" : "Error"})
    }

})

router.post('/checkAccountDetails', async (req, res) => {

    try {

        ///Check DB if there is any same NRIC
        const checkNRIC = await loginDetailsDB.find({"nric" : req.body.nric});

        ///Check DB if there is any same Phone Number
        const checkPhone = await loginDetailsDB.find({"phoneNumber" : req.body.phoneNumber});

         if (checkNRIC.length > 0) {
            res.send({"status" : "Error" , "message" : "NRIC already exist"})
            console.log("1")
            } else if (checkPhone.length > 0) {
                res.send({"status" : "Error" , "message" : "Phone Number already exist"})
                console.log("2")
              } else {
                sendOTP(req.body.email) 
                console.log("3")
                res.send({"status" : "Success" , "OTPid" : OTPid})               
            }
    } catch {
        res.send({"message" : "Error"})
    }

})



router.post('/verifyOTP', async (req, res) => { 

    let OTP = null
    
    let OTPfromUser = req.body.OTPfromUser
    let OTPidFromUser = req.body.OTPidFromUser


    let OTParrayJSON = JSON.parse(OTParray)

    const ifExists = OTParrayJSON.filter(function(el) {
        return el.id == OTPidFromUser;
      });

      if (ifExists.length == 1) {
        OTP = ifExists[0]["otp"]
      } else {
        res.send("OTP ID not valid.")
      }

      try {

        if (OTP == parseInt(OTPfromUser)) {
           
          const deleteObj = (data, column, search) => {
            let result = data.filter(m => m[column] !== search)
          
            return result;
          }
          
          let currentOTParray = JSON.parse(OTParray)
          let newOTParray = deleteObj(currentOTParray, 'id', OTPidFromUser)
          OTParray = JSON.stringify(newOTParray)
          console.log(OTParray)

          let accessType = req.body.accessType

          if (accessType == "login") {
            res.send({"message" : "Login Successful"})
          } else if (accessType == "register") {
            
            const User = new UserDetails({

              firstName : req.body.firstName,
              fullName : req.body.fullName,
              nric : req.body.nric,
              email : req.body.email,
              phoneNumberEx : req.body.phoneNumberEx,
              phoneNumber : req.body.phoneNumber,
              password : req.body.password,
              imageUrl : req.body.imageUrl,
          })

          try {
            await User.save()        
            res.send({"message" : "Register Successful"})
            
          } catch {
            res.send({"message" : "Register Fail"})
          }
        }

        } else {
            res.send("OTP not the same")
        }

      } catch (error) {
        
      }
})


router.post('/sendOTPtest', async (req, res) => { 

    try {
        sendOTP(req.body.email)
        res.send({"Response" : "Success", "otpId" : otpId})
    } catch (error) {
        res.send("Error in sending OTP mail")
    }
})

module.exports = router