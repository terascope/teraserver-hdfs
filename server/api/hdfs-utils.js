'use strict';
var urlParser = require('url');
var _ = require('lodash');
var Promise = require('bluebird');

function checkTicket(req, endpoint) {
    var isValid = true;
    var error = [];
    var endpointConfig = endpoint[req.params.id];
    var ticket = req.query.ticket ? req.query.ticket : req.params.ticket;

    if (endpointConfig === undefined) {
        isValid = false;
        error.push('endpoint does not exist')
    }

    if (endpointConfig && ticket !== endpointConfig.ticket) {
        isValid = false;
        error.push('invalid ticket for endpoint')
    }

    return {isValid: isValid, error: {error: error.join(' | ')}}
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

function getUri(connectionConfig, endpointConfig) {
    var directory = endpointConfig.directory;
    var path = connectionConfig.path_prefix[0] === '/' ? connectionConfig.path_prefix : '/' + connectionConfig.path_prefix;

    var fullPath;

    if (directory) {
        //checking if there is a '/' in-between the two
        if (!(path[path.length - 1] === '/') && !(directory[0] === '/')) {
            fullPath = path + '/' + directory;
        }
        else {
            fullPath = path + directory;
        }
    }
    else {
        fullPath = path;
    }

    return 'http://' + connectionConfig.namenode_host + ':' + connectionConfig.namenode_port + fullPath;
}

function getData(client, queryPath, hdOptions, reqOptions) {
    var hdOptions = hdOptions ? hdOptions : {};
    return new Promise(function(resolve, reject) {
        client.open(queryPath, hdOptions, reqOptions, function(err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data)
            }
        });
    });
}

function getChunks(client, query, res, offset, length, total, statusCode, reqOptions, logger) {
    getData(client, query, {offset: offset, length: length}, reqOptions)
        .then(function(data) {
            res.write(data, 'binary');

            if (offset + length >= total) {
                res.status(statusCode).end();
                return;
            }
            else {
                var newOffset = offset + length;
                var nextLength = newOffset + length <= total ? length : total - newOffset;
                return getChunks(client, query, res, newOffset, nextLength, total, statusCode, reqOptions, logger)
            }
        }).catch(function(e) {
            if (e.errno === 'ECONNRESET') {
                logger.error("HDFS is currently down", e)
            }
            else {
                logger.error(e)
            }

            res.status(503).end()
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
            return false;
        }
        else {
            if (range.end === 0) {
                //if end is 0 then it wasn't specified, it should default to entire file
                range.end = bytes.length
            }
            if (range.start >= bytes.length || range.end > bytes.length) {
                res.set({'Content-Range': '*/' + bytes.length});
                res.status(416).send({error: ' Requested Range Not Satisfiable '});
                return false;
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

function getClient(config, endpoint) {
    var connection = 'default';

    if (endpoint && endpoint.connection) {
        connection = endpoint.connection
    }

    return config.context.foundation.getConnection({type: 'hdfs', endpoint: connection, cached: true}).client;
}

function getDirPath(endpoint) {
    var dirPath = endpoint.directory ? endpoint.directory : '';

    if (dirPath[0] !== '/') {
        dirPath = '/' + dirPath
    }

    return dirPath
}

module.exports = {
    checkTicket: checkTicket,
    validateQuery: validateQuery,
    getUri: getUri,
    getData: getData,
    getChunks: getChunks,
    processError: processError,
    parseRange: parseRange,
    processHeaders: processHeaders,
    getClient: getClient,
    getDirPath: getDirPath
};
