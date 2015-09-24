'use strict';

var schema = {

    doc: 'What should be returned is an object with keys set to the specific endpoint ' +
    '(ie /api/v1/hdfs/google or /api/v1/hdfs/yahoo) user refers to the hdfs user profile, and should only change' +
    'based off of security rules set on the remote hdfs server.  The directory setting is the path which exists' +
    'inside the hdfs file system from which they are able to access any file or directory at that level or lower.' +
    'path_prefix should universally be set to /webhdfs/v1 as that is the native web api for hdfs. It can be' +
    'set to something else but it would require config changes to hdfs system itself. As this was intended for ' +
    'client use, ticket is just a passphrase intended to only allow access to those that have it' +
    'the ticket must be a string and be able to pass a === check. The user must include the ticket as a parameter' +
    'in their query',

    default: {
        google: {
            user: 'User',
            namenode_port: 50070,
            namenode_host: 'localhost',
            directory: 'user/google',
            path_prefix: '/webhdfs/v1',
            ticket: 'secretPassword1'
        },
        yahoo: {
            user: 'webuser',
            namenode_port: 50070,
            namenode_host: 'localhost',
            directory: 'user/yahoo',
            path_prefix: '/webhdfs/v1',
            ticket: 'secretPassword2'
        }
    }

};


function config_schema(config) {
    var config = config;

    return schema;
}

module.exports = {
    config_schema: config_schema,
    schema: schema
};