const db = require('../config/connection')
const env = require('dotenv').config({path: __dirname + '/../.env'})
const bcrypt = require('bcrypt');
const Doctor = require('../models/doctor')
const nodemailer = require("nodemailer");
const Department = require('../models/department')
const User = require('../models/user')
const BookingDetails = require('../models/bookingDetails')
const DoctorProfile = require('../models/doctorProfile')
const Razorpay = require('razorpay');

var instance = new Razorpay({ 
    key_id: process.env.key_id, 
    key_secret: process.env.key_secret 
})

const getAllDoctors = () => {
    return new Promise((resolve, reject) => {
        try {
            Doctor.find().then(async(doctors) => {
                doctors.forEach((doctor) => {
                    doctor.password = undefined
                })
                resolve(doctors)
            })
        } catch(err) {
            console.error(err,'ghgh');
        }
        
    })
}

const doctorInterdict = (doctorId) => {
    return new Promise(async(resolve, reject) => {
        try {
           let profileStatus = await DoctorProfile.updateOne({ doctorId : doctorId },{ $set : {
            signupStatus : 'Interdict'
           }}) 
           await Doctor.findByIdAndUpdate(doctorId, {signupStatus : 'Interdict'}, { new : true }).then(async(interdictDoctor) => {
            interdictDoctor = await interdictDoctor
                if(interdictDoctor.signupStatus === "Interdict") {
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
                              to: interdictDoctor.email, // list of receivers
                          subject: "Hello ✔", // Subject line
                          text: "Hello world?", // plain text body
                          html: "<b>Hello world?</b>", // html body
                        });                        
                      }
                      
                      main().catch(console.error);

                      resolve(interdictDoctor.signupStatus)
                }
            })
        } catch(err) {
            console.error(err,'tyhtyhtyhhhhhhhhhh');
        }
    })
}

const doctorApproval = (doctorId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let profileStatus = await DoctorProfile.updateOne({ doctorId: doctorId }, {
                $set: {
                    signupStatus: 'Approved'
                }
            })
            await Doctor.findByIdAndUpdate(doctorId, { signupStatus: "Approved" }, { new: true }).then(async (approvedDoctor) => {
                approvedDoctor = await approvedDoctor
                if (approvedDoctor.signupStatus === "Approved") {
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
                            to: approvedDoctor.email, // list of receivers
                            subject: "Hello ✔", // Subject line
                            text: "Hello world?", // plain text body
                            html: "<b>Hello world?</b>", // html body
                        });
                    }
                    main().catch(console.error);
                }
                resolve(approvedDoctor.signupStatus)
            })
        } catch (err) {
            console.error(err, 'vtvtvtv');
        }
    })
}

const addDepartment = (department) => {
    return new Promise(async (resolve, reject) => {
        try {
            let existDepartment = await Department.find()
            let addedDepartment = department.formData.department.toLowerCase()
            let departmentExists = existDepartment.some(dep => dep.department.toLowerCase() === addedDepartment)
            if (departmentExists) {
                resolve({ status: false })
            } else {
                let addedDeparment = await Department.create(department.formData)
                resolve({ status: true })
            }
        } catch (err) {
            console.error(err);
        }
    })
}

const fetchDepartment = () => {
    return new Promise(async(resolve, reject) => {
        try {
            let department = await Department.find()
            resolve(department)
        } catch(err) {
            console.error(err);
        }
    })
}

const deleteDepartment = (departmentId) => {
    return new Promise(async(resolve, reject) => {
        try {
            let deletedDepartment = await Department.deleteOne({ _id : departmentId.departmentId})
            resolve(deletedDepartment) 
        } catch(err) {
            console.error(err);
        }
    })
}

const fetchEditDepartment = (depId) => {
    return new Promise(async(resolve, reject) => {
        try {
            let editingDepartment = await Department.findOne({ _id : depId.departmentId })
            resolve(editingDepartment)
        } catch(err) {
            console.error(err);
        }
    })
}

const updateDepartment = (depId) => {
    return new Promise(async(resolve, reject) => {
        try {
            let editedDepartment = depId.department.department.toLowerCase()
            let existingDepartment = await Department.find()
            let departmentExists = existingDepartment.some(dep => dep.department.toLowerCase() === editedDepartment)
            if(departmentExists) {
                resolve({ status : false })
            } else {
                let updated = await Department.updateOne({ _id : depId.department._id },{$set : {
                    department : depId.department.department
                }})
                resolve({ status : true })
            }
        } catch(err) {
            console.error(err);
        }
    })
}

const getAllUsers = () => {
    return new Promise(async(resolve, reject) => {
        try {
            let users = await User.find()
            users.forEach((user) => {
                user.password = undefined
            })
            resolve(users)
        } catch(err) {
            console.log(err);
            reject(err)
        }
    })
}

const blockUser = (userId) => {
    return new Promise(async(resolve, reject) => {
       try {
           let blockUser = await User.findByIdAndUpdate(userId, { signupStatus : "block" }, { new : true })
           blockUser = blockUser.toObject()
           resolve(blockUser.signupStatus)
       } catch(err) {
           console.error(err,'mjmjmjmjmj');
       }
       
    })
   }
   
   const unblockUser = (userId) => {
       return new Promise(async(resolve, reject) => {
           try {
               let unblockUser = await User.findByIdAndUpdate(userId, { signupStatus : "unblock" }, { new : true })
           unblockUser = unblockUser.toObject()
           resolve(unblockUser.signupStatus)
           } catch(err) {
               console.error(err,'njnjnjnjnjnjn');
           }
           
       })
   }

   const paymentManagement = () => {
    return new Promise(async(resolve, reject) => {
        try {
            let bookings = await BookingDetails.find()
            resolve(bookings)
        } catch(err) {
            console.error(err);
        }
    })
   }

   const doctorPayment = (paymentDetails) => {
    return new Promise((resolve, reject) => {
        try {
            var options = {
                amount : paymentDetails.totalAmount*100 ,
                currency : 'INR',
                receipt : ""+paymentDetails.id
            }

            instance.orders.create(options, function(err, order) {
                if(err) {
                    console.log(err,'payment error');
                } else {
                    resolve(order)
                }
              });
        } catch(err) {
            console.error(err);
        }
    })
   }

   const doctorVerifyPayment = (paymentDetails) => {
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
                let paymentStatus = await BookingDetails.updateOne({ _id : paymentDetails.order.receipt},{$set : { adminPaymentStatus : 'success'}})
                resolve({ status : true })
            } else {
                reject(new Error("HMAC verification failed"))
            }
        } catch(err) {
            console.error(err);
        }
    })
   }

module.exports = {
    getAllDoctors,
    doctorInterdict,
    doctorApproval,
    addDepartment,
    fetchDepartment,
    deleteDepartment,
    fetchEditDepartment,
    updateDepartment,
    getAllUsers,
    unblockUser,
    blockUser,
    paymentManagement,
    doctorPayment,
    doctorVerifyPayment
}