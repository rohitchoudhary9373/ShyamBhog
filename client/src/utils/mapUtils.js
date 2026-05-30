export const handleMapClick = (e, locationName, mapUrl) => {
  e.preventDefault();
  const isIOS = /iPhone|iPad|iPod|Mac/.test(navigator.userAgent);
  
  if (isIOS) {
    // Attempt to parse coordinates if available, otherwise use query
    // Create an action sheet feel or just open Apple Maps directly
    const useAppleMaps = window.confirm("Open in Apple Maps? (Cancel for Google Maps)");
    if (useAppleMaps) {
      window.open(`http://maps.apple.com/?q=${encodeURIComponent(locationName)}`, '_blank');
    } else {
      window.open(mapUrl || `https://maps.google.com/?q=${encodeURIComponent(locationName)}`, '_blank');
    }
  } else {
    // Android / Desktop
    window.open(mapUrl || `https://maps.google.com/?q=${encodeURIComponent(locationName)}`, '_blank');
  }
};
