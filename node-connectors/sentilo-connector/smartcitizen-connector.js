var moment = require('moment'),
    request = require('request');

function SmartCitizen(config) {
    this.config = config;
}
SmartCitizen.prototype.push = function(data, done) {
    var result = {};
    var self = this;
    if (data) {
        if (typeof data === 'object') {
            data = {
                data: [data]
            }
        }
        console.log(data);
        var post = {
            url: 'https://api.smartcitizen.me/v0/devices/' + this.config.id + '/readings?access_token=' + this.config.token,
            body: data,
            json: true
        };
        request.post(post, function(err, httpResponse, body) {
            if (err) result.err = err;
            if (body.errors) result.err = err;
            result.data = post.body;
            result.response = body.message;
            if (result.err) {
                console.log('Error \✗     ' + JSON.stringify(result));
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
module.exports = SmartCitizen;