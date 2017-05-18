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


  var hentData= function() {
    var options= {};
    options.data= {tidspunktfra: fra.utc().toISOString(), tidspunkttil: til.utc().toISOString()};
    options.url= 'https://dawa.aws.dk/replikering/adgangsadresser/haendelser';
    corsdataoptions(options);
    $.ajax(options)
    .then( function ( data ) {
      visData(data,false);
    })
  }

  var visData= function(data, dopopup) {
    var id= null;
    for (var i= 0; i<data.length; i++) {
      if (data[i].operation === 'update' && id === data[i].data.id) continue;
      id= data[i].data.id;
      var wgs84= etrs89towgs84(data[i].data.etrs89koordinat_øst, data[i].data.etrs89koordinat_nord);
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
      var popup= marker.bindPopup(L.popup().setContent("<a target='_blank' href='https://dawa.aws.dk/replikering/adgangsadresser/haendelser?id="+data[i].data.id+"'>" + data[i].data.husnr +  ' ' + operation + "</a>"),{autoPan: true});
      if (dopopup) popup.openPopup();
      sekvensnummer= data[i].sekvensnummer;
    } 
  } 

  $.ajax({
      url: '/getticket'
  })
  .then( function ( ticket ) {
    map= viskort('map', ticket);
    hentData();
  });

});