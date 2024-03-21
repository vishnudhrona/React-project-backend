const db = require('../config/connection')
const bcrypt = require('bcrypt');
const env = require('dotenv').config({path: __dirname + '/../.env'})
const User = require('../models/user')
const temporaryUser = require('../models/temporaryUser')
const DoctorProfile = require('../models/doctorProfile')
const DoctorTime = require('../models/doctorScheduleTime')
const BookingSlot = require('../models/bookingSlot')
const BookingDetails = require('../models/bookingDetails')
const Prescription = require('../models/prescription')
const Razorpay = require('razorpay');

var instance = new Razorpay({ 
    key_id: process.env.key_id, 
    key_secret: process.env.key_secret 
})

const accountSid = process.env.accountSID
const authToken = process.env.authToken
const serviceSID = "VAa78967673c23cb89843b8a16c0862358"
const client = require("twilio")(accountSid, authToken);

const userSignup = (userData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const existingUser = await User.findOne({ email: userData.email })
            if (!existingUser) {
                userData.password = await bcrypt.hash(userData.password, 10)
                let user = await temporaryUser.create(userData)
                if (user) {
                    client.verify.v2
                        .services(serviceSID)
                        .verifications.create({
                            to: `+91${userData.number}`,
                            channel: "sms",
                        })
                        .then((verifications) => {
                            console.log(verifications, "hey this is the verification");
                        })
                        .catch((err) => {
                            console.log(err, "bnbnbnbnbnbnbnbn");
                        });

                        resolve(user)
                }
            } else {
                resolve({ status: true })
            }
        } catch (err) {
            console.error(err);
        }
    })
}

const otpVerification = (otpDetails) => {
    return new Promise(async(resolve, reject) => {
        try {
            const { otp, number } = otpDetails
            if (otp) {
                const verification_check = await client.verify.v2
                    .services(serviceSID)
                    .verificationChecks.create({ to: `+91${number}`, code: otp })
                let otpVerifiedStatus = verification_check.status

                if(otpVerifiedStatus === 'approved') {
                    let user = await temporaryUser.findOne({number : number})
                    if (user) {
                        let newPatient = new User(user.toObject())
                        newPatient.signupStatus = 'unblock';
                        let patient = await newPatient.save()
                        patient = patient.toObject()
                        delete patient.password
                        let tempUser = await temporaryUser.deleteOne({ number: number })
                        resolve({otpVerifiedStatus, patient})
                    }
                } else { 
                    resolve(otpVerifiedStatus)
                }
            }
        } catch (err) {
            console.error(err);
        }
    })
 }

 const signupResendOtp = (number) => {
    return new Promise((resolve, reject) => {
        client.verify.v2
        .services(serviceSID)
        .verifications.create({
          to: `+91${number.number}`,
          channel: "sms",
        })
        .then((verifications) => {
          console.log(verifications, "hey this is the verification");
        })
        .catch((err) => {
          console.log(err, "bnbnbnbnbnbnbnbn");
        });
    })
}

const userLogin = (loginCredentials) => {
    return new Promise(async(resolve, reject) => {
        let response = {};
        let user = await User.findOne({ email : loginCredentials.formData.email })
        if(!user) {
            resolve({status : 'nouser'})
        } else {
            user = await user.toObject()
        }        
        if(user) {
            bcrypt.compare(loginCredentials.formData.password, user.password).then((status) => {
                delete user.password
                if(status) {
                    response.user = user
                    response.status = "unblock"
                    resolve(response);
                } else {
                    resolve({ status : "block" })
                }
            })
        } else {
            resolve({ status : "block" })
        }
    })
}

const forgotPassword = (email) => {
    return new Promise(async(resolve, reject) => {
        let response = {}
        try{
            let user = await User.findOne({ email : email.formData.email })
        if(user) {
            user = await user.toObject() 
            let useremail = user.email
            response.status = true
            response.email = useremail
          client.verify.v2
            .services(serviceSID)
            .verifications.create({
              to: `+91${user.number}`,
              channel: "sms",
            })
            .then((verifications) => {
              console.log(verifications, "hey this is the verification");
            })
            resolve(response)
    } else {
        response.status = false;
        resolve(response)
    }
        } catch(err) {
            console.log(err,'tyutyutyu');
        }
        
    })
}

const forgotPasswordConfirm = (newPassword) => {
    let { otp, password, email } = newPassword
    let otpVerifiedStatus;
    return new Promise(async (resolve, reject) => {
        try {
            let user = await User.findOne({ email : email })
            const verification_check = await client.verify.v2
                .services(serviceSID)
                .verificationChecks.create({ to: `+91${user.number}`, code: otp })
            otpVerifiedStatus = verification_check.status

            if (otpVerifiedStatus === 'approved') {
                let updatedPassword;
                let hashPassword = await bcrypt.hash(password, 10)
                updatedPassword = await User.updateOne(
                    { email: email },
                    { $set: { password: hashPassword } }
                );
                resolve({ status: true })
            } else {
                resolve({ status: false })
            }
        } catch (err) {
            console.error(err);
        }
    })
}

const resendOtp = (email) => {
    return new Promise(async(resolve, reject) => {
        let response = {}
        try {
            let user = await User.findOne({ email : email.formData.userEmail })
            if(user) {
                user = await user.toObject() 
                response.status = true
              client.verify.v2
                .services(serviceSID)
                .verifications.create({
                  to: `+91${user.number}`,
                  channel: "sms",
                })
                .then((verifications) => {
                  console.log(verifications, "hey this is the verification");
                })
                resolve(response)
            }
        } catch(err) {
            console.error(err);
        }
    })
}

const sortDoctor = (speciality) => {
 return new Promise(async(resolve, reject) => {
    if(speciality.search) {
            let dep = await DoctorProfile.find({
                department: speciality.search
             }); 
             let filteredDoc = dep.filter((value) => value.signupStatus === 'Approved')
               resolve(filteredDoc)
    } else {
        await DoctorProfile.find().sort({ firstname : 1 }).then((docProf) => {
            let filteredDocProf = docProf.filter((value) => value.signupStatus === 'Approved')
            resolve(filteredDocProf)
        })
    }
 })
}

const fetchUserSideSchedule = (docId) => {
    return new Promise(async(resolve, reject) => {
        try {
            await DoctorProfile.findOne({doctorId : docId.docId}).then(async(doctor) => {
                if(doctor) {
                   await DoctorTime.find({doctorId : docId.docId}).then((timeSchedule) => {
                        resolve({scheduledTime : timeSchedule, doctor : doctor})
                    })
                } else {
                    resolve({ doctor: null, scheduledTime: null });
                }
            })
        } catch(err) {
            console.error(err);
        }
    })
}

const fetchTime = (timeId) => {
    return new Promise(async(resolve, reject) => {
        try {
            let timeSchedule = await DoctorTime.findOne({_id : timeId.timeId})
            if(timeSchedule) {
                let doctorId = timeSchedule.doctorId
                let doctor = await DoctorProfile.findOne({doctorId : doctorId})
                resolve({timeSchedule, doctor})
            }
        } catch(err) {
            reject(err)
        }
       
    })
}

const slotBooking = (slotBookingDetails) => {
    return new Promise(async(resolve, reject) => {
        try {
            let doctorDetails = await DoctorProfile.findOne({ doctorId : slotBookingDetails.docId })
            let patientDetails = await User.findOne({ _id : slotBookingDetails.patientId })

            slotBookingDetails = {
                ...slotBookingDetails,
                patientfirstname : patientDetails.patientfirstname,
                lastname : patientDetails.lastName,
                patientnum : patientDetails.number,
                patientemail : patientDetails.email,
                department : doctorDetails.department,
                doctorfirstname : doctorDetails.firstname,
                doctorlastname : doctorDetails.lastname,
                docnumber : doctorDetails.number,
                paymentStatus: 'pending'
            }

            await BookingSlot.create(slotBookingDetails).then((response) => {
                resolve(response)
            })
        } catch(err) {
            console.error(err);
        }
    })
}

const fetchPaymentDetails = (fetchDetails) => {
    const {docId, userId, dateId} = fetchDetails
    return new Promise(async(resolve, reject) => {
        try {
            let doctorProfile = await DoctorProfile.findOne({_id: docId})
            let user = await User.findOne({_id : userId})
            user = await user.toObject()
            let bookedDate = await DoctorTime.findOne({ _id : dateId})
    
            if(doctorProfile && user) {
                let bookedSlot = await BookingSlot.find({ patientId : userId }).sort({_id : -1}).limit(1)
                resolve({doctorProfile, user, bookedSlot, bookedDate})
            }
        } catch(err) {
            reject(err)
        }
    })
}

const razorPayPayment = (paymentDetails) => {
    const {totalAmount, user, doctor, date, timeSchedule} = paymentDetails
    let slotTime = timeSchedule[0].slotTime
    return new Promise(async(resolve, reject) => {
        docBookingObj = {
            doctorDetails : {
                doctorFirstName : doctor.firstname,
                doctorLastName : doctor.lastname,
                department : doctor.department,
                qualification : doctor.degree,
                hospital : doctor.hospital,
                fee : totalAmount,
            },
            userId : user._id,
            userFirstName : user.patientfirstname,
            userLastName : user.lastName,
            userNumber : user.number,
            userDob : user.dob,
            userEmail : user.email,
            bookingDate : date.dateObject,
            bookingTime : slotTime,
            doctorId : doctor.doctorId,
            paymentStatus : 'pending',
            adminPaymentStatus : 'pending'

        }

        let bookedDetails = await BookingDetails.create(docBookingObj)
            resolve(bookedDetails._id)
    })
}

const generateRazorPay = (bookedId, totalAmount) => {
    return new Promise((resolve, reject) => {
        var options = {
            amount : totalAmount*100 ,
            currency : 'INR',
            receipt : ""+bookedId
        }

        instance.orders.create(options, function(err, order) {
            if(err) {
                console.log(err,'payment error');
            } else {
                console.log(order,'order successsss');
                resolve(order)
            }
          });

    })
}

const paymentVerification = (paymentDetails) => {
    let bookingId = paymentDetails.bookingId[0]._id
    return new Promise(async(resolve, reject) => {
        try {
            const crypto = require('crypto')
            function calculateHmacSha256(data, key) {
                const hmac = crypto.createHmac('sha256', key);
                hmac.update(data);
                return hmac.digest('hex');
              }

              const order_id = paymentDetails.order.id;
              const razorpay_payment_id = paymentDetails.res.razorpay_payment_id;
              const secret = process.env.key_secret;

              const generated_signature = calculateHmacSha256(`${order_id}|${razorpay_payment_id}`, secret);

            if(generated_signature == paymentDetails.res.razorpay_signature) {
                let BookingPaymentStatus = await BookingSlot.updateOne({ _id : bookingId }, {$set : {paymentStatus : 'success'}})
                resolve({ status : true })
            } else {
                reject(new Error("HMAC verification failed"))
            }
        } catch(err) {
            console.error(err,'nnnnnnnn');
        }
    })
}

const hideenBookingTime = (bookingDetails) => {
    return new Promise(async(resolve, reject) => {
        try {
            let hidden = await BookingSlot.find({ docId : bookingDetails.doctorId })
           resolve(hidden)
        } catch(err) {
            console.error(err);
        }
    })
}

const fetchUserProfile = (patientId) => {
    return new Promise(async(resolve, reject) => {
        try {
            let patientDetails = await User.findOne({ _id : patientId.patientId})
            let bookingDetails = await BookingSlot.find({ patientId : patientId.patientId})
            resolve({ patientDetails, bookingDetails })
        } catch(err) {
            console.error(err);
        }
    })
}

const deleteBooking = (bookingId) => {
    return new Promise(async(resolve, reject) => {
        try {
            let deleteBooking = await BookingSlot.deleteOne({ _id : bookingId.bookingId })
            resolve(deleteBooking)
        } catch(err) {
            console.error(err);
        }
    })
}

const fetchUserDetails = (patientId) => {
    return new Promise(async(resolve, reject) => {
        try {
            let patientDetails = await User.findOne({ _id : patientId.patientId })
            resolve(patientDetails)
        } catch(err) {
            console.error(err);
        }
    })
}

const updatePatientData = (patientDetails) => {
    return new Promise(async(resolve, reject) => {
        try {
            let updatedPatient = await User.updateOne({ _id : patientDetails._id},{$set : {
                patientfirstname : patientDetails.patientfirstname,
                lastName : patientDetails.lastName,
                dob : patientDetails.dob,
                gender : patientDetails.gender,
                number : patientDetails.number,
                email : patientDetails.email
            }})
            resolve(updatedPatient)
        } catch(err) {
            console.error(err);
        }
    })
}

const deletePendingSlots = () => {
    return new Promise((resolve, reject) => {
        try {
            BookingSlot.deleteMany({ paymentStatus : 'pending' }).then((response) => {
                resolve(response)
            })
        } catch(err) {
            console.error(err);
        }
    })
}

const fetchPrescription = (patientId) => {
    return new Promise(async(resolve, reject) => {
        try {
            let prescription = await Prescription.find({ patientId : patientId.patientId }).sort({ _id : -1})
            resolve(prescription)
        } catch(err) {
            console.error(err);
        }
    })
}

const fetchLastAppointment = (patientId) => {
    return new Promise(async(resolve, reject) => {
        try {
            const lastBooking = await BookingSlot.findOne({ patientId : patientId.patientId })
            .sort({ _id : -1 }).limit(1) 
            resolve(lastBooking)
        } catch(err) {
            console.error(err);
        }
    })
}

const landingPageFetchDoctors = () => {
    return new Promise((resolve, reject) => {
        DoctorProfile.find().then((doctors) => {
                resolve(doctors)
        })
    })
}

module.exports = {
    userSignup,
    otpVerification,
    signupResendOtp,
    userLogin,
    forgotPassword,
    forgotPasswordConfirm,
    resendOtp,
    sortDoctor,
    fetchUserSideSchedule,
    fetchTime,
    slotBooking,
    fetchPaymentDetails,
    razorPayPayment,
    generateRazorPay,
    paymentVerification,
    hideenBookingTime, 
    fetchUserProfile,
    deleteBooking,
    fetchUserDetails, 
    updatePatientData,
    deletePendingSlots,
    fetchPrescription,
    fetchLastAppointment,
    landingPageFetchDoctors
}
