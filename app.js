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

// function getTicket(usr,pw) {
//   return new Promise((resolve, reject) => {
//     var options= {};
//     options.url='https://api.dataforsyningen.dk/' + service;
//     options.qs= {};
//     options.qs.service= 'META';
//     options.qs.request= 'GetTicket';
//     options.qs.login= usr;
//     options.qs.password= pw;
//     //options.resolveWithFullResponse= true;
//     var jsonrequest= rp(options).then((body) => {    
//       console.log('getticket: %s, %d', body, body.length);
//       if (body.length === 32) { // returnerer en status 200 ved ukendt username/password?!
//         resolve(body);
//       }
//       else {
//         reject('Ukendt username/password');
//       }
//     })
//     .catch((err) => {
//       reject('fejl i request af kortforsyningen: ' + err);
//     });
//   });
// }

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