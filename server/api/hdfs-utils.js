'use strict';
var urlParser = require('url');

exports.checkTicket = function(req, endpoint){
    var endpointConfig = endpoint[req.params.id];

    return req.query.ticket === endpointConfig.ticket
};

exports.validateQuery = function (req, endpoint) {

    var isValid = true;
    var error = [];
    var parsedUrl = urlParser.parse(req.url);
    var path = parsedUrl.pathname;
    var endpointConfig = endpoint[req.params.id];


    if (!endpointConfig) {
        isValid = false;
        error.push(' endpoint does not exist ');
    }
    if (path.length < 2) {
        isValid = false;
        error.push(' filepath in url is required ');
    }
    if (path.match(/\.\./)) {
        isValid = false;
        error.push(' cannot use ".." in file path ');
    }

    return {isValid: isValid, path: path, error: {error: error.join(' | ')}}
};