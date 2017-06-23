function corssupported() {
  return "withCredentials" in (new XMLHttpRequest());
}

function formatAdgangsadresse(mini) {
	let supplerendebynavn= mini.supplerendebynavn?", " + mini.supplerendebynavn:"";
	return `${mini.vejnavn} ${mini.husnr}${supplerendebynavn}, ${mini.postnr} ${mini.postnrnavn}`;	
}

function formatAdresse(mini) {
	let etagedør= (mini.etage?", "+mini.etage+".":"") + (mini.dør?" "+mini.dør:"");

	let supplerendebynavn= mini.supplerendebynavn?", " + mini.supplerendebynavn:"";
	return `${mini.vejnavn} ${mini.husnr}${etagedør}${supplerendebynavn}, ${mini.postnr} ${mini.postnrnavn}`;	
}