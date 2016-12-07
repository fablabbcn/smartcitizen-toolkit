var SmartCitizen = require('./smartcitizen-connector.js'),
    request = require('request'),
    moment = require('moment'),
    _ = require('underscore'),
    async = require('async');

var config = {
  base_url: 'http://connecta.bcn.cat/connecta-catalog-web/component/map/',
  smartcitizen_token: '',
  max_connections: 10
}

var smartcitizen = new SmartCitizen({
    token: config.smartcitizen_token 
});

// launch();

exports.myHandler = function(event, context) {
    launch();   
};

function launch(done) {
    var updateQueue = async.queue(updateSensor, config.max_connections); // Run ten simultaneous pushes

    updateQueue.drain = function() {
        console.log("All sensors are updated!");
        if (done) done();
    };

    updateQueue.empty = function() {
        console.log("The queue is empty!");
    };

    getSentiloNoiseSensors(function(noiseSensors){
        updateQueue.push(noiseSensors);
    });
}

function getSentiloNoiseSensors(done){
    request.get({
        json: true,
        url: config.base_url + 'json'
    }, function(err, httpResponse, body) {
        var noiseSensors = _.where(body.components, {type: "noise"});
        done(noiseSensors);
    });
}

function updateSensor(sentiloComponent, done){
    makeSensor(sentiloComponent, function(device){
        pushData(device, done);
    });
}

function makeSensor(sentiloComponent, done){
    getDevice(sentiloComponent, function(device){
        if(device) {
            device.sentilo_id = sentiloComponent.id;
            done(device);
        } else {
            createDevice(sentiloComponent, function(device){
                device.sentilo_id = sentiloComponent.id;
                done(device);
            });
        }
    })

}

function pushData(device, done){
    request.get({
        json: true,
        url: config.base_url + device.sentilo_id + '/lastOb'
    }, function(err, httpResponse, body) {
        if (body && body.sensorLastObservations && body.sensorLastObservations.length > 0) {
        var sensorLastObservation = body.sensorLastObservations[0];
            smartcitizen.push({
                recorded_at: moment(sensorLastObservation.timestamp, 'DD/MM/YYYYThh:mm:ss'),
                sensors: [{
                    id: 'ta120noise',
                    value: Number(sensorLastObservation.value)
                }]
            }, done, device.id);
        } 
    });
}


function getDevice(sentiloComponent, done){
    smartcitizen.get({name: 'Sentilo Noise ' + sentiloComponent.id.split('-').pop()}, function(devices){
        if (devices.length > 0) {
            done(devices[0]);
        } else {
            done(false);
        }
    }); 
}

function createDevice(sentiloComponent, done){
   var data = {
        name: 'Sentilo Noise ' + sentiloComponent.id.split('-').pop(),
        description: 'BCN CESVA TA120 farola amb AP26 polling data from Sentilo http://connecta.bcn.cat/connecta-catalog-web/component/' + sentiloComponent.id + '/detail',
        kit_id: 5,
        exposure: 'outdoor',
        latitude: sentiloComponent.centroid.latitude,
        longitude: sentiloComponent.centroid.longitude,
        user_tags: 'SentiloNoise, Research, Experimental'
    }

    smartcitizen.create(data, function(device){
        done(device);
    }); 
}