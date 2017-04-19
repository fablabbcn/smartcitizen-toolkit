navigator.geolocation.getCurrentPosition(function(pos) {

  var yourLocation = [pos.coords.latitude, pos.coords.longitude];

  console.log(yourLocation);

  $.getJSON('https://api.smartcitizen.me/v0/devices', {
    near: yourLocation.toString()
  }, function(devices) {
    var closestDevice = devices[0];
    console.log(closestDevice);
    $('div').html(closestDevice.name);
  })

}, function(err) {
  console.warn(err);
}, {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
});