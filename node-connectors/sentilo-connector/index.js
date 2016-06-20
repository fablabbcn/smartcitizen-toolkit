var SmartCitizen = require('./smartcitizen-connector.js'),
    request = require('request'),
    moment = require('moment');

var smartcitizen = new SmartCitizen({
    id: 3508,
    token: 'XEGwy6BsEybbz3BjYxemxfTQcHjAAJ1s3vJkemhdQ45Cq4hvBM7pNlrY48SUjCfai'
});

setInterval(function() {
    request.get({
        json: true,
        url: 'http://connecta.bcn.cat/connecta-catalog-web/admin/sensor/lastOb/CESVA.TA120-T240427.TA120-T240427-N/'
    }, function(err, httpResponse, body) {
        if (body && body.value && body.timestamp) {
            smartcitizen.push({
                recorded_at: moment(body.timestamp, 'DD/MM/YYYYThh:mm:ss'),
                sensors: [{
                    id: 'ta120noise',
                    value: Number(body.value)
                }]
            })
        }
    });
}, 60000);
