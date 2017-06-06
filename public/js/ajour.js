$(function() {

  var map
    , fra= moment().startOf('day')
    , til= moment()
    , sekvensnummer= 0;

  function corsdataoptions(options) {
     if (corssupported()) {
      options.dataType= "json";
      options.jsonp= false;
    }
    else {        
      options.dataType= "jsonp";
    }
  }

  var initAdgangsadresser= function() {
    var options= {};
    options.data= {tidspunktfra: fra.utc().toISOString(), tidspunkttil: til.utc().toISOString()};
    options.url= 'https://dawa.aws.dk/replikering/adgangsadresser/haendelser';
    corsdataoptions(options);
    $.ajax(options)
    .then( function ( data ) {
      visAdgangsadresser(data,true);
    })
  }

  var visAdgangsadresse= function(data, hændelse, dopopup) { 
    if (hændelse.operation === 'update' && id === hændelse.data.id) continue;
      id= hændelse.data.id;
      var wgs84= etrs89towgs84(hændelse.data.etrs89koordinat_øst, hændelse.data.etrs89koordinat_nord);
      var color= 'blue'   
        , operation= 'ukendt';

      switch (data[i].operation) {
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
      var popup= marker.bindPopup(L.popup().setContent("<a target='_blank' href='https://dawa.aws.dk/replikering/adgangsadresser/haendelser?id="+hændelse.data.id+"'>" + hændelse.data.husnr +  ' ' + operation + "</a>"),{autoPan: true});
      if (dopopup) popup.openPopup();
  }

  var visAdgangsadresser= function(data, dopopup) {
    var promises= [];    
    for (var i= 0; i<data.length; i++) {
      var options= {};
      options.url= encodeURI(host+"adgangsadresser/"+data[i].id);
      corsdataoptions(options);
      promises.push($.ajax(options));
      sekvensnummer= data[i].sekvensnummer;
    }
    begrænssamtidige(promises, data, 0, 10, visAdgangsadresse);
  }

  function begrænssamtidige(promises, hændelser, start, længde, vis) {
    var l= (promises.length-start<længde?promises.length-start:længde); 
    var subpromises= promises.slice(start,start+l);
    $.when.apply($, subpromises).then(function() {
      for (var i = 0; i < subpromises.length; i++) {
        vis(arguments[i][0]);
      } 
      begrænssamtidige(promises,hændelser,start+længde,længde,vis);
    }, function() {
      infoout("<p>Kald til DAWA fejlede: " + arguments[1] + "  "  + arguments[2] + "</p>");
    });
  }

  $.ajax({
    url: '/getticket'
  })
  .then( function ( ticket ) {
    map= viskort('map', ticket);
    initAdgangsadresser();
  });

});