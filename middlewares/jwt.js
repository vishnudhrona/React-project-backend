const jwt = require('jsonwebtoken')
const env = require('dotenv').config()

module.exports = {

    autherizeRole : (requiredRole) => async(req, res, next) => {
        const baererToken = req.headers.authorization

        if(!baererToken) {
            return res.status(401).json({ message : "No token provided"})
        }
        const token = await baererToken.split(" ")[1]
        
        if(!token) {
            return res.status(401).json({ message : "Invalide token format" })
        }
        // const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWIwOWM3NGJjMWFiZTg0NzJjY2IwNDciLCJ1c2VyIjoiVmlzaG51IiwibnVtYmVyIjoiODA4OTQ0NTEyOCIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzEwOTMzMjM0LCJleHAiOjE3MTA5NDA0MzR9.m14wIMgEQHcNwdMQB1tkHBdvPURUxDeMaAWjh-HjdCE'
        const jwtKey = process.env.JWT_TOKEN;

         jwt.verify(token, jwtKey, (err, decodedToken) => {
            if(err) {
                return res.status(200).json({ status : true })
            }

            const { role } = decodedToken

            if(!role || role !== requiredRole) {
                return res.status(200).json({ status : true })
            }
            next();
        })
    },



    signUser : (user) => {
        return new Promise((resolve, reject) => {
            const jwtKey = process.env.JWT_TOKEN;
            const payload = {
                userId : user._id,
                user : user.patientfirstname,
                number : user.number,
                role : 'user'
            }
            jwt.sign(payload, jwtKey, { expiresIn : '2h' }, (err, token) => {
                if(err) {
                    reject(err)
                } else {
                    resolve(token)
                }
            })
        })
    },

    signDoctor : (doctor) => {
        return new Promise((resolve, reject) => {
            const jwtKey = process.env.JWT_TOKEN;
            const payload = {
                doctorId : doctor._id,
                doctorName : doctor.firstname,
                doctorNumber : doctor.number,
                role : 'doctor'
            }
            jwt.sign(payload, jwtKey, {expiresIn : '2h'}, (err, token) => {
                if(err) {
                    reject(err)
                } else {
                    resolve(token)
                }
            })
        })
    },

    signAdmin : () => {
        return new Promise((resolve, reject) => {
            const jwtKey = process.env.JWT_TOKEN;
            const payload = {
                adminName : 'Admin',
                role : 'admin'
            }
            jwt.sign(payload, jwtKey, {expiresIn : '2h'}, (err, token) => {
                if(err) {
                    reject(err)
                } else {
                    resolve(token)
                }
            })
        })
    }

}