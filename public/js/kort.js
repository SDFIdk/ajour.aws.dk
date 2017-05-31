var viskort = function(id,ticket) {
	var crs = new L.Proj.CRS('EPSG:25832',
    '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs', 
    {
        resolutions: [1638.4, 819.2, 409.6, 204.8, 102.4, 51.2, 25.6, 12.8, 6.4, 3.2, 1.6, 0.8, 0.4, 0.2, 0.1]
    }
  );

  var map = new L.Map(id, {
      crs: crs,
      maxBounds: [
		    [57.751949, 15.193240],
		    [54.559132, 8.074720]
		  ]
  });

	var skaermkortdaempet = L.tileLayer.wms('https://kortforsyningen.kms.dk/service', 
		{
			format: 'image/png',
			maxZoom: 14,
			minZoom: 2,
			ticket: ticket,
			servicename: 'topo_skaermkort',
  		attribution: 'Data</a> fra <a href="http://dawa.aws.dk">DAWA</a> | Map data &copy;  <a href="http://sdfe.dk">SDFE</a>',
  		layers: 'dtk_skaermkort_daempet'
 		}
 	).addTo(map);

	map.fitBounds([
  	[57.751949, 15.193240],
  	[54.559132, 8.074720]
	]);

	 var koor1= etrs89towgs84(6440000,890000)
	 var koor2= etrs89towgs84(6072000,1699000);

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