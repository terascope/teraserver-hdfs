'use strict';

var logger, config, app;
var hdfs_schema = require('./system_schema');

var api = {
    _config: undefined,

    schema: function(){
        return hdfs_schema.config_schema();
    },

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
        var hdfsDownload = require('./server/api/hdfs_download')(config);
        var hdfsUpload = require('./server/api/hdfs_upload')(config);

        function hdfs(req, res){
            var routes = {GET: hdfsDownload, POST: hdfsUpload, PUT: hdfsUpload};
            routes[req.method](req, res);
        }

        app.use('/api/v1/hdfs/:id/', hdfs);

    },

    post: function() {

    }
};

module.exports = api;

