$(function() {

	 // var mymap = L.map('map').setView([51.505, -0.09], 13);
	 // var osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: 'Data</a> fra <a href="http://dawa.aws.dk">DAWA</a> | Map data &copy;  Styrelsen for Dataforsyning og Effektivisering'});
  //  osm.addTo(mymap);
  //  return;

  $.ajax({
      url: '/getticket'
  })
  .then( function ( ticket ) {

  	var crs = new L.Proj.CRS('EPSG:25832',
      '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs', 
      {
          resolutions: [1638.4, 819.2, 409.6, 204.8, 102.4, 51.2, 25.6, 12.8, 6.4, 3.2, 1.6, 0.8, 0.4, 0.2, 0.1]
      }
    );

	  var map = new L.Map('map', {
	      crs: crs,
	      maxBounds: [
			    [57.751949, 15.193240],
			    [54.559132, 8.074720]
			  ]
	  });

		var skaermkortdaempet = L.tileLayer.wms('https://kortforsyningen.kms.dk/service', 
			{
				//crs: crs,
				format: 'image/png',
				maxZoom: 14,
				minZoom: 2,
				ticket: ticket,
				servicename: 'topo_skaermkort',
    		attribution: 'Data</a> fra <a href="http://dawa.aws.dk">DAWA</a> | Map data &copy;  <a href="http://sdfe.dk">SDFE</a>',
    		layers: 'dtk_skaermkort_daempet',
    		continuousWorld: true
   		}
   	).addTo(map);
  
  	map.fitBounds([
    	[57.751949, 15.193240],
    	[54.559132, 8.074720]
  	]);

  });

});