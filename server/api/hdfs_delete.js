'use strict';

var utils = require('./hdfs-utils');

module.exports = function(config) {
    var endpoint = config.server_config['teraserver-hdfs'];
    var client = config.context.foundation.getConnection({type: 'hdfs', cached: true}).client;

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
                var filePath = '/' + endpointConfig.directory + query.path;

                client.del(filePath, function(err, bool) {
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