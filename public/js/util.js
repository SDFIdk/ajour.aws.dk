function corssupported() {
  return "withCredentials" in (new XMLHttpRequest());
}

function formatAdgangsadresse(mini, enlinje) {
	let separator= (enlinje || typeof enlinje != 'undefined')?", ":"<br/>";
	let supplerendebynavn= mini.supplerendebynavn?separator + mini.supplerendebynavn:"";
	return `${mini.vejnavn} ${mini.husnr}${supplerendebynavn}${separator}${mini.postnr} ${mini.postnrnavn}`;	
}

function formatAdresse(mini, enlinje) {
	let separator= (enlinje || typeof enlinje != 'undefined')?", ":"<br/>";
	let etagedør= (mini.etage?", "+mini.etage+".":"") + (mini.dør?" "+mini.dør:"");

	let supplerendebynavn= mini.supplerendebynavn?separator + mini.supplerendebynavn:"";
	return `${mini.vejnavn} ${mini.husnr}${etagedør}${supplerendebynavn}${separator}${mini.postnr} ${mini.postnrnavn}`;	
}