# teraserver-hdfs
Teraserver plugin to allow downloading of files from HDFS

### To use
```
node service.js -c /Path/to/config
```

API Endpoint
=============
## */api/v1/hdfs* ##
URLs will follow this structure /api/v1/hdfs/endpoint/path/to/file.txt?token=TOKEN&ticket=DOWNLOAD_TICKET

This breaks down into several components.

* endpoint - this is used to lookup the HDFS configuration for retrieving files. This is set in config.
* path - This is the path in HDFS relative to the directory in HDFS defined in the configuration.
* filename - The name of the file being retrieved
* token - Is a standard TeraServer API token.
* ticket - Is a shared secret between the endpoint and the user of the API. It is set in configuration.

By defualt this will download the file whole file if it is less then the byteInterval which is located
in server/api/hdjs.js. If the file size is greater, then it will repeatedly send chunks specified by byteInterval until
it is fully downloaded. Its value is curently set to 1 megabyte but you are free to change it based on
your networks capacity and latency. This plugin also supports parital downloads, just follow the http spec concerning
Range in your header.

### Example to download first megabyte of file and save it as bigfile.log in current directory
```
curl -r 0-1000000 'localhost:8000/api/v1/hdfs/ENDPOINT/FILE/?token=TOKEN&ticket=TICKET' -o bigFile.log
```


### Example config of hdfs plugin for teraserver
```

 "terafoundation": {
    "environment": "development",
    "log_path": "log/path",
    "connectors": {
      "hdfs": {
        "default": {
          "user": "User",
          "namenode_port": 50070,
          "namenode_host": "localhost",
          "path_prefix": "/webhdfs/v1"      // this is standard http api for hadoop hdfs
        },
        "second_connection": {
          "user": "User",
          "namenode_port": 50070,
          "namenode_host": "someOtherHost",
          "path_prefix": "/webhdfs/v1"      // this is standard http api for hadoop hdfs
        }
      }
    }
  }
"teraserver-hdfs": {
    "endpoint": {
      "connection": "default_connection",
      "directory": "/some/dir",        // set path relative to root
      "ticket": "secretPassword1"    //set whatever password you prefer, it must pass a === check
    },
    "other_endpoint": {
      "connection": "second_connection",
      "directory": "/another/dir",              // set path relative to root
      "ticket": "secretPassword2"   //set whatever password you prefer, it must pass a === check
    }
  }
};

```
In teraserver-hdfs, you specify the endpoints that are available. Each endpoint must specify a ticket, which is
essentially any password you would like to set, it must be able to pass a === check. Users must provide this ticket on
 each request to access the api. Setting a path will restrict users to that directory and any subdirectory it contains.
 A request by the user with ../ in the file path will be rejected. the connection key must match one of the namespaces
 set in terafoundation.connectors.hdfs as shown above. If not set it will use the default connection.


### Example of file upload

```
curl -XPOST -H 'Content-type: application/octet-stream' --data-binary @/path/to/file 'localhost:8000/api/v1/hdfs/ENDPOINT/FILENAME?token=TOKEN&ticket=TICKET'

Response: 'Upload Complete'
```
It is important to set the content-type to application/octect-stream and to use the --data-binary flag
If not then curl could parse the file itself and will corrupt any binary data and even change the formating of regular
text files.

### Example of file deletion

```
$  curl -XDELETE 'localhost:8000/api/v1/hdfs/ENDPOINT/FILE?token=TOKEN&ticket=TICKET'

Response: 'Deletion successful'
```
