const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSlotSchema = new Schema({
    slotTime : {
        type : String,
        required : true
    },

    docId : {
        type : String,
        required : true
    },

    patientId: {
        type : String,
        required : true
    },

    bookingDate : {
        type : String,
        required : true
    },

    currentDate : {
        type : Date,
        required : true
    },

    patientfirstname : {
        type : String,
        required : true
    },

    lastname : {
        type : String,
        required : true
    },

    patientnum : {
        type : String,
        required : true
    },

    patientemail : {
        type : String,
        required : true
    },

    department : {
        type : String,
        required : true
    },

    doctorfirstname : {
        type : String,
        required : true
    },

    doctorlastname : {
        type : String,
        required : true
    },

    docnumber : {
        type : String,
        required : true
    },

    paymentStatus : {
        type : String,
        required : true
    }

})

module.exports = mongoose.model('BookingSlot', bookingSlotSchema)