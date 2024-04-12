const db = require('../config/connection')
const bcrypt = require('bcrypt');
const temporaryDoctor = require('../models/temporaryDoctor')
const Doctor = require('../models/doctor')
const DoctorTime = require('../models/doctorScheduleTime')
const DoctorProfile = require('../models/doctorProfile')
const BookingDetails = require('../models/bookingDetails')
const BookingSlot = require('../models/bookingSlot')
const Prescription = require('../models/prescription')
const User = require('../models/user')
const nodemailer = require("nodemailer");

const accountSid = process.env.accountSID
const authToken = process.env.authToken
const serviceSID = "VAa78967673c23cb89843b8a16c0862358"
const client = require("twilio")(accountSid, authToken);


const doctorSignup = (doctorDetails) => {
    return new Promise(async (resolve, reject) => {
        try {
            const existingDoctor = await Doctor.findOne({ email: doctorDetails.formData.email })
            if (!existingDoctor) {
                doctorDetails.formData.password = await bcrypt.hash(doctorDetails.formData.password, 10)
                let doctor = await temporaryDoctor.create(doctorDetails.formData)
                if(doctor) {
                    doctor = await doctor.toObject()
                    client.verify.v2
                        .services(serviceSID)
                        .verifications.create({
                            to: `+91${doctorDetails.formData.number}`,
                            channel: "sms",
                        })
                        .then((verifications) => {
                            console.log(verifications, "hey this is the verification");
                        })
                        .catch((err) => {
                            console.log(err, "bnbnbnbnbnbnbnbn");
                        });
                        resolve({ status : false })
                }
            } else { 
                resolve({ status : true})
            }
        } catch (err) {
            console.error(err);
        }
    })
}

const docOtpVerify = (docOtpDetails) => {
    return new Promise(async(resolve, reject) => {
        try {
            const {otp, number} = docOtpDetails
            if(otp) {
                let otpVerifiedStatus = "";

                    const verification_check = await client.verify.v2
                .services(serviceSID)
                .verificationChecks.create({ to: `+91${number}`, code: otp })
                    otpVerifiedStatus = verification_check.status

                    if(otpVerifiedStatus === "approved") {
                        let doctor = await temporaryDoctor.findOne({ number : number })
                        if(doctor) {
                            let newDoctor = new Doctor(doctor.toObject())
                            newDoctor.signupStatus = "interdict"
                            let doc = await newDoctor.save()
                            doc = doc.toObject()
                            delete doc.password
                            let tempDoctor = await temporaryDoctor.deleteOne({ number: number })
                            resolve({ otpVerifiedStatus, doc })
                        }
                    } else {
                        resolve(otpVerifiedStatus)
                    }
            }
        } catch(err) {
            console.error(err);
        }
    })
}

const addDoctorProfile = (docProf) => {
    let doctorProf = null
    let response = {}
    return new Promise(async (resolve, reject) => {
        try {
            doctorProf = await DoctorProfile.create(docProf)
            if(doctorProf) {
                response.status = true
                resolve(response)
            } else {
                resolve({status : false})
            }
        } catch(err) {
            console.error(err);
            reject(err)
        }
    })
}

const docLogin = (loginDetails) => {
    return new Promise(async(resolve, reject) => {
        let response = {}
        try {
            let doctor = await Doctor.findOne({ email : loginDetails.formData.email })
            if(doctor) {
                doctor = doctor.toObject()
                bcrypt.compare(loginDetails.formData.password, doctor.password).then((status) => {
                    delete doctor.password
                    if(status) {
                        response = doctor
                        response.status = true
                        resolve(response)
                    } else {
                        resolve({ status : false })
                    }
                })
            } else {
                resolve({ status : false })
            }
        } catch(err) {
            console.error(err,'uiuiuiuiuiuiuiuiuiuiuiuiuiuiuiui');
        }
    })
}

const doctorForgotPassword = (email) => {
    return new Promise(async(resolve, reject) => {
        let response = {}
        try {
            let doctor = await Doctor.findOne({ email : email.formData.email})
            if(doctor) {
                doctor = await doctor.toObject()
                let doctorEmail = doctor.email
                response.status = true
                response.email = doctorEmail
                client.verify.v2
            .services(serviceSID)
            .verifications.create({
              to: `+91${doctor.number}`,
              channel: "sms",
            })
            .then((verifications) => {
              console.log(verifications, "hey this is the verification");
            })
            resolve(response)
            } else {
                response.status = false
                resolve(response)
            }
        } catch(err) {
            console.error(err);
        }
    })
}

const doctorForgotPasswordConfirm = (passwordDetails) => {
    let { otp, password, email } = passwordDetails
    let otpVerifiedStatus;
    return new Promise(async(resolve, reject) => {
        try {
            let doctor = await Doctor.findOne({ email : email})
            const verification_check = await client.verify.v2
                .services(serviceSID)
                .verificationChecks.create({ to: `+91${doctor.number}`, code: otp })
            otpVerifiedStatus = verification_check.status

            if (otpVerifiedStatus === 'approved') {
                let updatedPassword;
                let hashPassword = await bcrypt.hash(password, 10)
                updatedPassword = await Doctor.updateOne(
                    { email: email },
                    { $set: { password: hashPassword } }
                );
                resolve({ status: true })
            } else {
                resolve({ status: false })
            }
        } catch(err) {
            console.error(err);
        }
    })
}

const doctorResendOtp = (otpDetails) => {
    return new Promise(async(resolve, reject) => {
        let response = {}
        try {
            let doctor = await Doctor.findOne({ email : otpDetails.doctorEmail })

            if(doctor) {
                doctor = await doctor.toObject()
                response.status = true
                client.verify.v2
                .services(serviceSID)
                .verifications.create({
                  to: `+91${doctor.number}`,
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

const fetchDoctorTimeSchedule = (docId) => {
    return new Promise((resolve, reject) => {
        try {
            DoctorTime.find({ doctorId : docId }).then((response) => {
                resolve(response)
            })
        } catch(err) {
            reject(err)
        }
    })
}

const doctorTimeschedule = (schedule) => {
    return new Promise(async(resolve, reject) => {
        let existingSchedule = []
        try {

            for (const item of schedule) {
                const doctorId = item.doctorId
                existingSchedule = await DoctorTime.find({ doctorId : doctorId })
            }
            schedule.sort((a, b) => {
                const dateA = new Date(a.dateObject.split('/').reverse().join('/'));
                const dateB = new Date(b.dateObject.split('/').reverse().join('/'));
                return dateA - dateB;
            })

            existingSchedule.sort((a, b) => {
                const dateA = new Date(a.dateObject.split('/').reverse().join('/'))
                const dateB = new Date(b.dateObject.split('/').reverse().join('/'))
                return dateA - dateB
            })
            let commonDates = []
             
            existingSchedule.forEach(existingAppt => {
                let matchingAppt = schedule.find(scheduleAppt => scheduleAppt.dateObject === existingAppt.dateObject)

                if(matchingAppt) {
                    commonDates.push(existingAppt.dateObject)
                }
            })

            if(commonDates.length > 0) {
                resolve({ status : true })
            } else {
                let addSchedule = await DoctorTime.create(schedule)
                resolve({ status : false })
            }
        } catch(err) {
            console.error(err);
        }
    })
}

const deleteDoctorSchedule = (timeId) => {
    return new Promise(async(resolve, reject) => {
        try {
            let deletedStatus = await DoctorTime.deleteOne({ _id : timeId.timeId })
            resolve({ status : true })
        } catch(err) {
            console.error(err);
        }
    })
}

const deletePastSchedule = () => {
    return new Promise(async(resolve, reject) => {
        let del = await DoctorTime.find()
        resolve(del)
    })
}

const removePasrSchedule = (pastScheduleId) => {
    return new Promise(async(resolve, reject) => {
        try {
            const deleted = await DoctorTime.deleteMany({ _id : { $in : pastScheduleId } })
            resolve(deleted)
        } catch(err) {
            console.error(err);
        }
    })
}

const fetchDoctorProfile = (doctorId) => {
    return new Promise(async (resolve, reject) => {
        await DoctorProfile.findOne({ doctorId: doctorId.docId }).then((doctorProfile) => {
            resolve(doctorProfile)
        })
    })
}

const fetchBookingDetails = (docId) => {
    return new Promise(async(resolve, reject) => {
        try {
            let bookings = await BookingSlot.find({ docId : docId.doctorId })
            if(bookings) {
                resolve(bookings)
            } else {
                reject()
            }
        } catch(err) {
            console.error(err);
        }
    })
}

const invitingPatient = (invitingDetails) => {
    return new Promise(async(resolve, reject) => {
        try {
            let bookings = await BookingDetails.findOne({ userEmail : invitingDetails.bookinguseremail })
            if(bookings) {
                const transporter = nodemailer.createTransport({
                    host: "forward-email=centaurr252@gmail.com",
                    port: 465,
                    secure: true,
                    service: 'Gmail',
                    auth: {
                      // TODO: replace `user` and `pass` values from <https://forwardemail.net>
                      user: 'centaurr252@gmail.com',
                      pass: 'nuslvzvfidhqyjrr',
                    },
                  });


                  async function main() {
                    // send mail with defined transport object
                    const info = await transporter.sendMail({
                        from: 'centaurr252@gmail.com', // sender address
                        to: invitingDetails.bookinguseremail, // list of receivers
                    subject: "Hello ✔", // Subject line
                    text: 'copy this url to your browser', // plain text body
                    html: `<p>${invitingDetails.urlWithData}</p>`, // html body
                  });                                  
                }
                
                main().catch(console.error);

                resolve({status : true})
            }
        } catch(err) {
            console.error(err,'inviting error');
        }
    })
}

const fetchDocPaymentDetails = (docId) => {
    return new Promise(async(resolve, reject) => {
        try {
            const paymentDetails = await BookingDetails.find({ doctorId : docId.doctorId })
            resolve(paymentDetails)
        } catch(err) {
            console.error(err);
        }
    })
}

const addPrescription = (pdfDetails) => {
    return new Promise(async(resolve, reject) => {
        try {
            let bookingDetails = await BookingSlot.findOne({ _id : pdfDetails.bookingId })
            let prescriptionDetails = {
                ...pdfDetails,
                doctorfirstname : bookingDetails.doctorfirstname,
                doctorlastname : bookingDetails.doctorlastname,
                department : bookingDetails.department,
                patientfirstname : bookingDetails.patientfirstname,
                patientlastname : bookingDetails.lastname,
                bookingDate : bookingDetails.bookingDate,
                bookingtime : bookingDetails.slotTime
            }
            let pdf = await Prescription.create(prescriptionDetails)
            if(pdf) {
                let bookingId = pdfDetails.bookingId
                await BookingSlot.deleteOne({ _id : bookingId})
                resolve({ status : true })
            }
        } catch(err) {
            console.error(err); 
        }
    })
}

const fetchPatientDetails = (patientId) => {
    return new Promise(async(resolve, reject) => {
        try {
            let patientDetails = await User.findOne({ _id : patientId.patientId })
            resolve(patientDetails)
        } catch(err) {
            console.error(err);
        }
    })
}

const fetchEditProfile = (doctorId) => {
    return new Promise(async(resolve, reject) => {
        try {
            let doctorProfile = await DoctorProfile.findOne({ doctorId : doctorId.doctorId })
            resolve(doctorProfile)
        } catch(err) {
            console.error(err);
        }
    })
}

const updateDocProfile = (docProf) => {
    console.log(docProf,'---------------11111');
    return new Promise(async(resolve, reject) => {
        try {
            let updateDocProf = await DoctorProfile.updateOne({ doctorId : docProf.doctorId}, {$set : {
                imageName : docProf.imageName,
                firstname : docProf.firstname,
                lastname : docProf.lastname,
                department : docProf.department,
                gender : docProf.gender,
                number : docProf.number,
                email : docProf.email,
                house : docProf.house,
                village : docProf.village,
                city : docProf.city,
                year : docProf.year,
                degree : docProf.degree,
                college : docProf.college,
                experiencedyear : docProf.experiencedyear,
                workeddepartment : docProf.workeddepartment,
                position : docProf.position,
                hospital : docProf.hospital,
                description : docProf.description,
                fee : docProf.fee,
            }})
            resolve({ status : true })
        } catch(err) {
            console.error(err);
        }
    })
}

module.exports = {
    doctorSignup,
    docOtpVerify,
    addDoctorProfile,
    docLogin,
    doctorForgotPassword,
    doctorForgotPasswordConfirm,
    doctorResendOtp,
    fetchDoctorTimeSchedule,
    doctorTimeschedule,
    deleteDoctorSchedule,
    deletePastSchedule,
    removePasrSchedule,
    fetchDoctorProfile,
    fetchBookingDetails,
    invitingPatient,
    fetchDocPaymentDetails,
    addPrescription,
    fetchPatientDetails,
    fetchEditProfile,
    updateDocProfile
}