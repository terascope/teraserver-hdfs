'use strict';

var hdfsClient = require('node-webhdfs').WebHDFSClient;
var utils = require('./hdfs-utils');

module.exports = function(config) {
    var endpoint = config.server_config['teraserver-hdfs'];

    return function(req, res) {
        var ticket = utils.checkTicket(req, endpoint);

        if (!ticket.isValid) {
            res.status(401).json(ticket.error)
        }
        else {
            var query = utils.validateQuery(req, endpoint);

            if (!query.isValid) {
                res.status(400).json(query.error)
            }
            else {
                var endpointConfig = utils.formatConfig(endpoint[req.params.id]);
                var client = new hdfsClient(endpointConfig);

                client.del(query.path, function(err, bool) {
                    if (err) {
                        res.send({error: err});
                    }
                    else {
                        res.status(200).send('Deletion successful')
                    }

                });

            }
        }
    }
};