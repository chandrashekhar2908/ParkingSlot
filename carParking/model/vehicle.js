const mongoose=require('mongoose');
const vehicleSchema=new mongoose.Schema({
    registrationNumber:{
        type:String,
        required:true
    },
    color:{
        type:String,
        required:true
    },
    type:{
        type:String,
        required:true
    },
    slot_number:{
        type:String,
        default:null
    }
})

module.exports=mongoose.model('Vehicle',vehicleSchema)