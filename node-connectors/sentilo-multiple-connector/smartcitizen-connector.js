var moment = require('moment'),
    request = require('request');

function SmartCitizen(config) {
    this.config = config;
}
SmartCitizen.prototype.push = function(data, done, id) {
    var result = {}
    if (data) {
        if (typeof data === 'object') {
            data = {
                data: [data]
            }
        }
        var post = {
            url: 'https://api.smartcitizen.me/v0/devices/' + (id || this.config.id) + '/readings?access_token=' + this.config.token,
            body: data,
            json: true
        };
        request.post(post, function(err, httpResponse, body) {
            if (err) result.err = err;
            if (body.errors) result.err = err;
            result.data = post.body;
            result.response = body.message;
            if (result.err) {
                console.error('Error \✗     ' + JSON.stringify(result));
            } else {
                console.log('Ingested \➜  ' + JSON.stringify(result));
            }
            if (done) done(result);
        });
    } else {
        if (done) done({
            err: 'no data'
        });
    }
}
SmartCitizen.prototype.create = function(data, done) {
    var result = {};
    if (data) {
        var post = {
            url: 'https://api.smartcitizen.me/v0/devices/?access_token=' + this.config.token,
            body: data,
            json: true
        };
        request.post(post, function(err, httpResponse, body) {
            if (err) result.err = err;
            if (body.errors) result.err = err;
            result.data = post.body;
            if (result.err) {
                console.error('Error \✗     ' + JSON.stringify(result));
            } 
            if (done) done(body);
        });
    } else {
        if (done) done({
            err: 'no data'
        });
    }
}

SmartCitizen.prototype.get = function(data, done) {
    var result = {};
    var self = this;
    if (data && data.name) {
        var post = {
            url: 'https://api.smartcitizen.me/v0/devices/?q[name_eq]=' + data.name + '&access_token=' + this.config.token,
            json: true
        };
        request.get(post, function(err, httpResponse, body) {
            if (err) result.err = err;
            if (body.errors) result.err = err;
            result.data = post.body;
            result.response = body.message;
            if (result.err) {
                console.error('Error \✗     ' + JSON.stringify(result));
            } 
            if (done) done(body);
        });
    } else {
        if (done) done({
            err: 'no data'
        });
    }
}

module.exports = SmartCitizen;