'use strict';

/** Checks the source and the type of import and handles according to that.
*
* @module import
* @requires mongoose
* @requires fs
* @requires fast-csv
**/
var mongoose = require('mongoose');

var fs = require('fs');
var csv = require('fast-csv');

var READY = 200; //Status code to be sent when ready.
var NOT_READY = 202; //Send accepted status code

var errorCallback = function (err, results) {
    if(err){
        console.log(err.message);
    }
}

module.exports = function (BaseFrame){
    return {
        populate: function (req, res) {
            var params = req.params;
            var query = req.query;
            switch (params.source) {
                case 'file':
                    if(params.option === 'CommonUser') {
                        readDevs()
                    } else {
                        readFile(params.option);
                    }
                    break;
                case 'gh':
                    populate(params.option, query.project);
                    break;
                case 'so':
                    break;
                case 'bz':
                    break;
            }

            res.sendStatus(NOT_READY);
        },
    }
}

/** Basic flow to read files. It's assumed that, whatever the file name, it's
* located on 'files/' (from the root of the project).
*
* @param {string} modelName - The Model name that will be import.
* @param {function} transformCallback - The function that will transform the data before
    writing it to the database.
* @param {boolean|array} headers - If true, it will consider the first line
    of the file as headers. If an array is given, each entry will be a header.
* @param {String} fileName - The name of file to be read. This should be a .tsv.
    Default is modelName pluralized. E.g: modelName = Issue, fileName = Issues.tsv
**/
function readFile(modelName,
            transformCallback = undefined,
            savingOnTransform = false,
            headers = true,
            fileName = modelName + 's.tsv'){

    var MongooseModel = mongoose.model(modelName);

    var path = 'files/' + fileName;
    var options = {
        delimiter: '\t',
        headers: headers,
        ignoreEmpty: true,
    }
    console.log('** Reading file! **');

    var readable = fs.createReadStream(path, {encoding: 'utf8'});
    var readStream = csv.fromStream(readable, options);

    if(transformCallback){
        readStream.on('data', function(data){
            transformCallback(data)
        });
    }

    if(!savingOnTransform){
        var models = [];
        readStream.on('data', function(model){
            models.push(model);
        }).on('end', function () {
            MongooseModel.collection.insert(models, function (err) {
                if(err){
                    console.log(err.message);
                } else {
                    console.log(modelName + 's populated');
                    console.log('***** DONE *****');
                }
            });
            // changeStatus(modelName, READY, 'populated');
        });
    } else {
        // readStream.on('end', function(){
        //     changeStatus(modelName, READY, 'populated');
        // });
    }

}

/** Generates the callback to populate the common users.
**/
function readDevs(){
    var GitHubProfile = mongoose.model('GitHubProfile');
    var StackOverflowProfile = mongoose.model('StackOverflowProfile');
    var Developer = mongoose.model('Developer');

    var transform = function (data) {
        StackOverflowProfile.create({_id: data.soId, email: data.email}, errorCallback);
        GitHubProfile.create(data, errorCallback);

        var dev = {
            email: data.email,
        }

        var updateFields = {
            $addToSet: {
                'profiles.gh': data._id,
                'profiles.so': data.soId,
            },
        }

        var options = {
            upsert: true,
        }

        Developer.update(dev, updateFields, options, errorCallback);
    }

    var savingOnTransform = true;
    readFile('Developer', transform, savingOnTransform);
}

function populate(option, project = undefined){
    var populator = require('../controllers/populator')();
    if(project){
        if(option === 'Contributor'){
            populator.GitHub('Developer', project);
            populator.StackOverflow('Developer', project);
        } else {
            populator.GitHub(option, project);
        }
    } else {
        // changeStatus(option, READY, 'populated');
        populator.StackOverflow(option);
    }
}