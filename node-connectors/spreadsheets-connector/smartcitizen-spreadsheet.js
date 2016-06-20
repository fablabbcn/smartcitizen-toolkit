var googleSpreadsheet = require('google-spreadsheet'),
    moment = require('moment'),
    request = require('request'),
    _ = require('underscore');

function SmartCitizenSpreadsheet(config, done) {
    this.config = config;
    this.done = done;
    this.doc = new googleSpreadsheet(config.google_spreadsheet.token);
}
SmartCitizenSpreadsheet.prototype.readAndPush = function() {
    var done = this.done;
    var config = this.config;
    var result = {};
    var doc = this.doc;
    doc.getInfo(function(err, info) {
        result.spreadsheet = 'Spreadsheet data from: ' + info.title + ' by ' + info.author.email + ' (Last update: ' + moment(info.updated).fromNow() + ')';
        _.each(info.worksheets, function(worksheet) {
            if (!isNaN(parseFloat(worksheet.title)) && isFinite(worksheet.title)) {
                var deviceData = {
                    id: Number(worksheet.title),
                    token: config.smartcitizen.token
                }
                var get = {
                    url: 'https://api.smartcitizen.me/v0/devices/' + deviceData.id,
                    json: true
                };
                request.get(get, function(err, httpResponse, device) {
                    if (err) {
                        result.err = err;
                        done(result);
                    }
                    var lastUpdateTime = moment.utc(device.data.recorded_at);
                    worksheet.getRows({
                        orderby: 'col1',
                        //query: 'recordedat <' + lastUpdateTime.format('DD/MM/YYYY hh:mm:ss')
                    }, function(err, rows) {
                        var exludeProperties = ['_xml', 'id', '_links'];
                        var pushData = _.filter(rows, function(row) {
                            row.recordedat = moment.utc(row.recordedat, 'DD/MM/YYYY hh:mm:ss');
                            return (row.recordedat.isValid() && row.recordedat.isAfter(lastUpdateTime));
                        }).map(function(row) {
                            return _.chain([exludeProperties]).flatten().reduce(function(obj, key) {
                                delete obj[key];
                                return obj;
                            }, row).value();;
                        }).map(function(row) {
                            var reading = {};
                            reading.recorded_at = row.recordedat;
                            delete row.recordedat;
                            reading.sensors = _.map(row, function(obj, key) {
                                if (typeof obj !== 'function' && !isNaN(parseFloat(obj)) && isFinite(obj)) {
                                    return {
                                        id: key,
                                        value: Number(obj)
                                    }
                                };
                            }).filter(function(sensor) {
                                return sensor;
                            });;
                            return reading;
                        });
                        if (pushData.length > 0) {
                            var post = {
                                url: 'https://api.smartcitizen.me/v0/devices/' + deviceData.id + '/readings?access_token=' + deviceData.token,
                                body: {
                                    data: pushData
                                },
                                json: true
                            };
                            request.post(post, function(err, httpResponse, body) {
                                if (err) result.err = err;
                                if (body.errors) result.err = err;
                                result.data = post.body;
                                result.response = body.message;
                                done(result);
                            });
                        } else {
                            result.err = "data already ingested"
                            done(result);
                        }
                    });
                });
            } else {
                result.err = "no valid spreadsheet name"
                done(result);
            }
        });
    });
}
SmartCitizenSpreadsheet.prototype.start = function() {
    var self = this;
    self.readAndPush();
    self.pid = setInterval(function() {
        self.readAndPush();
    }, 30000);
}
SmartCitizenSpreadsheet.prototype.stop = function() {
    clearInterval(this.pid);
}
module.exports = SmartCitizenSpreadsheet;