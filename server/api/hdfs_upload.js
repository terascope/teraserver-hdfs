'use strict';

var utils = require('./hdfs-utils');
var request = require('request');
var _ = require('lodash');

module.exports = function(config) {
    var endpoint = config.server_config['teraserver-hdfs'];

    return function(req, res) {

        var ticketIsValid = utils.checkTicket(req, endpoint);

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

                var reqOptions = {
                    json: false,
                    'Content-Type': 'application/octet-stream',
                    'Accept-Encoding': 'gzip',
                    'encoding': null
                };

                var firstReqOptions = _.clone(reqOptions);
                firstReqOptions.followRedirect = false;
                firstReqOptions.qs = {op: 'create', 'user.name': endpointConfig.user, overwrite: true};
                firstReqOptions.uri = endpointConfig.uri + query.path;


                request.put(firstReqOptions, function(err, response, body) {
                    if (response.statusCode === 307) {
                        reqOptions.uri = response.headers.location;
                        req.pipe(request.put(reqOptions, function(err, response, body) {
                                if (response.statusCode == 201) {
                                    res.status(response.statusCode).send('Upload complete');
                                }
                                else {
                                    res.send({
                                        error: 'expected 201 created',
                                        response: response.statusCode,
                                        body: body
                                    });

                                }
                            }
                        ));
                    }
                    else {
                        res.send({error: 'expected 307 redirect', response: response.statusCode, body: body});
                    }
                });

            }
        };
    }
};