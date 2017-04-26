d4.feature('dayGrid', function(name) {

    var xAxis = d3.svg.axis();

    return {
        accessors: {
            formatXAxis: function(xAxis) {
                return xAxis.orient('bottom');
            }
        },
        proxies: [{
            target: xAxis,
            prefix: 'x'
        }],
        render: function(scope, data, selection) {
            xAxis.scale(this.x);

            var formattedXAxis = d4.functor(scope.accessors.formatXAxis).bind(this)(xAxis);

            selection.append('g').attr('class', 'grid border ' + name)
                .attr('transform', 'translate(0,0)')
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', this.width)
                .attr('height', this.height);

            selection.append('g')
                .attr('class', 'x grid ' + name)
                .attr('transform', 'translate(0,' + this.height + ')')
                .call(formattedXAxis
                    .tickSize(-this.height, 0, 0)
                    .tickFormat(''));

            return selection;
        }
    };
});


var localeFormatter = d3.locale({
    "decimal": ",",
    "thousands": ".",
    "grouping": [3],
    "currency": ["€", ""],
    "dateTime": "%a %b %e %X %Y",
    "date": "%d-%m-%Y",
    "time": "%H:%M:%S",
    "periods": ["AM", "PM"],
    "days": ["Diumenge", "Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte"],
    "shortDays": ["Diumenge", "Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte"],
    //"shortDays": ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"],
    "months": ["Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "Oktober", "November", "December"],
    "shortMonths": ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"]
})

var tickFormat = localeFormatter.timeFormat.multi([
    ["%H:%M", function(d) {
        return d.getMinutes();
    }],
    ["%H:%M", function(d) {
        return d.getHours();
    }],
    ["%a %d", function(d) {
        return d.getDay() && d.getDate() != 1;
    }],
    ["%b %d", function(d) {
        return d.getDate() != 1;
    }],
    ["%B", function(d) {
        return d.getMonth();
    }],
    ["%Y", function() {
        return true;
    }]
]);


var optionsSensor = {
    tag: 'Plaça del sol',
    rollup: '1m',
    from: '2017-04-17',
    to: '2017-04-24',
    domain: [40, 110],
    width: 6000,
    height: 500
};

var optionsNoise = {
    sensor: 29,
    rollup: optionsSensor.rollup,
    from: optionsSensor.from,
    to: optionsSensor.to
};

var optionsBattery = {
    sensor: 10,
    rollup: '10m',
    from: optionsSensor.from,
    to: optionsSensor.to
};

var fetchSmartCitizenData = function(device, options, callback) {
    var opt = {};

    opt.sensor = options.sensor || 29;
    opt.rollup = options.rollup || '1m'
    opt.from = options.from || '2017-04-10'
    opt.to = options.to || '2017-04-24'


    if (device.name.includes("Sentilo")) {
        if (opt.sensor == 29) {
            opt.sensor = 23;
        } else {
            opt.sensor = 23;
        }
    }




    var url = 'https://api.smartcitizen.me/v0/devices/' + device.id + '/readings?sensor_id=' + opt.sensor + '&rollup=' + opt.rollup + '&from=' + opt.from + '&to=' + opt.to + '&all_intervals=true';

    d3.json(url, function(json) {
        chartData = {};
        chartData.values = json.readings.map(function(reading, index) {
            return {
                date: d3.time.format.iso.parse(reading[0]),
                value: reading[1] 
                // value: (reading[1] != null) ? 100 : 0
            }
        });
        chartData.key = json.sensor_id == 10 ? 'bateria' : 'soroll'; //Temp. 
        chartData.unit = json.sensor_id == 29 ? 'dB C' : 'db A'; //Temp. 
        callback(null, chartData);
    });
}

var fetchKitData = function(device) {
    if (device.name.includes("Sentilo")) {
        return d3.queue()
            .defer(fetchSmartCitizenData, device, optionsNoise)
    } else {
        return d3.queue()
            .defer(fetchSmartCitizenData, device, optionsNoise)
            .defer(fetchSmartCitizenData, device, optionsBattery)
    }


}

var chart = d4.charts.line()
    .marginLeft(70)
    .marginRight(70)
    .outerWidth(optionsSensor.width)
    .outerHeight(optionsSensor.height)
    .x(function(x) {
        x.min(new Date(optionsSensor.from));
        x.max(new Date(optionsSensor.to));
        x.scale('time');
        x.key('date');
    })
    .y(function(y) {
        y.scale('linear');
        y.domain(optionsSensor.domain);
        y.key('value');
    })
    .mixin({
        name: 'grid',
        feature: d4.features.dayGrid,
        index: 0
    })
    .using('xAxis', function(axis) {
        axis.tickFormat(tickFormat);
        axis.ticks(d3.timeDay.every(0.5));
    })
    .using('yAxis', function(axis) {
        axis.title('A');
        axis.align('left');
        axis.orient('left');
    });

var renderTitle = function() {
    d3.select('body')
        .append('div')
        .style('width', optionsSensor.width + 'px')
        .attr('class', 'header')
        .html(optionsSensor.tag + ' <span>del ' + optionsSensor.from + ' al ' + optionsSensor.to + '</span>');
}

var renderChart = function(id, data) {
    console.log(data);
    var selector = '#device-' + id;
    var c = d3.select(selector)
        .datum(data.dataset)
        .call(chart);
    c.select('g.margins')
        .append('text')
        .attr('class', 'device-info')
        .attr('transform', "translate(-600, 300)")
        .text(data.device.name);
    c.select('g.margins')
        .append('text')
        .attr('class', 'device-info extra')
        .attr('transform', "translate(-600, 350)")
        .text(' de ' + data.device.owner_username + '');
    c.select('g.margins')
        .append('text')
        .attr('class', 'device-info meta')
        .attr('transform', "translate(-600, 400)")
        .text('interior ▢   |  exterior ▢');
    c.select('text.title')
        .text(data.dataset[0].unit); //Temp.
}

var makeCharts = function() {
    d3.json('https://api.smartcitizen.me/v0/devices/world_map', function(devices) {

        var devices = devices.filter(function(device) {
            return device && device.user_tags && device.user_tags.includes(optionsSensor.tag);
        }).sort(function(a, b) {
            return a.owner_id - b.owner_id || a.id - b.id;
            //return a.owner_id - b.owner_id;
        })

        console.log(devices.length);

        devices.forEach(function(device) {
            d3.select("body").data(devices).append("div").attr("id", 'device-' + device.id);
        });

        //d3.select("body").data(devices).enter().append("div").attr("id", function (d) { return 'device-' + d.id });

        devices.forEach(function(device) {
            fetchKitData(device).awaitAll(function(error, results) {
                renderChart(device.id, {
                    device: device,
                    dataset: results
                });
            });
        });
    });
}

var makePage = function() {
    renderTitle();
    makeCharts();
    //fetchKitData({id: 4307}, renderChart);
}

document.addEventListener('DOMContentLoaded', function(event) {
    makePage();
});
//makeCharts();
// fetchKitData(4307, renderChart);
// fetchKitData(4283, renderChart);