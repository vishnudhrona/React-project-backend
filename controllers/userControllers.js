const express = require("express");
const cors = require("cors");
const router = express.Router();
const userHelpers = require('../helpers/userHelpers')
const { signUser } = require('../middlewares/jwt')
const { S3Client, PutObjectCommand, GetObjectCommand} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

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

const userSignup = async (req, res, next) => {
    try {
        const { dob } = req.body
        let dateOfBirth = new Date(dob)
        dateOfBirth = dateOfBirth.toLocaleDateString()
        const body = {
            ...req.body.formData,
            dateOfBirth
        }
        const updatedUserData = await userHelpers.userSignup(body);
        if(updatedUserData.status) {
            res.status(200).json({ status : true, message : 'Email already exist' })
        } else {
            const userSecure = {
                _id : updatedUserData._id,
                name : updatedUserData.patientfirstname,
                email : updatedUserData.email
            }
            res.status(200).json({userSecure});
        }
      } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).json({ error: "Something went wrong" }); // Handle the error gracefully
      }
}

const otpVerification = async(req, res) => {
    try {
        let otpVerify = await userHelpers.otpVerification(req.body) 
        if(otpVerify.otpVerifiedStatus === "approved"){
            let {otpVerifiedStatus, patient} = otpVerify
            const token = await signUser(patient)
            res.status(200).json({message : 'otp verified successfully',otpVerifiedStatus, patient, auth : token})
        }else {
            res.status(200).json({ error : "OTP is incorrect"})
        }
       
    }catch(error) {
        if (error) {
            res.status(500).json({ error: "Twilio resource not found" });
        } else {
            res.status(500).json({ message: 'OTP is not matched' });
        }
    }
}

const signupResendOtp = (req, res) => {
    userHelpers.signupResendOtp(req.body)
}

let userLogin = async(req, res) => {
        try {
            let response = await userHelpers.userLogin(req.body)
            if(response.status ==="unblock" && response.user.signupStatus === 'unblock') {
                const token = await signUser(response.user)
                res.status(200).json({status: "unblock", message: 'Login successful', user: response.user, auth : token});
            } else if(response.status === 'nouser') {
                res.status(200).json({ status: "nouser", message: "user does not exist"})
            } else {
                res.status(200).json({status: "block", error: 'Login failed. Invalid credentials. or You are blocked by admin'});
            }

        } catch(err) {
            res.status(500).json({ status: false, message: 'Internal server error.' });
        }

    }
    let forgotPassword = (req, res) => {
        try {
            userHelpers.forgotPassword(req.body).then((response) => {
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

let forgotPasswordConfirm = (req, res) => {
    try {
        userHelpers.forgotPasswordConfirm(req.body).then((response) => {
            if (response.status) {
                res.status(200).json({ message: "Password updated successfully", response })
            } else {
                res.status(200).json({ error: "Incorrect OTP", response })
            }
        })
    } catch (err) {
        console.error(err);
    }
}

const resendOtp = (req, res) => {
    const email = {
        formData : req.body,
    }
    userHelpers.resendOtp(email)
}

const sortDoctor = async(req, res) => {
    try {
        let sortedDocs = await userHelpers.sortDoctor(req.query)

        if(sortedDocs && sortedDocs.length > 0) {
            const doctorImage = [];
            const getImageName = (doctor) => doctor.imageName;

            for(const doctor of sortedDocs) {
                const imageName = getImageName(doctor)


                const getObjectParams = {
                    Bucket : bucketName,
                    Key : imageName,
                };

                const command = new GetObjectCommand(getObjectParams);
                const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
                let docImageUrl = url;
                 
                doctorImage.push(docImageUrl)
            }

            let sortedDoc = {
                image : doctorImage,
                doctorDetails : sortedDocs
            }

            if(doctorImage.length > 0) {
                res.status(200).json({ sortedDoc })
            } else {
                res.status(401).json({message : 'something went wrong'})
            }
        } else {
            res.status(401).json({message : 'something went wrong'})
        }

    } catch(err) {
        console.error(err);
    }
}

const fetchUserSideSchedule = (req, res) => {
    try {
        userHelpers.fetchUserSideSchedule(req.query).then(async(response) => {
            let docProfile = response.doctor
            if(docProfile && response.scheduledTime) {
                let imageName = docProfile.imageName

                const getObjectParams = {
                    Bucket : bucketName,
                    Key : imageName,
                };

                const command = new GetObjectCommand(getObjectParams);
                const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
                let docImageUrl = url;

                res.status(200).json({ scheduledTime : response.scheduledTime, doctorProfile : docProfile, imageUrl : docImageUrl })
            } else {
                res.status(401).json({message : 'something went to wrong'})
            }
        })
    } catch(err) {
        console.error(err);
    }
}

const fetchTimeDetailse = (req, res) => {
    try {
        userHelpers.fetchTime(req.query).then(async(response) => {
            if(response.doctor && response.timeSchedule) {
                let imageName = response.doctor.imageName

                const getObjectParams = {
                    Bucket : bucketName,
                    Key : imageName,
                };

                const command = new GetObjectCommand(getObjectParams);
                const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
                let docImageUrl = url;

                res.status(200).json({ timeSchedule : response.timeSchedule, doctor : response.doctor, imageUrl : docImageUrl })
            }
        })
    } catch(err) {
        console.error(err);
    }
}

const userBookedSlots = (req, res) => {
    let slotTime = req.body.slotTime
    let docId = req.body.doctorId
    let patientId = req.body.patientId
    let bookingDate = req.body.consultDate
    let currentDate = new Date()

    const bookingSlotDetails = {
        slotTime,
        docId,
        patientId,
        bookingDate,
        currentDate
    }

    userHelpers.slotBooking(bookingSlotDetails).then((response) => {
        if (response) {
            res.status(200).json({ message: "Your booking is successfull", status: false, response })
        }
    })
}

     const fetchPaymentDetails = (req, res) => {
        userHelpers.fetchPaymentDetails(req.query).then((response) => {
            if(response) {
                res.status(200).json({ response })
            } else {
                res.status(401).json({ message : 'Payment details fetching error' })
            }
        })
    }

    const razorPayment = (req, res) => {
        const { totalAmount } = req.body
        userHelpers.razorPayPayment(req.body).then((response) => {
            if(response) {
                userHelpers.generateRazorPay(response,totalAmount).then((order) => {
                    if(order) {
                        res.status(200).json({ order })
                    } else {
                        res.status(401).json({ message : 'order not created' })
                    }
                })
            }
        })
    }

    const verifyPayment = (req, res) => {
        try {
            userHelpers.paymentVerification(req.body).then((response) => {
                if(response) {
                    res.status(200).json({ response })
                } else {
                    res.status(401).json({ message : "payment failed"})
                }
            })
        } catch(err) {
            console.error(err);
        }
    }

    const hiddenBookingTime = (req, res) => {
        try {
            const { bookingdate, doctorId } = req.query 
            userHelpers.hideenBookingTime(req.query).then((response) => {
                if(response) {
                    let equalDate = response.filter((value) => {
                        let [ day, month, year ] = value.bookingDate.split('/');
                        day = parseInt(day);
                        month = parseInt(month);
                        year = parseInt(year);
                        let dateObject = new Date(year, month - 1, day);

                        let [ bookDay, bookMonth, bookYear ] = bookingdate.split('/')
                        bookDay = parseInt(bookDay)
                        bookMonth = parseInt(bookMonth)
                        bookYear = parseInt(bookYear)
                        let bookedDate = new Date(bookYear, bookMonth - 1, bookDay)

                        if(dateObject.getTime() === bookedDate.getTime()) {
                            return value
                        }
                    })

                    res.status(200).json({ equalDate })
                }
            })
        } catch(err) {
            console.error(err);
        }
    }

    const fetchUserProfile = (req, res) => {
        try {
            userHelpers.fetchUserProfile(req.query).then((response) => {
                res.status(200).json({ response })
            })
        } catch(err) {
            console.error(err);
        }
    }

    const deleteBooking = (req, res) => {
        try {
            userHelpers.deleteBooking(req.body).then((response) => {
                res.status(200).json({ response })
            })
        } catch(err) {
            console.error(err);
        }
    }

    const fetchUserDetails = (req, res) => {
        try {
            userHelpers.fetchUserDetails(req.query).then((response) => {
                res.status(200).json({ response })
            })
        } catch(err) {
            console.error(err);
        }
    }

    const updatePatientData = (req, res) => {
        try {
            const { dob } = req.body
            let dateOfBirth = new Date(dob)
            dateOfBirth = dateOfBirth.toLocaleDateString()
            const body = {
                ...req.body.formData,
                dateOfBirth
            }
            userHelpers.updatePatientData(body).then((response) => {
                res.status(200).json({ response })
            }) 
        } catch(err) {
            console.error(err);
        }
    }

    const deletePendingSlots = (req, res) => {
        try {
            userHelpers.deletePendingSlots().then((response) => {
                res.status(200).json({ response })
            })
        } catch(err) {
            console.error(err);
        }
    }
    
    const fetchLastAppointment = (req, res) => {
        try {
            userHelpers.fetchLastAppointment(req.query).then((bookings) => {
                res.status(200).json({ bookings })
            })
        } catch(err) {
            console.error(err);
        }
    }

    const fetchPrescription = (req, res) => {
        try {
            userHelpers.fetchPrescription(req.query).then((response) => {
                res.status(200).json({ response })
            })
        } catch(err) {
            console.error(err);
        }
    }

    const landingPageFetchDoctors = async(req, res) => {
        let doctors = await userHelpers.landingPageFetchDoctors()
    
        if(doctors && doctors.length > 0) {
            const doctorImage = []
            const getImageName = (doctor) => doctor.imageName
    
            for(const doctor of doctors) {
                const imageName = getImageName(doctor)
    
                const getObjectParams = {
                    Bucket : bucketName,
                    Key : imageName
                }
    
                const command = new GetObjectCommand(getObjectParams);
                const url = await getSignedUrl(s3, command, { expiresIn : 3600});
                let docImageUrl = url
                doctorImage.push(docImageUrl)
            }
    
            let doctorsDetails = {
                image : doctorImage,
                details : doctors
            }
    
            if(doctorImage.length > 0) {
                res.status(200).json({ doctorsDetails })
            } else {
                res.status(401).json({ message : 'Something went to wrong' })
            }
        } else {
            res.status(200).json({ message : 'something went to wrong' })
        }
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
    fetchTimeDetailse,
    userBookedSlots,
    fetchPaymentDetails,
    razorPayment,
    verifyPayment,
    hiddenBookingTime,
    fetchUserProfile,
    deleteBooking,
    fetchUserDetails,
    updatePatientData,
    deletePendingSlots,
    fetchPrescription,
    fetchLastAppointment,
    landingPageFetchDoctors
}
