
var fs = require('fs');
const addresses = require('./addresses.json');
var express = require('express')();
var citiesResult = []; //this will keep all items within 250 km


function calcCrow(lat1, lon1, lat2, lon2) 
{
      var R = 6371; // km
      var dLat = toRad(lat2-lat1);
      var dLon = toRad(lon2-lon1);
      var lat1 = toRad(lat1);
      var lat2 = toRad(lat2);

      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c;
      return d;
}
// Converts numeric degrees to radians
function toRad(Value) 
{
    return Value * Math.PI / 180;
}

//first we come to this part ,and look for the token for each request
express.use('/' ,(req ,res ,next) =>{
  
  if( req.header == null || req.header('Authorization') == null){        
          
      return res.status(401).json({ message: 'Unauthorized' });    
  }
  else{
      const token = req.header('Authorization').split(' ')[1];
     
      if(token === "dGhlc2VjcmV0dG9rZW4="){
          next();
          res.status = 200;
      }
      else
        return res.status(401).json({ message: 'Unauthorized' });
  }       
});
express.get('/cities-by-tag' ,(req ,res) =>{
  tag = req.query.tag;
  isActive = req.query.isActive;
  
  var cities = [];

  cities = addresses.filter( i=> i .isActive === true && i.tags.indexOf('excepteurus',0) > 0 )
   
  return res.status(200).json({ cities:cities});
    
});


express.get('/distance' ,(req ,res) =>{
  from = req.query.from;
  to = req.query.to;

  cityFrom = addresses.filter( i=> i .guid === from)[0];
  cityTo = addresses.filter( i=> i .guid === to )[0];

  let distance = calcCrow(cityFrom.latitude, cityFrom.longitude, cityTo.latitude, cityTo.longitude );
  
  let result = {
      from:{ guid: cityFrom.guid} ,
      to: { guid: cityTo.guid} ,
      unit :"km",
      distance : Number(distance.toFixed(2))
  }
  res.status = 200;
  res.json(result );
});

express.get('/area' , async (req, res) =>{
  from = req.query.from;
  distance = req.query.distance;  
  cityFrom = addresses.filter( i=> i .guid === from)[0];

  try{

    (async function () {
 
      const result = (await Promise.all(addresses.map( i=> { 
                          let dist = calcCrow( cityFrom.latitude, cityFrom.longitude, i.latitude ,i.longitude);
                          if( dist <= 250 && i.guid !==  cityFrom.guid  )
                            citiesResult.push(i);                                        
                          }
    )))   
   })();
   console.log('ok');
   return res.status(202).
      send({resultsUrl: `http://127.0.0.1:8080/area-result/2152f96f-50c7-4d76-9e18-f7033bd14428` }) ;
      
  }catch(err){
    return res.status(500).end(err);
  }
  
});

express.get('/area-result/2152f96f-50c7-4d76-9e18-f7033bd14428' , (req ,res) =>{
  
  try{
    if(citiesResult.length!= 15) {      
      res.status(202).send("not ready yet"); //now we return the client as our data not ready
    }
    else if( citiesResult.length == 15){       
        res.status(200).send({cities: citiesResult});
    }
    else 
        res.status(200).send("ok");
    }
  catch(err){
      return res.status(500).end(err);
  }
  
});

express.get('/all-cities' ,function(req,res){
  var readerStream = fs.createReadStream('addresses.json');

  readerStream.on('finish' ,function(chunk){
    console.log("read is finished");
  });
  
  readerStream.on('error' ,function(err){
    console.log(console.log(err.stack))
  });

  readerStream.pipe(res);
})

express.listen(8080 ,()=>{
  console.log("Server running on port 8080");
});
