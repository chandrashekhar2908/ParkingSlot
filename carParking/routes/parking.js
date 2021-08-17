const express=require('express');
const Vehicle=require('./../model/vehicle')
const ParkingLot=require('./../model/parkingLot')
const ParkingSpace=require("./../model/parkingSpace");
const router = express.Router();

router.delete('/refresh/Parking',async(req, res)=>{
    const delDet = await ParkingLot.deleteMany();
    console.log(delDet)
    res.send('deleted')
})
router.delete('/refresh/Vehicle',async(req, res)=>{
    const delDet = await Vehicle.deleteMany();
    console.log(delDet)
    res.send('deleted')
})
router.delete('/refresh/ParkingSpace',async(req, res)=>{
    const delDet = await ParkingSpace.deleteMany();
    console.log(delDet);
    let Parking=await ParkingLot.findOne();
    const ParkingNew=await ParkingLot.findOneAndUpdate(
        {_id:Parking._id},{capacity:Parking.buffer[0],floor:Parking.buffer[1]}
    )  
    res.send('deteted')
})
router.get('/registrationNumber/:color',async(req,res)=>{
    const car=await Vehicle.find({color:req.params.color},{registrationNumber:1,color:1})
    console.log(car);  
    res.send(car)
})
router.get('/slotNumber/:registrationNumber',async(req,res)=>{
    const car=await Vehicle.find({registrationNumber:req.params.registrationNumber},{registrationNumber:1,slot_number:1})
    console.log(car);  
    res.send(car)
})
router.get('/carslotNumber/:color',async(req,res)=>{
    const park=await Vehicle.find({$and:[{color:req.params.color},{type:'car'}]},{color:1,slot_number:1,registrationNumber:1});
    console.log(park.length);
    res.send(park)
})

router.get('/vehicle',async(req,res)=>{
    const park=await Vehicle.find({});
    console.log(park.length);
    res.send(park)
})
router.get('/parkingSpace/:id',async(req,res)=>{
    const park=await ParkingSpace.find({floor_number:req.params.id},{floor_number:1,is_available:1,parking_zone_id:1});
    console.log(park.length);
    res.send(park)
})
router.get('/parkingSpace',async(req,res)=>{
    const park=await ParkingSpace.find({},{floor_number:1,is_available:1,parking_zone_id:1}).sort('parking_zone_id');
    console.log(park.length);
    res.send(park)
})

router.get('/parking',async(req,res)=>{
    const park=await ParkingLot.find({});
    console.log(park.length);
    res.send(park)
})

router.post('/parking',async(req,res)=>{
    
    
    try{
        const park=await ParkingLot.find({})
        console.log(park)
        if(park.length==1){
            throw Error("Parking can be initialised once")}
        if(!req.body.floor.toString().match(/^[0-9]+$/))
            throw Error("floor should be numeric")
        if(!req.body.capacity.toString().match(/^[0-9]+$/))
            throw Error("capacity should be numeric")
        if(req.body.capacity%10!=0)
            throw Error("capacity should be multiple of 10")
        let parking=new ParkingLot({
            floor:req.body.floor,
            capacity: req.body.capacity,
            buffer:[Math.floor((req.body.capacity)*6/10),Math.floor((req.body.capacity)*3/10),Math.floor((req.body.capacity)-((req.body.capacity)*6/10+(req.body.capacity)*3/10))]
        })
        
       parking= await ParkingLot.create(parking);
    
       let count=0;
       for(let i=0;i<req.body.floor*req.body.capacity;i++){
           if(i%req.body.capacity==0){
               count+=1;
              
           }
           
           const parkSpace= ParkingSpace.create(new ParkingSpace({
                       parking_space_id:parking._id.toString(),
                       is_available:true,
                       parking_zone_id: (i+1),
                       floor_number:count,
                      
                   }));
       }
       res.send(parking)
    
    
}
   catch(e){
    res.status(400);
    res.json({
          error:e.message
        })

   }
}
)

router.post('/vehicle/booking',async(req,res)=>{
    let vehicle=new Vehicle({
                registrationNumber:req.body.registrationNumber,
                color: req.body.color.toLowerCase(),
                type: req.body.type.toLowerCase(),
            })
    try{
        if(!vehicle.registrationNumber.match(/^[0-9a-zA-Z]+$/))  
           throw Error("Not valid registration Number")
        if(vehicle.type.toLowerCase()!='car'&&vehicle.type.toLowerCase()!='large_vehicle'&&vehicle.type.toLowerCase()!='bike')
            throw Error("invalid type!! Type should be car, bike, large_vehicle")
        console.log("hello")
        let parking=await ParkingLot.findOne();
        let flag=0;
        let parkingSpace= await ParkingSpace.find();
        for(let i=0;i<parkingSpace.length;i++){
            if(parkingSpace[i].vehicle_no==vehicle.registrationNumber){
                flag=1;
                res.send("Already in parking!!!")
                break;
            }   
        }
        let i=0;
        if(flag!=1){
        while(i<parkingSpace.length){
            if(parkingSpace[i].is_available==true){
                console.log(vehicle._id)
                const slot=(i+1)+"F:"+(Math.floor(i/parking.capacity)+1)
                console.log(slot)
                vehicle.slot_number=slot
                vehicle=await Vehicle.create(vehicle);
                console.log(vehicle)
                const d=new Date();
                numberOfvehicles=await ParkingSpace.find({$and:[{vehicle_type:vehicle.type},{floor_number:(Math.floor(i/parking.capacity)+1)}]})
                console.log("number of vehicles:"+numberOfvehicles.length+"floor"+(Math.floor(i/parking.capacity)+1))
                if((vehicle.type=='car'&& numberOfvehicles.length>=parking.buffer[0])||(vehicle.type=='bike'&& numberOfvehicles.length>=parking.buffer[1])||(vehicle.type=='large_vehicle'&& numberOfvehicles.length>=parking.buffer[2]))
                    i=(i+parking.capacity)-((i+parking.capacity)%10)
                else{
                    const updatedParkingSpace=await ParkingSpace.findOneAndUpdate(
                    {_id:parkingSpace[i]._id},{is_available:false,vehicle_no:vehicle.registrationNumber,
                         entry:d,vehicle_type:vehicle.type}
                    
                )
                flag=1;
                res.send(vehicle)
                break;
                    }
            }
            i+=1;
        }
        if(flag==0){
            res.status(200)
            res.json({error:"No space"})
        }
    }
}
    catch(e){
        res.status(400);
            res.json({error:e.message})
    }
    

})

router.post('/vehicle/exit/:registrationNumber',async(req,res)=>{
    try{
    const registrationNumber=req.params.registrationNumber;
    const vehicle=await Vehicle.findOne({registrationNumber:registrationNumber})
    if(vehicle==null){
        throw Error("Vehicle not in parking!!")}
    console.log(vehicle)
    const slot=vehicle.slot_number.split("F:")
    const parkingSpace=await ParkingSpace.findOne({vehicle_no:vehicle.registrationNumber})
    const entry=parkingSpace.entry;
    const exit=new Date();
    let diff =(exit.getTime() - entry.getTime()) / 1000;
    diff /= (60 * 60);
    let fare=0
    if(vehicle.type=='car'){
        fare=Math.max(Math.abs(Math.round(diff))*30,30)}
    else if(vehicle.type=='bike'){
        fare=Math.max(Math.abs(Math.round(diff))*10,10)}
    else{
        fare=Math.max(Math.abs(Math.round(diff))*50,50)}
    console.log(Math.abs(Math.round(diff)));
    console.log(entry+" "+exit)
    const updatedParkingSpace=await ParkingSpace.findOneAndUpdate({vehicle_no:vehicle.registrationNumber},{
        is_available:true,
        vehicle_transaction_id: null,
        parking_zone_id: null,
        vehicle_type:null,
        vehicle_no:null,
        entry:null,
        exit:null
    })
    const del=await Vehicle.deleteOne({registrationNumber:vehicle.registrationNumber})
    console.log(del)
    res.json({
        fare:fare
    });
    }
catch(e){
    res.status(404);
    res.json({
        error:e.message
    });
}
})



module.exports=router