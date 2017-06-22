$(function() {

  var map
    , fra= moment().startOf('day')
    , til= moment()
    , sekvensnummer= 0
    , host= 'http://dawa.aws.dk/';


  var danUrl= function (path, query) {    
    var url = new URL(path);
    Object.keys(query).forEach(key => url.searchParams.append(key, query[key]));
    return url;
  }

  var initAdresser = function() {
    return new Promise(async function(resolve, reject) {
      let url = danUrl(host + 'replikering/adresser/haendelser', {tidspunktfra: fra.utc().toISOString(), tidspunkttil: til.utc().toISOString()});
      let response = await fetch(url);
      if (!response.ok) {
        reject(response.status);
        return;
      }
      let adresser = await response.json();
      visAdresser(adresser,false);
      resolve();
    });
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
      let url = danUrl(host+"adresser", {id: hændelser[i].data.id, struktur: "mini"});
      promises.push(fetch(url));
      if (sekvensnummer < hændelser[i].sekvensnummer) sekvensnummer= hændelser[i].sekvensnummer;
    }
    begrænssamtidige(promises, hændelser, 0, 10, visAdresse, dopopup);
  }

  var adresserid;
  var visAdresse= function(adresse, hændelse, dopopup) { 
    if (hændelse.operation === 'update' && adgangsadresserid === hændelse.data.id) return;
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
    var popup= marker.bindPopup(L.popup().setContent("<a target='_blank' href='https://dawa.aws.dk/replikering/adresser/haendelser?id="+hændelse.data.id+"'>" + formatAdresse(adresse) + "</a>"),{autoPan: true});
    
    if (dopopup) {
      map.flyTo(L.latLng(adresse.y, adresse.x),12);
      popup.openPopup();
    }
  }

  var initAdgangsadresser= function() {
    return new Promise(async function(resolve, reject) {
      let url = danUrl(host + 'replikering/adgangsadresser/haendelser', {tidspunktfra: fra.utc().toISOString(), tidspunkttil: til.utc().toISOString()});
      let response = await fetch(url);
      if (!response.ok) {
        reject(response.status);
        return;
      }
      let adgangsadresser = await response.json();
      visAdgangsadresser(adgangsadresser,false);
      resolve();
    });
  }

  var hentAdgangsadresser= async function(fra,til) {
    var url = danUrl(host + 'replikering/adgangsadresser/haendelser', {sekvensnummerfra: fra, sekvensnummertil: til});
    let response = await fetch(url);
    if (!response.ok) throw response.status
    let adgangsadresser = await response.json();
    visAdgangsadresser(adgangsadresser,true);
  }

  var getAdgangsadressebetegnelse= function(hændelse) {

    let fraVejstykke= new Promise(async function(resolve, reject) {
     
      let vresponse, presponse;     
      [vresponse, presponse]= await Promise.all([
          fetch(danUrl(host+"vejstykker", {kode: hændelse.data.vejkode, kommunekode: hændelse.data.kommunekode})),
          fetch(danUrl(host+"postnumre", {nr: hændelse.data.postnr}))
        ])
       if (!vresponse.ok) {
        reject(vresponse.status);
        return;
      }
       if (!presponse.ok) {
        reject(presponse.status);
        return;
      }
      let vejstykker, postnumre;
      [vejstykker, postnumre] = await Promise.all([vresponse.json(), presponse.json()]);
      let adgangsadresse= {vejnavn: vejstykker[0].navn, husnr: hændelse.data.husnr, supplerendebynavn: hændelse.data.supplerendebynavn, postnr: hændelse.data.postnr, postnrnavn: postnumre[0].navn};
      resolve({betegnelse: formatAdgangsadresse(adgangsadresse)});
    });

    return fraVejstykke;
  } 


  var visAdgangsadresser= function(hændelser, dopopup) {
    var promises= [];    
    for (var i= 0; i<hændelser.length; i++) {
      promises.push(getAdgangsadressebetegnelse(hændelser[i]));
      if (sekvensnummer < hændelser[i].sekvensnummer) sekvensnummer= hændelser[i].sekvensnummer;
    }
    begrænssamtidige(promises, hændelser, 0, 5, visAdgangsadresse, dopopup);
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

    var wgs84= etrs89towgs84(hændelse.data.etrs89koordinat_øst, hændelse.data.etrs89koordinat_nord);
    var marker= L.circleMarker(L.latLng(wgs84.y, wgs84.x), {color: color, fillColor: color, stroke: true, fillOpacity: 1.0, radius: 4, weight: 2, opacity: 1.0}).addTo(map);//defaultpointstyle);
    var popup= marker.bindPopup(L.popup().setContent("<a target='_blank' href='https://dawa.aws.dk/replikering/adgangsadresser/haendelser?id="+hændelse.data.id+"'>" + adgangsadresse.betegnelse + "</a>"),{autoPan: true});
   
    if (dopopup) {
      try {
      map.flyTo(L.latLng(wgs84.y, wgs84.x),12);
      popup.openPopup();
      }
      catch(e) {
        let s= e;
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

  async function main() {
    let response= await fetch('/getticket');    
    let ticket = await response.text(); 
    map= viskort('map', ticket);
    await initAdgangsadresser();
    setInterval(async function () {
      let response = await fetch(host+"/replikering/senestesekvensnummer");
      let seneste= await response.json();
      if (seneste.sekvensnummer > sekvensnummer) { 
        var snr= sekvensnummer+1;            
        sekvensnummer= seneste.sekvensnummer;
        hentAdgangsadresser(snr,seneste.sekvensnummer); 
      }
      else {
        map.flyToBounds([
          [57.751949, 15.193240],
          [54.559132, 8.074720]
        ]);
      }
    }, 15000);
  }

  main();

});