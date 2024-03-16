const mongoose = require('mongoose');

// Define schema
const prescriptionSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true
  },
  pdfBase64: {
    type: String,
    required: true
  },
  doctorId: {
    type: String,
    required: true
  },
  doctorfirstname: {
    type: String,
    required: true
  },
  doctorlastname: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  patientfirstname: {
    type: String,
    required: true
  },
  patientlastname: {
    type: String,
    required: true
  },
  bookingDate: {
    type: String,
    required: true
  },
  bookingtime: {
    type: String,
    required: true
  }
});

// Create model
const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;
