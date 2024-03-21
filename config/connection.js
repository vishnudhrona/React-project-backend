const { default: mongoose } = require("mongoose")

const database = module.exports = () => {
    const connectionParams = {
        useNewUrlParser : true,
        useUnifiedTopology : true,
    }

    try {
        mongoose.connect(process.env.DATABASE)
        
        console.log('database connected successfully');
    } catch (error) {
        console.log('database connection failed'+error);

    }
}