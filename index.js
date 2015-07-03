'use strict';
var fs = require('fs');

var logger, models, baucis, config, passport, app;

var api = {
    _config: undefined,

    config: function(pluginConfig) {
        this._config = pluginConfig;
        logger = pluginConfig.logger;
        baucis = pluginConfig.baucis;
        passport = pluginConfig.passport;
        app = pluginConfig.app;
        config = pluginConfig.server_config;
    },

    static: function() {
        return __dirname + '/static';
    },

    init: function() {

        // Configure Baucis to know about the application models
       // require('./server/api/baucis')(this._config);
       // console.log('this is user',models);
      /*  var user = models.Account;
        console.log('this is user',user);
        passport.use(user.createStrategy());
        passport.serializeUser(user.serializeUser());
        passport.deserializeUser(user.deserializeUser());*/
    },

    pre: function() {

    },

    routes: function(deferred) {
        // THIS needs to be deferred until after all plugins have had a chance to load

        var config = this._config;
        var hdfs = require('./server/api/hdfs')(config);

        deferred.push(function() {
           // config.app.use('/api/v1', baucis());
        });

        // TODO: this is cramming this into global namespace, not a good idea.
        app.get('/api/v1/hdfs', hdfs);
    },

    post: function() {

    }
};

module.exports = api;





