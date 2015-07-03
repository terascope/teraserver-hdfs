'use strict';
var hdfsClient = require('node-webhdfs').WebHDFSClient;
var utils = require('./hdfs-utils');


module.exports = function (config) {
    var endpoint = config.server_config.hdfs;

    return function (req, res) {

        var query = utils.validateQuery(req, endpoint);

        if (!query.isValid) {
            res.status(400).json(query.error)
        }
        else {
            var endpointConfig = endpoint[req.params.id];
            var client = new hdfsClient(endpointConfig);

            client.open(query.path, function (err, data) {
                if (err) {
                    res.send(err);
                }
                res.send(data);
            });
        }
    }
};