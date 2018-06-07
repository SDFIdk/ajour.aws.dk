"use strict"

//function() {

  var moment= require('moment')
    , util= require("dawa-util")
    , kort= require("dawa-kort");

  var map
    , fra= moment().startOf('day')
    , til= moment()
    , sekvensnummer= 0
    , host= 'http://dawa.aws.dk/'
    , markersLayer
    , adresseajourføringer= 0
    , adgangsadresseajourføringer= 0
    , navngivnevejeajourføringer= 0;


  let miljø= util.getQueryVariable('m');
  if (miljø) {
    host= host.replace('dawa',miljø); 
  } 

  var danUrl= function (path, query) {    
    var url = new URL(path);
    Object.keys(query).forEach(key => url.searchParams.append(key, query[key]));
    return url;
  }

  var initAdresser = async function() {
    let url = danUrl(host + 'replikering/adresser/haendelser', {tidspunktfra: fra.utc().toISOString(), tidspunkttil: til.utc().toISOString()});
    let response = await fetch(url);
    let adresser = await response.json();
    visAdresser(adresser,false);
  }

  var hentAdresser= async function(fra,til) {
    var url = danUrl(host + 'replikering/adresser/haendelser', {sekvensnummerfra: fra, sekvensnummertil: til});
    let response = await fetch(url);
    if (!response.ok) throw response.status
    let adresser = await response.json();
    visAdresser(adresser,true);
  }

  var visAdresser= function(hændelser, dopopup) {
    var promises= [];    
    for (var i= 0; i<hændelser.length; i++) {
      promises.push(getAdressebetegnelse(hændelser[i]));
    }    
    if (hændelser.length > 0) {
      adresseajourføringer= adresseajourføringer + hændelser.length;
      info.update();
      begrænssamtidige(promises, hændelser, 0, 10, visAdresse, dopopup);
    }
  }

  var getAdressebetegnelse= function(hændelse) {

    return new Promise(async function(resolve, reject) { 
      let response= await fetch(danUrl(host+"adresser", {id: hændelse.data.id, struktur: 'mini'}));
      let adresser;
      if (response.ok) {
        adresser= await response.json();
        if (adresser.length > 0) {
          resolve({ok: true, betegnelse: util.formatAdresse(adresser[0]), x: adresser[0].x, y:adresser[0].y});
          return;
        }
      }
      response= await fetch(danUrl(host+"adgangsadresser", {id: hændelse.data.adgangsadresseid, struktur: 'mini'}));
      if (response.ok) {
        let adgangsadresser= await response.json();
        if (adgangsadresser.length > 0) {
          let adgangsadresse= adgangsadresser[0];
          adgangsadresse.etage= hændelse.data.etage;
          adgangsadresse.dør= hændelse.data.dør;
          resolve({ok: true, betegnelse: util.formatAdresse(adgangsadresse), x: adgangsadresse.x, y:adgangsadresse.y});
          return;
        }
      }
      resolve({ok: false});
    });
  } 

  var adresserid;
  var visAdresse= function(adresse, hændelse, dopopup) { 
    if (!adresse.ok) return;
    if (hændelse.operation === 'update' && adresserid === hændelse.data.id) return;
    adresserid= hændelse.data.id;
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
    var marker= L.circleMarker(L.latLng(adresse.y, adresse.x), {color: color, fillColor: color, stroke: true, fillOpacity: 1.0, radius: 4, weight: 2, opacity: 1.0}).addTo(map);//defaultpointstyle);
    var popup= marker.bindPopup(L.popup().setContent("<a target='_blank' href='https://dawa.aws.dk/replikering/adresser/haendelser?id="+hændelse.data.id+"'>" + adresse.betegnelse + "</a>"),{autoPan: true});
    
    if (dopopup) {
      map.flyTo(L.latLng(adresse.y, adresse.x),12);
      popup.openPopup();
    }
  }

  var initAdgangsadresser= async function() {
    let url = danUrl(host + 'replikering/adgangsadresser/haendelser', {tidspunktfra: fra.utc().toISOString(), tidspunkttil: til.utc().toISOString()});
    let response = await fetch(url);
    let adgangsadresser = await response.json();
    visAdgangsadresser(adgangsadresser,false);
  }

  var hentAdgangsadresser= async function(fra,til) {
    var url = danUrl(host + 'replikering/adgangsadresser/haendelser', {sekvensnummerfra: fra, sekvensnummertil: til});
    let response = await fetch(url);
    if (!response.ok) throw response.status
    let adgangsadresser = await response.json();
    visAdgangsadresser(adgangsadresser,true);
  }

  var visAdgangsadresser= function(hændelser, dopopup) {
    var promises= [];    
    for (var i= 0; i<hændelser.length; i++) {
      promises.push(getAdgangsadressebetegnelse(hændelser[i]));
    }
    if (hændelser.length > 0) {
      adgangsadresseajourføringer= adgangsadresseajourføringer + hændelser.length;
      info.update();
      begrænssamtidige(promises, hændelser, 0, 5, visAdgangsadresse, dopopup);
    }
  }

  var getAdgangsadressebetegnelse= function(hændelse) {

    let fraVejstykke= new Promise(async function(resolve, reject) {
     
      if (!hændelse.data.vejkode || !hændelse.data.postnr) {
        resolve({betegnelse: "Ufuldstændig adressebetegnelse"});
        return;
      }
      let vresponse, presponse;     
      [vresponse, presponse]= await Promise.all([
          fetch(danUrl(host+"vejstykker", {kode: hændelse.data.vejkode, kommunekode: hændelse.data.kommunekode})),
          fetch(danUrl(host+"postnumre", {nr: hændelse.data.postnr}))
      ])
      if (!vresponse.ok) {
        resolve({betegnelse: "Ufuldstændig adressebetegnelse (vejnavn)"});
        //reject(vresponse.status);
        return;
      }
       if (!presponse.ok) {
        resolve({betegnelse: "Ufuldstændig adressebetegnelse (postnummer)"});
        //reject(presponse.status);
        return;
      }
      let vejstykker, postnumre;
      [vejstykker, postnumre] = await Promise.all([vresponse.json(), presponse.json()]);
      if (vejstykker[0] && postnumre[0]) {
        let adgangsadresse= {vejnavn: vejstykker[0].navn, husnr: hændelse.data.husnr, supplerendebynavn: hændelse.data.supplerendebynavn, postnr: hændelse.data.postnr, postnrnavn: postnumre[0].navn};
        resolve({betegnelse: util.formatAdgangsadresse(adgangsadresse)});
      }
      resolve({betegnelse: "Ufuldstændig adressebetegnelse"});
      return;
    });

    return fraVejstykke;
  } 

  var adgangsadresserid;
  var visAdgangsadresse= function(adgangsadresse, hændelse, dopopup) { 
    if (hændelse.operation === 'update' && adgangsadresserid === hændelse.data.id) return;
    adgangsadresserid= hændelse.data.id;
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

    var wgs84= kort.etrs89towgs84(hændelse.data.etrs89koordinat_øst, hændelse.data.etrs89koordinat_nord);
    var marker= L.circleMarker(L.latLng(wgs84.y, wgs84.x), {color: color, fillColor: color, stroke: true, fillOpacity: 1.0, radius: 4, weight: 2, opacity: 1.0}).addTo(map);//defaultpointstyle);
    var popup= marker.bindPopup(L.popup().setContent("<a target='_blank' href='https://dawa.aws.dk/replikering/adgangsadresser/haendelser?id="+hændelse.data.id+"'>" + adgangsadresse.betegnelse + "</a>"),{autoPan: true});
    markersLayer.addLayer(marker); 
    if (dopopup) {
      map.flyTo(L.latLng(wgs84.y, wgs84.x),12);
      popup.openPopup();
    }
  }

  var initNavngivneVeje = async function() {
    let url = danUrl(host + 'replikering/haendelser', {entitet: 'dar_navngivenvej_aktuel', tidspunktfra: fra.utc().toISOString(), tidspunkttil: til.utc().toISOString()});
    let response = await fetch(url);
    let navngivneveje = await response.json();
    visNavngivneVeje(navngivneveje,false);
  }

  var hentNavngivneVeje= async function(fra,til) {
    var url = danUrl(host + 'replikering/haendelser', {entitet: 'dar_navngivenvej_aktuel', sekvensnummerfra: fra, sekvensnummertil: til});
    let response = await fetch(url);
    if (!response.ok) throw response.status
    let navngivneveje = await response.json();
    visNavngivneVeje(navngivneveje,true);
  }

  var visNavngivneVeje= function(hændelser, dopopup) {
    for (var i= 0; i<hændelser.length; i++) {
      visNavngivneVej(hændelser[i]);
    } 
    if (hændelser.length > 0) {
      navngivnevejeajourføringer= navngivnevejeajourføringer + hændelser.length;
      info.update();
    } 
  }

  var navngivnevejid;
  var visNavngivneVej= function(hændelse, dopopup) { 
    if (hændelse.operation === 'update' && navngivnevejid === hændelse.data.id) return;
    navngivnevejid= hændelse.data.id;
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

    if (hændelse.data.vejnavnebeliggenhed_vejnavnelinje) {
      if (hændelse.data.vejnavnebeliggenhed_vejnavnelinje.type === 'LineString') {
        for (var i= 0; i < hændelse.data.vejnavnebeliggenhed_vejnavnelinje.coordinates.length; i++) {
          let koordinat= hændelse.data.vejnavnebeliggenhed_vejnavnelinje.coordinates[i];
          let wgs84= kort.etrs89towgs84(koordinat[0], koordinat[0]);
          hændelse.data.vejnavnebeliggenhed_vejnavnelinje.coordinates[i][0]= wgs84.x;
          hændelse.data.vejnavnebeliggenhed_vejnavnelinje.coordinates[i][1]= wgs84.y;
        }
      } else if (hændelse.data.vejnavnebeliggenhed_vejnavnelinje.type === 'MultiLineString') {
        for (var i= 0; i < hændelse.data.vejnavnebeliggenhed_vejnavnelinje.coordinates.length; i++) {
          for (var j= 0; j < hændelse.data.vejnavnebeliggenhed_vejnavnelinje.coordinates[i].length; j++) {
            let koordinat= hændelse.data.vejnavnebeliggenhed_vejnavnelinje.coordinates[i][j];
            let wgs84= kort.etrs89towgs84(koordinat[0], koordinat[1]);
            hændelse.data.vejnavnebeliggenhed_vejnavnelinje.coordinates[i][j][0]= wgs84.y;
            hændelse.data.vejnavnebeliggenhed_vejnavnelinje.coordinates[i][j][1]= wgs84.x;
          }
        }
      }
      else {
        alert('vejnavnebeliggenhed_vejnavnelinje.type har ukendt værdi: ' + vejnavnebeliggenhed_vejnavnelinje.type);
      }
      var polyline = L.polyline(hændelse.data.vejnavnebeliggenhed_vejnavnelinje.coordinates, {color: color}).addTo(map);
      //map.fitBounds(polyline.getBounds());
      var popup= polyline.bindPopup(L.popup({autoPan: true}).setLatLng(polyline.getCenter()).setContent("<a target='_blank' href='https://dawa.aws.dk/replikering/haendelser?entitet=dar_navngivenvej_aktuel&id="+hændelse.data.id+"'>" + hændelse.data.vejnavn + "</a>"));
      if (dopopup) {
        map.flyToBounds(polyline.getBounds());
        polyline.openPopup();
      }
    }
    else if (hændelse.data.vejnavnebeliggenhed_vejnavneområde) {
      if (hændelse.data.vejnavnebeliggenhed_vejnavneområde.type === 'Polygon') {
        for (var i= 0; i < hændelse.data.vejnavnebeliggenhed_vejnavneområde.coordinates.length; i++) {
          for (var j= 0; j < hændelse.data.vejnavnebeliggenhed_vejnavneområde.coordinates[i].length; j++) {
            let koordinat= hændelse.data.vejnavnebeliggenhed_vejnavneområde.coordinates[i][j];
            let wgs84= kort.etrs89towgs84(koordinat[0], koordinat[1]);
            hændelse.data.vejnavnebeliggenhed_vejnavneområde.coordinates[i][j][0]= wgs84.y;
            hændelse.data.vejnavnebeliggenhed_vejnavneområde.coordinates[i][j][1]= wgs84.x;
          }
        }
      }      
      else {
        alert('vejnavnebeliggenhed_vejnavneområde.type har ukendt værdi: ' + vejnavnebeliggenhed_vejnavneområde.type);
      }
      if (hændelse.data.vejnavnebeliggenhed_vejtilslutningspunkter) {
        let koordinat= hændelse.data.vejnavnebeliggenhed_vejtilslutningspunkter.coordinates[0];
        let wgs84= kort.etrs89towgs84(koordinat[0], koordinat[1]);
        var marker= L.circleMarker(L.latLng(wgs84.y, wgs84.x), {color: 'blue', fillColor: 'blue', stroke: true, fillOpacity: 1.0, radius: 4, weight: 2, opacity: 1.0}).addTo(map);
      } 
      var polygon = L.polygon(hændelse.data.vejnavnebeliggenhed_vejnavneområde.coordinates, {color: color}).addTo(map);
      //map.fitBounds(polyline.getBounds());
      var popup= polygon.bindPopup(L.popup({autoPan: true}).setLatLng(polygon.getCenter()).setContent("<a target='_blank' href='https://dawa.aws.dk/replikering/haendelser?entitet=dar_navngivenvej_aktuel&id="+hændelse.data.id+"'>" + hændelse.data.vejnavn + "</a>"));
      if (dopopup) {
        map.flyToBounds(polygon.getBounds());
        polygon.openPopup();
      }
    }
  }

  async function begrænssamtidige(promises, hændelser, start, længde, vis, dopopup) {
    if (start >= promises.length) return;
    var l= (promises.length-start<længde?promises.length-start:længde); 
    var subpromises= promises.slice(start,start+l);
    let data= await Promise.all(subpromises);
    for (var i = 0; i < data.length; i++) {
      let adresse= data[i];
      vis(adresse, hændelser[start+i], dopopup);
    } 
    begrænssamtidige(promises,hændelser,start+længde,længde,vis,dopopup);
  }

  async function senestesekvensnummer() {   
    let response = await fetch(host+"/replikering/senestesekvensnummer");
    let seneste= await response.json(); 
    return seneste.sekvensnummer;
  }

  var info = L.control();

  info.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'info'); 
      this.update();
      return this._div;
  };

  // method that we will use to update the control based on feature properties passed
  info.update = function () {
      this._div.innerHTML = '<h3>Ajourføring af Danmarks Adresser</h3>'+
        '<p>' + fra.local().format('DD.MM.YYYY HH:mm:ss')  + ' - ' + moment().local().format('DD.MM.YYYY HH:mm:ss') + '</p>' +
        '<p>' + adresseajourføringer + ' adresser</p>' +
        '<p>' + adgangsadresseajourføringer + ' adgangsadresser</p>' +
        '<p>' + navngivnevejeajourføringer + ' navngivne veje</p>';
        ;
    
  };

  var legend = L.control({position: 'bottomright'});

  legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend');

    
    div.innerHTML=
            '<p><i style="background: red"></i> Oprettet</p>' +
            '<p><i style="background: orange"></i> Ændret</p>' +
            '<p><i style="background: black"></i> Nedlagt</p>';

    return div;
  };

  async function init() { 
    adresseajourføringer= 0;
    adgangsadresseajourføringer= 0;    
    markersLayer = new L.LayerGroup();   
    fra= moment().startOf('day');
    til= moment();
    let response= await fetch('/getticket');    
    let ticket = await response.text(); 
    map= kort.viskort('map', ticket); 
    info.addTo(map);
    legend.addTo(map);
    markersLayer.addTo(map);
    var center= kort.beregnCenter();
    map.setView(center,2);
    let zoom= map.getZoom();
    sekvensnummer= await senestesekvensnummer();
    await initAdresser();
    await initAdgangsadresser();
    await initNavngivneVeje();
  }

  async function main() {
    init();
    setInterval(async function () {
      if (til.local().date() != moment().local().date()) {
        map.remove();
        init();
      }
      else {
        let seneste= await senestesekvensnummer();
        if (seneste > sekvensnummer) { 
          let snr= sekvensnummer+1;            
          sekvensnummer= seneste;
          await Promise.all([hentAdgangsadresser(snr,seneste),hentAdresser(snr,seneste),hentNavngivneVeje(snr,seneste)]); 
        }
        else {
          map.flyTo(kort.beregnCenter(),2);
        }
      }
    }, 15000);
  }

  main();

//}();