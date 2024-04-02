const express = require('express');
const router = express.Router();
const adminControllers = require('../controllers/adminControllers');
const { autherizeRole } = require('../middlewares/jwt');

router.post('/adminlogin',adminControllers.adminLogin)
router.get('/doctormanagement',autherizeRole('admin'),adminControllers.doctorManagement)
router.get('/doctorinterdict',adminControllers.doctorInterdict)
router.get('/doctorapproval',adminControllers.doctorApproval)
router.post('/adddepartment',adminControllers.addDepartment)
router.get('/fetchdepartment',adminControllers.fetchDepartment)
router.post('/deletedepartment',adminControllers.deleteDepartment)
router.post('/fetcheditdepartment',adminControllers.fetchEditDepartment)
router.post('/updatedepartment',adminControllers.updateDepartment)
router.get('/usermanagement',autherizeRole('admin'),adminControllers.getUser)
router.get('/userblock', adminControllers.blockUser)
router.get('/userunblock', adminControllers.unblockUser)
router.get('/paymentmanagement',autherizeRole('admin'),adminControllers.paymentManagement)
router.post('/doctorpayment',adminControllers.doctorPayment)
router.post('/doctorverifypayment',adminControllers.doctorVerifyPayment)

module.exports = router;
