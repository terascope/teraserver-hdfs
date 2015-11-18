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
config.teraserver_hdfs = {};
config.teraserver_hdfs.myFiles = {
    user: 'User',           //configure to specify hadoop user
    namenode_port: 50070,
    namenode_host: 'localhost',
    path_prefix: '/webhdfs/v1',  // this is standard http api for hadoop hdfs (optional)
    directory:'some/path/relative/to/root',    // set path relative to root
    ticket: 'secretPassword'        //set whatever password you prefer, it must pass a === check
};

```
The path_prefix is listed as optional because it will be automatically added to your query by default unless you
specify another. myFiles is the endpoint listed in the curl command. It will then read the configuration to verify
if the ticket given is correct. If so, then the user is allowed to retrieve files or access directories that are
available by the directory listed in the config. A request by the user with ../ in the file path will be rejected.

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
