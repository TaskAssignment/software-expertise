'use strict';

// Database connections
var mongoose = require('mongoose');
var Tag = mongoose.model('Tag');
var SoUser = mongoose.model('SoUser');
var CommonOccurrence = mongoose.model('CommonOccurrence');

var fs = require('fs');
var csv = require('fast-csv');

module.exports = function (BaseFrame){
    return {
        populateSoTags: function (req, res){
            readFile('files/tags.csv', res, Tag);
        },

        populateCommonOccurrences: function (req, res){
            readFile('files/coOccurrences.csv', res, CommonOccurrence);
        },

        populateSoUsers: function (req, res){
            readFile('files/commonUsers.csv', res, SoUser);
        },

        exportSoTags: function (req, res){
            writeFile('files/tags2.tsv', '_id soTotalCount',res, Tag);
        },

        exportCommonOccurrences: function (req, res){
            writeFile('files/CommonOccurrences.tsv', '-_id source target occurrences', res, CommonOccurrence);
            res.sendStatus(200);
        },

        exportSoUsers: function (req, res){
            writeFile('files/SoUsers.tsv', '_id gitHubId email', res, SoUser);
        },
    }
}

function writeFile(file, items,  res, MongooseModel){
    //TODO: Add transform model!!
    console.log("Writing File!");
    var stream = fs.createWriteStream(file);
    MongooseModel.findAndStreamCsv({}, items, {lean: true})
    .pipe(stream)
    .on('error', function(error){
        if(!res.headersSent){
            res.sendStatus(500);
        }
        console.log(error);
    })
    .on('finish', function (){
        console.log("Success!");
        if(!res.headersSent){
            res.download(file);
        }
    });
    res.sendStatus(200);
}

/** Helper function to read the files
*
* @param file - The file address/name. The path given should be from the root
  folder instead of from the baseFrame package!
* @param res - The response to be sent.
* @param MongooseModel - The MongooseModel to be used to save to the database.
*/

function readFile(file, res, MongooseModel){
    //Using readStream to avoid memory explosion
    var readable = fs.createReadStream(file, {encoding: 'utf8'});

    csv.fromStream(readable, {ignoreEmpty: true})
    .on("data", function(data){
        // readable.pause();
        var model = createModel(data, MongooseModel.modelName);
        MongooseModel.create(model, function(err){
            if(err){
                console.log(err.message);
            }else{
                console.log(MongooseModel.modelName + ' saved successfully!');
            }
        });
    })
    .on("end", function(){
        console.log("done");
    });
    res.sendStatus(200);
}

/** This receives the converted results from reading a file
* and returns an array with models based on these results.
*
* @param convertResults - an array of dicts with the first row as keys
* @param modelName - The name of model that will be created.
* @return array of models to be saved on the database.
*/
function createModel(line, modelName){
    var model = {};

    switch (modelName) {
        case 'Tag':
            //line[0] is an id that is not being used
            model['_id'] = line[1];
            model['soTotalCount'] = line[2];
            break;
        case 'SoUser':
            model['soId'] = line[0];
            model['_id'] = line[1];
            model['email'] = line[2];
            break;
        case 'CommonOccurrence':
            model['source'] = line[0];
            model['target'] = line[1];
            model['occurrences'] = line[2];
            break;
    }

    return model;
}
