function corssupported() {
  return "withCredentials" in (new XMLHttpRequest());
}