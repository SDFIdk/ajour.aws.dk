$(function() {

  var map
    , fra= moment().startOf('day')
    , til= moment()
    , sekvensnummer= 0
    , host= 'http://dawa.aws.dk/';

  function corsdataoptions(options) {
     if (corssupported()) {
      options.dataType= "json";
      options.jsonp= false;
    }
    else {        
      options.dataType= "jsonp";
    }
  }


  // var initAdresser = new Promise(function(resolve, reject) {
  //   var options= {};
  //   options.data= {tidspunktfra: fra.utc().toISOString(), tidspunkttil: til.utc().toISOString()};
  //   options.url= host + 'replikering/adresser/haendelser';
  //   corsdataoptions(options);
  //   $.ajax(options)
  //   .done( function ( data ) {
  //     visAdresser(data,true);
  //     resolve();
  //   })
  //   .fail(function( jqXHR, textStatus, errorThrown ) {
  //     reject(textSatus);
  //   });
  // });

  // var initAdgangsadresser= function() {
  //   var options= {};
  //   options.data= {tidspunktfra: fra.utc().toISOString(), tidspunkttil: til.utc().toISOString()};
  //   options.url= host + 'replikering/adgangsadresser/haendelser';
  //   corsdataoptions(options);
  //   $.ajax(options)
  //   .then( function ( data ) {
  //     visAdgangsadresser(data,true);
  //     setInterval(function () {
  //         $.ajax({url: host+"/replikering/senestesekvensnummer", dataType: "jsonp"})
  //         .then( function ( seneste ) {
  //           if (seneste.sekvensnummer > sekvensnummer) { 
  //             var snr= sekvensnummer+1;            
  //             sekvensnummer= seneste.sekvensnummer;
  //             hentAdgangsadresser(snr,seneste.sekvensnummer); 
  //           }
  //         });
  //       }, 60000);
  //   })
  // }
  var danUrl= function (path, query) {    
    var url = new URL(path);
    Object.keys(query).forEach(key => url.searchParams.append(key, query[key]));
    return url;
  }

  var initAdgangsadresser= new Promise(async function(resolve, reject) {
    var url = danUrl(host + 'replikering/adgangsadresser/haendelser', {tidspunktfra: fra.utc().toISOString(), tidspunkttil: til.utc().toISOString()});
    let response = await fetch(url);
    let adgangsadresser = await response.json();
    visAdgangsadresser(adgangsadresser,true);
    resolve();
  });

  var hentAdgangsadresser= function(fra,til) {
    var options= {};
    options.data= {sekvensnummerfra: fra, sekvensnummertil: til};
    options.url= host + 'replikering/adgangsadresser/haendelser';
    corsdataoptions(options);
    $.ajax(options)
    .then( function ( data ) {
      visAdgangsadresser(data,true);
    })
  }

  var adgangsadresserid;
  var visAdgangsadresse= function(vej, hændelse, dopopup) { 
    if (hændelse.operation === 'update' && adgangsadresserid === hændelse.data.id) return;
    adgangsadresserid= hændelse.data.id;
    var wgs84= etrs89towgs84(hændelse.data.etrs89koordinat_øst, hændelse.data.etrs89koordinat_nord);
    var color= 'blue'   
      , operation= 'ukendt';

    switch (hændelse.operation) {
    case 'insert':
      color= 'red';
      operation= 'oprettet';
      break;
    case 'update':
      color= 'orange';
      operation= 'ændret';
      break;
    case 'delete':
      color= 'black';
      operation= 'nedlagt';
      break;
    }
    var marker= L.circleMarker(L.latLng(wgs84.y, wgs84.x), {color: color, fillColor: color, stroke: true, fillOpacity: 1.0, radius: 4, weight: 2, opacity: 1.0}).addTo(map);//defaultpointstyle);
    var popup= marker.bindPopup(L.popup().setContent("<a target='_blank' href='https://dawa.aws.dk/replikering/adgangsadresser/haendelser?id="+hændelse.data.id+"'>" + vej.navn + " " + hændelse.data.husnr +  ' ' + operation + "</a>"),{autoPan: true});
    if (dopopup) popup.openPopup();
  }

  var visAdgangsadresser= function(data, dopopup) {
    var promises= [];    
    for (var i= 0; i<data.length; i++) {
      let url = danUrl(host+"vejstykker", {kode: data[i].data.vejkode, kommunekode: data[i].data.kommunekode});
      promises.push(fetch(url));
      sekvensnummer= data[i].sekvensnummer;
    }
    begrænssamtidige(promises, data, 0, 10, visAdgangsadresse);
  }

  async function begrænssamtidige(promises, hændelser, start, længde, vis) {
    if (start >= promises.length) return;
    var l= (promises.length-start<længde?promises.length-start:længde); 
    var subpromises= promises.slice(start,start+l);
    let responses= await Promise.all(subpromises);
    for (var i = 0; i < responses.length; i++) {
      let veje= await responses[i].json(); 
      vis(veje[0], hændelser[start+i], true);
    } 
    begrænssamtidige(promises,hændelser,start+længde,længde,vis);
  }

  async function main() {
    let response= await fetch('/getticket');    
    let ticket = await response.text(); 
    map= viskort('map', ticket);
    await initAdgangsadresser;
   // await initAdresser;
    setInterval(function () {
      $.ajax({url: host+"/replikering/senestesekvensnummer", dataType: "jsonp"})
      .then( function ( seneste ) {
        if (seneste.sekvensnummer > sekvensnummer) { 
          var snr= sekvensnummer+1;            
          sekvensnummer= seneste.sekvensnummer;
          hentAdgangsadresser(snr,seneste.sekvensnummer); 
        }
      });
    }, 60000);
  }

  main();

});