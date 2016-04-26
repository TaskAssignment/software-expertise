'use strict';

var fs = require('fs'),
config = require('meanio').loadConfig(),
mkdirOrig = fs.mkdir,
directory = config.root + '/',
osSep = '/';

/**
 * Changes the name of an existing file
 *
 * @param file - the file to be renamed
 * @param dest - where the file is located
 * @param user - the admin who created the file 
 * @param callback - the path to callback the file
 */

function rename(file, dest, user, callback) {
    fs.rename(file.path, directory + file.name, function(err) {
        if (err) throw err;
        else
            callback({
                success: true,
                file: {
                    src: '/'+file.name,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    created: Date.now(),
                    createor: (user) ? {
                        id: user.id,
                        name: user.name
                    } : {}
                }
            });
    });
}

/**
 * Make a new directory
 *
 * @param path- the path where the folder will be created
 * @param position - the location of folder
 * @param callback - the path to callback 
 */

function mkdir_p(path, callback, position) {
    var parts = require('path').normalize(path).split(osSep);

    position = position || 0;

    if (position >= parts.length) {
        return callback();
    }

    var directory = parts.slice(0, position + 1).join(osSep) || osSep;
    fs.stat(directory, function(err) {
        if (err === null) {
            mkdir_p(path, callback, position + 1);
        } else {
            mkdirOrig(directory, function(err) {
                if (err && err.code !== 'EEXIST') {
                    return callback(err);
                } else {
                    mkdir_p(path, callback, position + 1);
                }
            });
        }
    });
}

/**
 * Publish a new file event to the project's display
 *
 * @param MeanUpload - the service used to publish a file through mean
 * @param user - the admin who created the file 
 * @param data - the actual dataz of the file
 */

function publishEvent(MeanUpload, user, data) {
    if (config.hostname && data.success)
       MeanUpload.events.publish({
        action: 'uploaded',
        user: {
            name: user
        },
        name: data.file.name,
        url: config.hostname + data.file.src,
        data: {
         size: data.file.size,
         type: data.file.type,
         url: config.hostname + data.file.src,
         file_name: data.file.name
     }
 });
}

module.exports = function(MeanUpload) {
    return  {
        upload: function(req, res) {
            var path = directory + req.body.dest;
            if (!fs.existsSync(path)) {
                mkdir_p(path, function(err) {
                    rename(req.files.file, req.body.dest, req.user, function(data) {
                        publishEvent(MeanUpload, req.user.name, data);
                        res.jsonp(data);
                    });
                });
            } else {
                rename(req.files.file, req.body.dest, req.user, function(data) {
                    publishEvent(MeanUpload, req.user.name, data);
                    res.jsonp(data);
                });
            }
        }
    }
};