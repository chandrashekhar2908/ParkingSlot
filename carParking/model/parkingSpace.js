const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ParkingSpace = new Schema(
  {
    floor_number:{
        type:Number,
    },
    parking_space_id: {
        type: String,
        required: true
    },
    vehicle_transaction_id: {
        type:String,
    },
    parking_zone_id: {
        type: Number,
    },
    vehicle_type:{
        type:String,
        default: null
    },
    is_available: {
        type: Boolean
    },
    vehicle_no:{
        type: String,
       
    },
    entry:{
        type:Date,
    },
    exit:{
        type:Date,
    },
    
  }
);

module.exports = mongoose.model("parking_space", ParkingSpace);