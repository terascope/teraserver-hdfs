'use strict';

var logger, config, app;

var api = {
    _config: undefined,

    config: function(pluginConfig) {
        this._config = pluginConfig;
        logger = pluginConfig.logger;
        app = pluginConfig.app;
        config = pluginConfig.server_config;
    },

    static: function() {
        return __dirname + '/static';
    },

    init: function() {

    },

    pre: function() {

    },

    routes: function() {
        var config = this._config;
        var hdfs = require('./server/api/hdfs')(config);

        app.use('/api/v1/hdfs/:id', hdfs);
    },

    post: function() {

    }
};

module.exports = api;

