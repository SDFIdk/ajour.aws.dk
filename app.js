var express = require('express')
  , kf = require('kf-getticket');

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
//     options.url='https://kortforsyningen.kms.dk/service';
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

app.get('/getticket', function (req, res, next) { 
  kf.getTicket(usr,pw).then((ticket) => {
    res.status(200).send(ticket);
  })
  .catch((err) => {
    res.status(400).send('Ukendt username og password: ' + err);
  });
}); 

var usr= process.argv[2]
  , pw= process.argv[3];

kf.getTicket(usr,pw).then(ticket => {
  var server = app.listen(5000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('URL http://%s:%s', host, port);
  });
})
.catch(err => {
  console.log("Ukendt username og password (%s)",err);
})