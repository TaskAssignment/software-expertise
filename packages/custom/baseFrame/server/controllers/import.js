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
var PythonShell = require('python-shell');
var extractorRoute = 'packages/custom/baseFrame/server/bugzilla-python/generalextractor.py'


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
                    populate(params.option);
                    break;
                case 'bz':
                    integratePython(query, res);
                    break;
            }

            res.sendStatus(NOT_READY);
        },

        bugzillaServices: function (req, res) {
            integratePython(req.params, res);
        },

        bugzillaProjects: function (req, res) {
            integratePython(req.params, res);
        },

        check: function (req, res) {
            console.log(req.params, res.query);
            res.sendStatus(200);
        }
    }
}

/** Run a python code to import Bugzilla data.
*
* @param {Object} args - The arguments to be passed to the python interpreter
* @param {res} res - The express response to send the results
**/
function integratePython(args, res) {
    var pyArgs = [];

    if(process.env.NODE_ENV === 'production'){
        pyArgs.push('mean-prod');
    } else {
        pyArgs.push('mean-dev');
    }
    //Just to make sure this is executed in this order
    for (var key of ['command', 'service', 'project']) {
        if (args.hasOwnProperty(key)) {
            pyArgs.push(args[key]);
        }
    }

    var options = {
        args: pyArgs,
        pythonPath: '/usr/bin/python3',
    }

    PythonShell.run(extractorRoute, options, function (err, results) {
        if(err){
            console.log(err);
            if(!res.headersSent) res.sendStatus(500);
        } else {
            if(!res.headersSent) res.send(results);
        }
    });

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
        populator.GitHub(option, project);
        if(option === 'Developer'){
            populator.StackOverflow(option, project);
        }
    } else {
        // changeStatus(option, READY, 'populated');
        populator.StackOverflow(option);
    }
}
