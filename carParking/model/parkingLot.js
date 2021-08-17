const mongoose=require('mongoose');
const parkingSchema=new mongoose.Schema({
    floor:{
        type:Number,
        required:true
    },
    capacity:{
        type:Number,
        required:true
    },
    buffer:{
        type:[],
    }
   
})

module.exports=mongoose.model('ParkingLot',parkingSchema)