const express=require('express');
const Vehicle=require('./../model/vehicle')
const ParkingLot=require('./../model/parkingLot')
const ParkingSpace=require("./../model/parkingSpace");
// const parkingSpace = require('./../model/parkingSpace');
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
    const park=await Vehicle.find({color:req.params.color,type:'car'},{color:1,slot_number:1,registrationNumber:1});
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
    
    let parking=new ParkingLot({
        floor:req.body.floor,
        capacity: req.body.capacity,
        buffer:[Math.floor((req.body.capacity)*6/10),Math.floor((req.body.capacity)*3/10),Math.floor((req.body.capacity)-((req.body.capacity)*6/10+(req.body.capacity)*3/10))]
    })
    try{
        if(parking.capacity%10==0){
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
    else{
        res.json({
            error:"Capacity should be multiple of 10"
        })
    }
}
   catch(e){
    res.json({
          error:"Error occured"
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
        
        let parking=await ParkingLot.findOne();
        let flag=0,car=0,bike=0,lv=0;
        let parkingSpace= await ParkingSpace.find();
        for(let i=0;i<parkingSpace.length;i++){
            if(parkingSpace[i].vehicle_no==vehicle.registrationNumber){
                flag=1;
                res.send("Already in parking!!!")
                break;
            }
            if(parkingSpace[i].vehicle_type!=null && parkingSpace[i].vehicle_type.toLowerCase()=='car'){car+=1}
            if(parkingSpace[i].vehicle_type!=null && parkingSpace[i].vehicle_type.toLowerCase()=='bike'){bike+=1}
            if(parkingSpace[i].vehicle_type!=null && parkingSpace[i].vehicle_type.toLowerCase()=='large_vehicle'){lv+=1}
            
        }
        console.log("counted "+lv+" "+bike+" "+car)
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
                if((vehicle.type=='car' && car==parking.buffer[0])||(vehicle.type=='bike' && bike==parking.buffer[1])||(vehicle.type=='large_vehicle' && lv==parking.buffer[2])){
                    console.log("countedInside "+lv+" "+bike+" "+car)
                    i=(i+parking.capacity)-((i+parking.capacity)%(10))
                    console.log(i+"---------i")
                   
                    continue    
                }
                
                    const updatedParkingSpace=await ParkingSpace.findOneAndUpdate(
                    {_id:parkingSpace[i]._id},{is_available:false,vehicle_no:vehicle.registrationNumber,
                         entry:d,vehicle_type:vehicle.type}
                    
                )
                    
                
               

                flag=1;
                res.send(vehicle)
                break;
            }
            i+=1;
        }
        if(flag==0){
            res.send("No space")
        }
    }
}
    catch(e){
        res.send("error")
    }
    

})

router.post('/vehicle/exit/:registrationNumber',async(req,res)=>{
    const registrationNumber=req.params.registrationNumber;
    const vehicle=await Vehicle.findOne({registrationNumber:registrationNumber})
    if(vehicle!=null){
    console.log(vehicle)
    const slot=vehicle.slot_number.split("F:")
    const parkingSpace=await ParkingSpace.findOne({vehicle_no:vehicle.registrationNumber})
    const entry=parkingSpace.entry;
    const exit=new Date();
    let diff =(exit.getTime() - entry.getTime()) / 1000;
    diff /= (60 * 60);
    let fare=Math.max(Math.abs(Math.round(diff))*30,30)
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
else{
    res.json({
        error:"Not found in the parking"
    });
}
})



module.exports=router