var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');

var knownIds = {};

app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

function sensorJSON(datetime, sensorValue, sensorName){
  var data = "";
  data += " { x :[\'" + datetime + "\'],";
  data += " y :[" + sensorValue + "],";
  data += " name : \'" + sensorName +"\'}";

  return data;
}

app.post("/", function(req, res){
  
  console.log(req.body);
  var id = req.body.id;
  var datetime = req.body.datetime;
  var sensorData = req.body.data;

  //if ID isn't known push it into our knownIds
  if(!(knownIds[id])) {
    //Default delay is 1 second
    knownIds[id] = {time:1000, changed:false};
    console.log(knownIds);
    res.end('ok');
  } else {
    //send the new delay value
    if(knownIds[id].changed == true) { 
      res.setHeader('Content-Length', knownIds[id].time.toString().length);
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.write(knownIds[id].time);
      res.end();

      knownIds[id].changed = false;
    } else {
      res.end('ok');
    }

  }

  //build the string to show on the clients
  var data = "";
  data += "ID = " + "\"" + id + "\"\n";
  data += "["
  if(sensorData.sensor0){
  data += sensorJSON(datetime, sensorData.sensor0, "sensor0");
  data += ",\n";
  }
  if(sensorData.sensor1){
  data += sensorJSON(datetime, sensorData.sensor1, "sensor1");
  data += " -]";
  }

  io.emit('iot data', data, req.body);

});

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('update delay', function(data) {
    console.log('Arduino delay update');
    console.log('Arduino ' + data.id + ' new delay set to: ' + data.time);
    knownIds[data.id].time = data.time;
    knownIds[data.id].changed = true;
  });

});

const PORT = 8080;

http.listen(PORT, function(){
  console.log('listening on: ' + PORT);
});