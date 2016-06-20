var SmartCitizenSpreadsheet = require('./smartcitizen-spreadsheet.js');

var config = require('./config.json');

var spreadsheetPush = new SmartCitizenSpreadsheet(config, function(result) {
    if (result.err) { 
        console.log('Error \✗     ' + JSON.stringify(result));
    } else {
        console.log('Ingested \➜  ' + JSON.stringify(result));
    }
});

spreadsheetPush.start();