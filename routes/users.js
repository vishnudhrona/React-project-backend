const express = require('express');
const router = express.Router();
const cors = require("cors");
const passport = require('passport')
const userControllers = require('../controllers/userControllers');
const { autherizeRole } = require('../middlewares/jwt');

router.post('/signup',userControllers.userSignup)
router.post('/otpverification', userControllers.otpVerification)
router.post('/signupresendotp', userControllers.signupResendOtp)
router.post('/userlogin', userControllers.userLogin)
router.post('/userforgotpassword',userControllers.forgotPassword)
router.post('/userforgotpasswordconfirm',userControllers.forgotPasswordConfirm)
router.post('/resendotp', userControllers.resendOtp)
router.post('/doctorbooking',userControllers.doctorBooking)
router.post('/sortdoctor', userControllers.sortDoctor)
router.get('/usersidetimeschedule', userControllers.fetchUserSideSchedule)
router.get('/timeslots', userControllers.fetchTimeDetailse)
router.post('/userbookingslots',autherizeRole('user'),userControllers.userBookedSlots)
router.get('/fetchpaymentdetails', userControllers.fetchPaymentDetails)
router.post('/userpayment', userControllers.razorPayment)
router.post('/verifypayment', userControllers.verifyPayment)
router.get('/hiddenbookingtime',userControllers.hiddenBookingTime)
router.get('/fetchuserprofile',userControllers.fetchUserProfile)
router.post('/deletebooking',userControllers.deleteBooking)
router.get('/fetchuserDetails',userControllers.fetchUserDetails)
router.post('/updatepatientdata',userControllers.updatePatientData)
router.post('/deletependingslots',userControllers.deletePendingSlots)
router.get('/fetchprescription',userControllers.fetchPrescription)
router.get('/login/success',userControllers.googleAuthSuccess)
router.get("/login/failed",userControllers.googleAuthFailed)
router.get('/google/callback',userControllers.googleAuth)
router.get('/google',userControllers.passportAuthentication)
router.get('/logout',userControllers.googleAuthLogout)

module.exports = router;
