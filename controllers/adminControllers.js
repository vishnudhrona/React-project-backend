const express = require("express");
const adminHelpers = require('../helpers/adminHelpers')
const { signAdmin } = require('../middlewares/jwt')

const adminCredential = {
    email : "vishnu@gmail.com",
    password : "123456"
}

const adminLogin = async (req, res) => {
    let response = {}
    try {
        if(req.body.formData.email === adminCredential.email && req.body.formData.password === adminCredential.password) {
            response.status = true
            const token = await signAdmin()
            res.status(200).json({ message : 'Admin login successfully', response, auth : token })
        } else {
            response.status = false
            res.status(200).json({ error : 'incorrect credentials', response })
        }
    } catch(err) {
        console.error(err,'admin login error');
    }
}

const doctorManagement = (req, res) => {
    try {
        adminHelpers.getAllDoctors().then((doctors) => {
            if(doctors) {
                res.status(200).json({ doctors : doctors })
            }
        })
    } catch(err) {
        console.error(err);
    }
}

const doctorInterdict = (req, res) => {
    let doctorId = req.query.doctorId
    try {
        adminHelpers.doctorInterdict(doctorId).then((status) => {
            res.status(200).json({ status : status })
        })
    } catch(err) {
        console.error(err,'qsdqsddddddddddddd');
    }
}

const doctorApproval = (req, res) => {
    let doctorId = req.query.doctorId
    try {
        adminHelpers.doctorApproval(doctorId).then((status) => {
            res.status(200).json({ status : status })
        })
    } catch(err) {
        console.error(err,'jkjkjkjkjk');
    }
}

const addDepartment = (req, res) => {
    try {
        adminHelpers.addDepartment(req.body).then((response) => {
            res.status(200).json({ response })
        })
    } catch(err) {
        console.error(err);
    }
}

const fetchDepartment = (req, res) => {
    try {
        adminHelpers.fetchDepartment().then((department) => {
            res.status(200).json({ department })
        })
    } catch(err) {
        console.error(err);
    }
}

const deleteDepartment = (req, res) => {
    try {
        adminHelpers.deleteDepartment(req.body).then((response) => {
            res.status(200).json({ response })
        })
    } catch(err) {
        console.error(err);
    }
}

const fetchEditDepartment = (req, res) => {
    try {
        adminHelpers.fetchEditDepartment(req.body).then((department) => {
            res.status(200).json({ department })
        })
    } catch(err) {
        console.error(err);
    }
}

const updateDepartment = (req, res) => {
    try {
        adminHelpers.updateDepartment(req.body).then((response) => {
            res.status(200).json({ response })
        })
    } catch(err) {
        console.error(err);
    }
}

const getUser = (req, res) => {
    try {
        adminHelpers.getAllUsers().then((users) => {
            if(users) {
                res.status(200).json({ users : users })
            }
        })
    } catch(err) {
        console.error(err);
    }
}

const blockUser = (req, res) => {
    let userId = req.query.userId
    try {
        adminHelpers.blockUser(userId).then((status) => {
            if(status === "block") {
                res.status(200).json({ message : 'User is blocked', status })
            }
        })
    } catch(err) {
        console.error(err,'block user error');
    }
    
}

const unblockUser = (req, res) => {
    let userId = req.query.userId
    try {
        adminHelpers.unblockUser(userId).then((status) => {
            if(status === "unblock") {
                res.status(200).json({ message : 'user is Unblocked', status})
            }
        })
    } catch(err) {
        console.error(err,'unblock user error');
    }
    
}

const paymentManagement = (req, res) => {
    try {
        adminHelpers.paymentManagement().then((response) => {
            res.status(200).json({ response })
        })
    } catch(err) {
        console.error(err);
    }
}

const doctorPayment = (req, res) => {
    try {
        adminHelpers.doctorPayment(req.body).then((order) => {
            if(order) {
                res.status(200).json({ order })
            } else {
                res.status(401).json({ message : 'order not created' })
            }
        })
    } catch(err) {
        console.error(err);
    }
}

const doctorVerifyPayment = (req, res) => {
    try {
        adminHelpers.doctorVerifyPayment(req.body).then((response) => {
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

const fetchBarchartBookingDetails = (req, res) => {
    try {
        adminHelpers.fetchBarchartBookingDetails()
    } catch(err) {
        console.error(err);
    }
}

module.exports = {
    adminLogin,
    doctorManagement,
    doctorInterdict,
    doctorApproval,
    addDepartment,
    fetchDepartment,
    deleteDepartment,
    fetchEditDepartment,
    updateDepartment,
    getUser,
    unblockUser,
    blockUser,
    paymentManagement,
    doctorPayment,
    doctorVerifyPayment,
    fetchBarchartBookingDetails
}
