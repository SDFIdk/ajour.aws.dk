var express = require('express');

var app = express();

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  console.log('get /');
  res.sendFile(__dirname + "/public/dist/index.html", function (err) {
    if (err) {
      console.log(err);
    }
    else {
      console.log('Sent: index.html');
    }
  });
});

app.get('/maptilerkey', function (req, res, next) { 
  res.status(200).send(maptilerkey);
}); 

maptilerkey= process.argv[4];

port= process.argv[5];

if (!port) port= 5000;

var server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('URL http://%s:%s', host, port);
});
