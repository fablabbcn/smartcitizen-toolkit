io.connect('wss://ws.smartcitizen.me').on('data-received', function(device) {
  $('body').append("<div>" + device.data.name + "</div>");
});