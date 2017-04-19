io.connect('wss://smartcitizen.xyz').on('data-received', function(device) {
  $('body').append("<div>" + device.data.name + "</div>");
});