const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const departmentSchema = new Schema({
    department : {
        type : String,
        required : true
    },
})

module.exports = mongoose.model('Department', departmentSchema)