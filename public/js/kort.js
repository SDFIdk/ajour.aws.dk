var maxBounds= [
  [57.751949, 15.193240],
  [54.559132, 8.074720]
];

var viskort = function(id,ticket) {
	var crs = new L.Proj.CRS('EPSG:25832',
    '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs', 
    {
        resolutions: [1638.4, 819.2, 409.6, 204.8, 102.4, 51.2, 25.6, 12.8, 6.4, 3.2, 1.6, 0.8, 0.4, 0.2, 0.1]
    }
  );

  var map = new L.Map(id, {
      crs: crs,
      minZoom: 2,
      maxZoom: 14,
      maxBounds: maxBounds
  });

  function danKort(service,layer,styles,transparent) {
		return L.tileLayer.wms('https://kortforsyningen.kms.dk/service', 
			{
				format: 'image/png',
				maxZoom: 14,
				minZoom: 2,
				ticket: ticket,
				servicename: service,
	  		attribution: 'Data</a> fra <a href="http://dawa.aws.dk">DAWA</a> | Map data &copy;  <a href="http://sdfe.dk">SDFE</a>',
	  		layers: layer,
	  		styles: styles,
	  		transparent: transparent
	 		}
 		);
	}

 	var skaermkort= danKort('topo_skaermkort', 'dtk_skaermkort', 'default', false).addTo(map)
 		, skaermkortdaempet= danKort('topo_skaermkort', 'dtk_skaermkort_daempet', 'default', false)
 		, ortofoto= danKort('orto_foraar', 'orto_foraar', 'default', false)
 		, quickortofoto= danKort('orto_foraar_temp', 'quickorto_2017_10cm', 'default', false)
 		, historisk1842til1899= danKort('topo20_hoeje_maalebordsblade', 'dtk_hoeje_maalebordsblade', 'default', false)
 		, matrikelkort= danKort('mat', 'Centroide,MatrikelSkel,OptagetVej','sorte_centroider,sorte_skel,default','true')
 		, postnrkort= danKort('dagi', 'postdistrikt', 'default','true')
 		, kommunekort= danKort('dagi', 'kommune', 'default','true');

	var adressekort = L.tileLayer.wms('https://kort.aws.dk/geoserver/aws4/wms', {
	    transparent: true,
	    layers: 'adgangsadresser',
	    format: 'image/png',
	    continuousWorld: true
	  });

 	 var baselayers = {
    "Skærmkort": skaermkort,
    "Skærmkort - dæmpet": skaermkortdaempet,
    "Ortofoto": ortofoto,
    "Quick ortofoto": quickortofoto,
   	"Historisk 1842-1899": historisk1842til1899
  };

  var overlays = {
   	"Matrikelkort": matrikelkort,
   	"Kommunekort": kommunekort,
   	"Postnummerkort": postnrkort,
   	"Adressekort": adressekort
  };

  L.control.layers(baselayers, overlays, {position: 'bottomleft'}).addTo(map);
  //L.control.search().addTo(map);

  map.on('baselayerchange', function (e) {
    if (e.name === 'Skærmkort' ||
    		e.name === "Skærmkort - dæmpet" ||
    		e.name === "Historisk 1842-1899") {
        matrikelkort.setParams({
            styles: 'sorte_centroider,sorte_skel,default'
        });
        postnrkort.setParams({
            styles: 'default'
        });
        kommunekort.setParams({
            styles: 'default'
        });
    } else if (e.name === 'Flyfoto') {
        matrikelkort.setParams({
            styles: 'gule_centroider,gule_skel,Gul_OptagetVej,default'
        });
        postnrkort.setParams({
            styles: 'yellow'
        });
        kommunekort.setParams({
            styles: 'yellow'
        });
    }
  });

	map.fitBounds(maxBounds);

	return map;
};


proj4.defs([
  [
    'EPSG:4326',
    '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'],
  [
      'EPSG:25832',
      '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs'
  ]
]);

var etrs89towgs84= function(x,y) {
	  return proj4('EPSG:25832','EPSG:4326', {x:x, y:y});  
}