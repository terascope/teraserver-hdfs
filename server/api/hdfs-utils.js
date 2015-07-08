'use strict';
var urlParser = require('url');
var _ = require('lodash');
var Promise = require('bluebird');

function checkTicket(req, endpoint) {
    var endpointConfig = endpoint[req.params.id];

    return req.query.ticket === endpointConfig.ticket
}

function validateQuery(req, endpoint) {
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
}

function formatConfig(obj) {
    var clone = _.clone(obj);

    if (!clone.path_prefix) {
        clone.path_prefix = '/webhdfs/v1';
    }
    if (clone.directory) {
        //checking if there is a '/' in-between the two
        if (!(clone.path_prefix[clone.path_prefix.length - 1] === '/') && !(clone.directory[0] === '/')) {
            clone.path_prefix += '/' + clone.directory;
        }
        else {
            clone.path_prefix += clone.directory;
        }
    }

    return clone;
}

function getData(client, queryPath, options) {
    var options = options ? options : {};

    return new Promise(function (resolve, reject) {
        client.open(queryPath, options, function (err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data)
            }
        });
    });
}

function getChunks(client, query, res, offset, length, total, statusCode) {
    getData(client, query.path, {offset: offset, length: length})
        .then(function (data) {
            res.write(data);
            if (offset + length >= total) {
                res.status(statusCode).end();
                return;
            }
            else {
                var newOffset = offset + length;
                var nextLength = newOffset + length <= total ? length : total - newOffset;
                return getChunks(client, query, res, newOffset, nextLength, total)
            }
        });
}

function parseRange(str) {
    var range, start, end;

    if (str.match(/bytes=/)) {
        range = str.slice(6).split('-');
        start = Number(range[0]);
        end = Number(range[1]);
        if (isNaN(start) || isNaN(end)) {
            return false;
        }
        else {
            return {start: start, end: end, statusCode: 206}
        }
    }
    else {
        return false;
    }
}

function processHeaders(req, res, bytes) {
    if (req.headers.range) {
        var range = parseRange(req.headers.range);
        if (!range) {
            res.status(400).send({error: ' range header is not formatted correctly '});
            return;
        }
        else {
            if (range.end === 0) {
                //if end is 0 then it wasn't specified, it should default to entire file
                range.end = bytes.length
            }
            if (range.start >= bytes.length || range.end > bytes.length) {
                res.set({'Content-Range': '*/' + bytes.length});
                res.status(416).send({error: ' Requested Range Not Satisfiable '});
                return;
            }
            else {
                //spec says start and end are zero based and inclusive, e.g. middle to end 1024-2047/2048 Length: 1024
                var rangeEnd = range.end - 1;
                res.set({
                    'Content-Range': 'bytes ' + range.start + '-' + rangeEnd + '/' + bytes.length,
                    'Content-Length': range.end - range.start
                });

                return range;
            }
        }
    }
}

function processError(err) {
    return {error: err.message};
}

module.exports = {
    checkTicket: checkTicket,
    validateQuery: validateQuery,
    formatConfig: formatConfig,
    getData: getData,
    getChunks: getChunks,
    processError: processError,
    parseRange: parseRange,
    processHeaders: processHeaders
};
