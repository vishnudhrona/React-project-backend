const express = require('express');
const router = express.Router();
const doctorControllers = require('../controllers/doctorControllers')
const { autherizeRole } = require('../middlewares/jwt')
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
router.get('/fetchtimeschedule',autherizeRole('doctor'),doctorControllers.fetchDoctorTimeSchedule)
router.post('/timeschedule',doctorControllers.doctorTimeschedule)
router.post('/deletedoctorschedule',doctorControllers.deleteDoctorSchedule)
router.post('/deletepastschedule',doctorControllers.deletePastSchedule)
router.get('/fetchdoctorprofile',autherizeRole('doctor'),doctorControllers.fetchDoctorProfile)
router.get('/fetchbookingdetails',autherizeRole('doctor'),doctorControllers.fetchBookingDetails)
router.get('/invitingpatient',doctorControllers.invitingPatient)
router.get('/fetchdocpaymentdetails',autherizeRole('doctor'),doctorControllers.fetchDocPaymentDetails)
router.post('/addprescription',doctorControllers.addPrescription)
router.get('/fetchpatientdetails',doctorControllers.fetchPatientDetails)

module.exports = router;
