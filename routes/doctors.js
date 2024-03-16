const express = require('express');
const router = express.Router();
const doctorControllers = require('../controllers/doctorControllers')
var multer = require('multer');

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

router.post('/doctorsignup',doctorControllers.doctorSignup)
router.post('/docotpverification',doctorControllers.doctorOtpVerification)
router.post('/uploadprofile',upload.single('image'),doctorControllers.doctorAddProfile)
router.post('/doctorlogin', doctorControllers.doctorLogin)
router.post('/doctorforgotpassword', doctorControllers.doctorForgotPassword)
router.post('/doctorforgotpasswordconfirm',doctorControllers.doctorForgotPasswordConfirm)
router.post('/docresendotp',doctorControllers.doctorResendOtp)
router.get('/fetchtimeschedule', doctorControllers.fetchDoctorTimeSchedule)
router.post('/timeschedule',doctorControllers.doctorTimeschedule)
router.post('/deletedoctorschedule',doctorControllers.deleteDoctorSchedule)
router.post('/deletepastschedule',doctorControllers.deletePastSchedule)
router.get('/fetchdoctorprofile',doctorControllers.fetchDoctorProfile)
router.get('/fetchbookingdetails', doctorControllers.fetchBookingDetails)
router.get('/invitingpatient',doctorControllers.invitingPatient)
router.get('/fetchdocpaymentdetails',doctorControllers.fetchDocPaymentDetails)
router.post('/addprescription',doctorControllers.addPrescription)
router.get('/fetchpatientdetails',doctorControllers.fetchPatientDetails)

module.exports = router;
