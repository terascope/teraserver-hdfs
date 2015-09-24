'use strict';
var config_schema = require('./system_schema').config_schema;

var server = require('teraserver')({
    name: 'teraserver-hdfs',
    config_schema: config_schema
});
