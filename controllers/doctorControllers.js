const express = require("express");
const doctorHelpers = require('../helpers/doctorHelpers')
const jwt = require('jsonwebtoken')
const { S3Client, PutObjectCommand, GetObjectCommand} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const env = require('dotenv').config({path: __dirname + '/../.env'})
const crypto = require('crypto');
const sharp = require('sharp');
const { signDoctor } = require('../middlewares/jwt');
const puppeteer=require('puppeteer')
const BASE_URL = process.env.BASE_URL

const randomNameImage = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

const bucketName = process.env.BUCKET_NAME
const region = process.env.BUCKET_REGION
const accessKey = process.env.ACCESS_KEY
const secretAccessKey = process.env.SECRET_ACCESS_KEY

const s3 = new S3Client({
    credentials : {
        accessKeyId: accessKey,
        secretAccessKey:secretAccessKey,
    },
    region: region
})

const doctorSignup = async (req, res) => {
    try {
        let doctor = await doctorHelpers.doctorSignup(req.body)
        if(doctor.status) {
            res.status(200).json({ message : 'Email already exist'}); // Send a response with the updated user data
        } else {
            res.status(200).json({ status : true }); // Handle the error gracefully
        }
    } catch(err) {
        console.error(err);
    }
}

let doctorOtpVerification = async (req, res) => {
    try {
        let docOtpVerify = await doctorHelpers.docOtpVerify(req.body)
        if(docOtpVerify.otpVerifiedStatus === 'approved') {
            let { otpVerifiedStatus, doc } = docOtpVerify
            res.status(200).json({message : 'otp verified successfully',otpVerifiedStatus, doc })
        } else {
            res.status(200).json({ error : "Otp is incorrect"})
        }
    } catch(err) {
        if (err) {
            res.status(500).json({ error: "Twilio resource not found" });
        } else {
            res.status(500).json({ message: 'OTP is not matched' });
        }
    }
}

let doctorAddProfile = async(req, res) => {
    let docprof = null
    try {
        const buffer = await sharp(req.file.buffer).resize({ height : 386, width : 271, fit : 'inside'}).toBuffer()
        const imageName = randomNameImage() 
        const params = {
            Bucket : bucketName,
            Key : imageName,
            Body : buffer,
            ContentType : req.file.mimetype,
        }
    
        const command = new PutObjectCommand(params)
        await s3.send(command)

        docprof = req.body
        docprof.imageName = imageName
        docprof.signupStatus = 'Interdict'

        let doctorProfileAddedStatus = await doctorHelpers.addDoctorProfile(docprof)
        if(doctorProfileAddedStatus) {
            res.status(200).json({ status : true, message : 'Your profile added successfully'})
        } else {
            res.status(200).json({ status : false, message : 'Something went to wrong'})
        }
    } catch(err) {
        console.error(err,'vtyyyyyy');
    }
}

let doctorLogin = async (req, res) => {
    try{
        let response = await doctorHelpers.docLogin(req.body)
        if (!response) {
            res.status(500).json({ status: false, message: 'Login failed. Invalid response.' });
            return;
        }
        if(response.status) {
            if(response.signupStatus === "Approved") {
                const token = await signDoctor(response)
                res.status(200).json({ status : true, message : "Login Successful", user : response, auth : token })
            } else {
                res.status(200).json({ status : true, message : 'Approval pending', user : response })
            }
        } else {
            res.status(200).json({status: false, error: 'Login failed. Invalid credentials.'});
        }
    } catch(err) {
        res.status(500).json({ status: false, message: 'Internal server error.' });
    }
   
}

const doctorForgotPassword = (req, res) => {
    try {
        doctorHelpers.doctorForgotPassword(req.body).then((response) => {
            if(response.status) {
                res.status(200).json({ message : "Otp send successfully", response })
            } else {
                res.status(200).json({ error : "Invalid email", response })
            }
        })
    } catch(err) {
        console.error(err);
    }
}

const doctorForgotPasswordConfirm = (req, res) => {
    try {
        doctorHelpers.doctorForgotPasswordConfirm(req.body).then((response) => {
            if(response.status) {
                res.status(200).json({ message: "Password updated successfully", response })
            } else {
                res.status(200).json({ error: "Incorrect OTP", response })
            }
        })
    } catch(err) {
        console.error(err);
    }
}

const doctorResendOtp = (req, res) => {
    doctorHelpers.doctorResendOtp(req.body)
}

const fetchDoctorTimeSchedule = async (req, res) => {
    let docId = req.query.docId
    try {
        let timeSchedule = await doctorHelpers.fetchDoctorTimeSchedule(docId)
        if(timeSchedule) {
            res.status(200).json({timeSchedule})
        } else {
            res.status(401).json({messege : 'something went to wrong'})
        }
    } catch(err) {
        console.error(err);
    }
}

const doctorTimeschedule = (req, res) => {
    try {
        const week = new Date(req.body.date)
        const options = { weekday : 'long' };
        const dateOfWeek = new Intl.DateTimeFormat('en-US', options).format(week)
        
        let dateObject = new Date(req.body.date)
        dateObject = dateObject.toLocaleDateString()
    
        let timeFromObject = new Date(req.body.formattedTimeFrom)
    timeFromObject = timeFromObject.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })

    let timeToObject = new Date(req.body.formattedTimeTo)
    timeToObject = timeToObject.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })

    let slots = req.body.slots
    let doctorId = req.body.doctorId
    let presentDate = new Date()

        const [day, month, year] = dateObject.split("/").map(Number);
        const startDate = new Date(year, month - 1, day);

        const dayOfWeekIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(dateOfWeek.toLowerCase());

        const weeklySchedule = [];

        for (let i = 0; i < 5; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + (i * 7) + (dayOfWeekIndex - currentDate.getDay() + 7) % 7);
                
            weeklySchedule.push({
              dateObject: currentDate.toLocaleDateString(),
              dateOfWeek,
              timeFromObject,
              timeToObject,
              slots,
              doctorId,
              presentDate
            });
          }

          doctorHelpers.doctorTimeschedule(weeklySchedule).then((response) => {
            res.status(200).json({ response })
          })
    } catch(err) {
        console.error(err);
    }
}

const deleteDoctorSchedule = (req, res) => {
    try {
        doctorHelpers.deleteDoctorSchedule(req.body).then((status) => {
            res.status(200).json({ status })
        })
    } catch(err) {
        console.error(err);
    }
}

const deletePastSchedule = (req, res) => {
    try {
        doctorHelpers.deletePastSchedule().then((doctorTime) => {
            const currentDate = new Date()
            let currentDateStr = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
            let filteredData = doctorTime.filter(doc => {
                let [day, month, year] = doc.dateObject.split('/');
                day = parseInt(day);
                month = parseInt(month);
                year = parseInt(year);
                let dateObject = new Date(year, month - 1, day);
                
                let [ currentDay, currentMonth, currentYear ] = currentDateStr.split('/')
                currentDay = parseInt(currentDay)
                currentMonth = parseInt(currentMonth)
                currentYear = parseInt(currentYear)

                let presentDate = new Date(currentYear, currentMonth - 1, currentDay)

                console.log(dateObject.getTime() +' = '+ presentDate.getTime());
                if(dateObject.getTime() < presentDate.getTime()) {
                    return doc
                }
            })
            doctorHelpers.removePasrSchedule(filteredData).then((response) => {
                res.status(200).json({ response })
            })
        })
    } catch(err) {
        console.error(err);
    }
}

let fetchDoctorProfile = async (req, res) => {
    try {
      let response = await doctorHelpers.fetchDoctorProfile(req.query);
  
      const getIbjectParams = {
        Bucket: bucketName,
        Key: response.imageName,
      };
  
      const command = new GetObjectCommand(getIbjectParams);
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      response.imageUrl = url
      let docImageUrl = response.imageUrl

      if(docImageUrl) {
          res.status(200).json({message : 'profile added successfully', doctor : response, imageUrl : docImageUrl})
      } else {
          res.status(401).json({message : 'something went to wrong'})
      }
  
    } catch (err) {
      console.error(err, "doc profile fetch error");
    }
  }

  const fetchBookingDetails = (req, res) => {
    doctorHelpers.fetchBookingDetails(req.query).then((response) => {
        if(response) {
            res.status(200).json({ response })
        } else {
            res.status(401).json({ message : 'You have no bookings'})
        }
    })
}

const invitingPatient = (req, res) => {
    try { 
        const { peerId, bookinguseremail } = req.query
    
        const { URLSearchParams } = require('url');
    
        const baseUrl = `${BASE_URL}/http://localhost:5173/doctors/remoteuservideo`
        const params = new URLSearchParams({ peerId : peerId})
        const urlWithData = `${baseUrl}?${params.toString() || ''}`
        
        doctorHelpers.invitingPatient({bookinguseremail,urlWithData})
    } catch(err) {
        console.error(err);
    }
}

const fetchDocPaymentDetails = (req, res) => {
    try { 
        doctorHelpers.fetchDocPaymentDetails(req.query).then((response) => {
            res.status(200).json({ response })
        })
    } catch(err) {
        console.error(err);
    }
}

const addPrescription = async(req, res) => {
    try {
        const { formData, patientId, doctorId, bookingId } = req.body

        const htmlContent = `
        <html>
                <head>
                    <title>Prescription</title>
                    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                </head>
                <body>
                    <div class='border mx-40 my-10'>
                        <div class='flex justify-center item-center pt-5'>
                            <img class='bg-blue-500' src="https://www.asterhospitals.in/themes/custom/aster/aster-logo.svg" alt="" />
                        </div>
                        <div class='px-5 pt-5'>
                            <h1 class='text-2xl font-semibold mb-2'>Prescription Details</h1>
                            <div class='flex justify-between'>
                                <div>
                                    <p><span class='font-semibold'>Name:</span> ${formData?.patientfirstname ?? ''} ${formData?.lastName ?? ''}</p>
                                    <p><span class='font-semibold'>Date:</span> ${formData?.dob ?? ''}</p>
                                </div>
                                <div>
                                    <p><span class='font-semibold'>Age:</span> ${formData?.age ?? ''}</p>
                                    <p><span class='font-semibold'>Disease:</span> ${formData?.disease ?? ''}</p>
                                    <p><span class='font-semibold'>Gender:</span> ${formData?.gender ?? ''}</p>
                                </div>
                            </div>
                            <hr class='my-3'>
                            <div class='flex justify-center items-center gap-10'>
                                <div class='flex flex-col gap-2'>
                                    <p class='font-semibold underline'>Medicines</p>
                                    ${formData?.medicine ? formData.medicine.split('\n').map((medicine, index) => (
                                        `<div key=${index}>${medicine}</div>`
                                    )).join('') : ''}
                                </div>
                                <div class='flex flex-col gap-2'>
                                    <p class='font-semibold underline'>Tests</p>
                                    ${formData?.test ? formData.test.split('\n').map((test, index) => (
                                        `<div key=${index}>${test}</div>`
                                    )).join('') : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;

        const browser = await puppeteer.launch();
        const page= await browser.newPage()
        await page.setViewport({
            width:1000,
            height:800
        })

        await page.setContent(htmlContent);

        // Generate the PDF buffer
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true
        });

        await browser.close();

        const pdfBase64 = pdfBuffer.toString('base64');

        const body = {
            patientId,
            pdfBase64,
            doctorId,
            bookingId
        }

        doctorHelpers.addPrescription(body).then((status) => {
            res.status(200).json({ status })
        })
    } catch(err) {
        console.error(err);
        res.status(500).send('Error generating PDF');
    }
}

const fetchPatientDetails = (req, res) => {
    try {
        doctorHelpers.fetchPatientDetails(req.query).then((response) => {
            res.status(200).json({ response })
        })
    } catch(err) {
        console.error(err);
    }
}

module.exports = {
    doctorSignup,
    doctorOtpVerification,
    doctorAddProfile,
    doctorLogin,
    doctorForgotPassword,
    doctorForgotPasswordConfirm,
    doctorResendOtp,
    fetchDoctorTimeSchedule,
    doctorTimeschedule,
    deleteDoctorSchedule,
    deletePastSchedule,
    fetchDoctorProfile,
    fetchBookingDetails,
    invitingPatient,
    fetchDocPaymentDetails,
    addPrescription,
    fetchPatientDetails,
}
