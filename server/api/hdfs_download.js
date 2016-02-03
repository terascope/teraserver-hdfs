'use strict';

var utils = require('./hdfs-utils');

module.exports = function(config) {
    var endpoint = config.server_config['teraserver-hdfs'];
    var logger = config.logger;

    return function(req, res) {
        var ticket = utils.checkTicket(req, endpoint);

        if (!ticket.isValid) {
            res.status(401).json(ticket.error)
        }
        else {
            var query = utils.validateQuery(req, endpoint);

            // notifying client that range is permissible
            res.set('Accept-Ranges', 'bytes');
            res.set('Content-Type', 'application/octet-stream');

            if (!query.isValid) {
                res.status(400).json(query.error)
            }
            else {
                var requestedEndpoint = endpoint[req.params.id];
                var dirPath = utils.getDirPath(requestedEndpoint);
                var client = utils.getClient(config, requestedEndpoint);
                var filePath = dirPath + query.path;

                //adjust byteInterval to change how big the slice is, set to 1 megabyte
                var byteInterval = 1000000;

                client.getFileStatus(filePath, function(err, bytes) {
                    if (err) {
                        res.send(utils.processError(err));
                    }
                    else {
                        // range === undefined => no range headers, continue as normal
                        var range = utils.processHeaders(req, res, bytes);
                        //range === false => need to stop further processing
                        if (range === false) {
                            return;
                        }

                        var reqOptions = range ? {offset: range.start, length: range.end - range.start} : {};
                        var statusCode = range ? range.statusCode : 200;
                        var startByte = range ? range.start : 0;
                        var reqOptions = {
                            'Content-Type': 'application/octet-stream',
                            'Accept-Encoding': 'gzip',
                            'encoding': null
                        };

                        //if less then byteInterval just send file
                        if (bytes.length < byteInterval) {

                            utils.getData(client, filePath, reqOptions, reqOptions)
                                .then(function(data) {
                                    res.status(statusCode).send(data);
                                })
                                .catch(function(e){
                                    if (e.errno === 'ECONNRESET') {
                                        logger.error("teraserver-hdfs: HDFS is currently down", e)
                                    }
                                    else {
                                        logger.error("teraserver-hdfs:",e)
                                    }

                                    res.status(503).end()
                                });
                        }
                        else {
                            var getChunks = utils.getChunks;
                            getChunks(client, filePath, res, startByte, byteInterval, bytes.length, statusCode, reqOptions, logger);

                        }
                    }

                });
            }
        }
    }
};