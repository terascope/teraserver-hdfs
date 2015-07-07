//'use strict';
var hdfsClient = require('node-webhdfs').WebHDFSClient;
var utils = require('./hdfs-utils');


module.exports = function (config) {
    var endpoint = config.server_config.teraserver_hdfs;

    return function (req, res) {
        var ticketIsValid = utils.checkTicket(req, endpoint);
        var reqOptions = {};
        var startByte = 0;
        var statusCode = 200;
        var isRange = false;

        if (req.headers.range) {
            startByte = req.headers.range;
            statusCode = 206;
            reqOptions.offset = req.headers.range;
            isRange = true;
        }

        if (!ticketIsValid) {
            res.status(401).json({error: 'invalid ticket for endpoint'})
        }
        else {
            var query = utils.validateQuery(req, endpoint);

            if (!query.isValid) {
                res.status(400).json(query.error)
            }
            else {
                var endpointConfig = utils.formatConfig(endpoint[req.params.id]);
                var client = new hdfsClient(endpointConfig);
                //adjust byteInterval to change how big the slice is, set to 50 megabytes
                var byteInterval = 50000000; //5,2,2.5

                client.getFileStatus(query.path, function (err, bytes) {
                    if (err) {
                        res.send(utils.processError(err));
                    }  //if less then 50 megabytes just send file
                    if (bytes.length < byteInterval) {

                        utils.getData(client, query.path, reqOptions)
                            .then(function (data) {
                                res.status(statusCode).send(data);
                            });
                    }
                    else {
                        var getChunks = utils.getChunks;

                        getChunks(client, query, res, startByte, byteInterval, bytes.length, statusCode);

                    }

                });

            }
        }
    }
};