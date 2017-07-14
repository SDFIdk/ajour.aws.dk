exports.corssupported= function () {
  return "withCredentials" in (new XMLHttpRequest());
}

exports.formatAdgangsadresse= function (mini, enlinje) {
	let separator= (enlinje || typeof enlinje != 'undefined')?", ":"<br/>";
	let supplerendebynavn= mini.supplerendebynavn?separator + mini.supplerendebynavn:"";
	return `${mini.vejnavn} ${mini.husnr}${supplerendebynavn}${separator}${mini.postnr} ${mini.postnrnavn}`;	
}

exports.formatAdresse= function (mini, enlinje) {
	let separator= (enlinje || typeof enlinje != 'undefined')?", ":"<br/>";
	let etagedør= (mini.etage?", "+mini.etage+".":"") + (mini.dør?" "+mini.dør:"");

	let supplerendebynavn= mini.supplerendebynavn?separator + mini.supplerendebynavn:"";
	return `${mini.vejnavn} ${mini.husnr}${etagedør}${supplerendebynavn}${separator}${mini.postnr} ${mini.postnrnavn}`;	
}