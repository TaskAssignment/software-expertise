'use strict';

// Database connections
var mongoose = require('mongoose');
var Tag = mongoose.model('Tag');
var SoProfile = mongoose.model('SoProfile');
var CoOccurrence = mongoose.model('CoOccurrence');

var fs = require('fs');
var csv = require('fast-csv');

module.exports = function (BaseFrame){
    return {
        /** Populates general StackOverflow tags from saved file.
        *
        * @param req - Express request.
        * @param res - Express respnse.
        **/
        populateSoTags: function (req, res){
            readFile('files/tags.csv', res, Tag);
        },

        /** Populates general StackOverflow coOccurrences from saved file.
        *
        * @param req - Express request.
        * @param res - Express respnse.
        **/
        populateCoOccurrences: function (req, res){
            readFile('files/coOccurrences.csv', res, CoOccurrence);
        },

        /** Populates StackOverflow users that have github accounts from saved file.
        *
        * @param req - Express request.
        * @param res - Express respnse.
        **/
        populateSoProfiles: function (req, res){
            readFile('files/commonUsers.csv', res, SoProfile);
        },

        /** Exports the SO Tags to a file.
        *
        * @param req - Express request.
        * @param res - Express respnse.
        **/
        exportSoTags: function (req, res){
            writeFile('files/tags2.tsv', '_id soTotalCount',res, Tag);
        },

        /** Exports the coOccurrences to a file.
        *
        * @param req - Express request.
        * @param res - Express respnse.
        **/
        exportCoOccurrences: function (req, res){
            writeFile('files/CoOccurrences.tsv', '-_id source target occurrences', res, CoOccurrence);
        },

        /** Exports all users to a file.
        *
        * @param req - Express request.
        * @param res - Express respnse.
        **/
        exportSoProfiles: function (req, res){
            writeFile('files/SoProfiles.tsv', '_id gitHubId email', res, SoProfile);
        },
    }
}

/** This is responsible for writing the file with the StackOverflow data. My
* idea was to send the file via response, but it just worked for tags (the
* other are too big to load and the request times out).
*
* @param file - The file address/name. The path given should be from the root
  folder instead of from the baseFrame package!
* @param items - The items that will be selected from the Schema.
* @param res - Express response.
* @param MongooseModel - The Model that represents a Schema.
**/
function writeFile(file, items,  res, MongooseModel){
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

    //This is to avoid timeout.
    res.sendStatus(200);
}

/** Helper function to read the files
*
* @param file - The file address/name. The path given should be from the root
  folder instead of from the baseFrame package!
* @param res - The response to be sent.
* @param MongooseModel - The MongooseModel to be used to save to the database.
**/

function readFile(file, res, MongooseModel){
    //Using readStream to avoid memory explosion
    var readable = fs.createReadStream(file, {encoding: 'utf8'});

    csv.fromStream(readable, {ignoreEmpty: true})
    .on("data", function(data){
        var model = createModel(data, MongooseModel.modelName);
        //This is waaay to slow. I have to find a solution for it
        MongooseModel.create(model, function(err){
            if(err){
                console.log(err.message);
            }else{
                console.log(MongooseModel.modelName + ' saved successfully!');
            }
        });
    })
    .on("end", function(){
        console.log("******************* DONE *******************");
    });
    res.sendStatus(200);
}

/** This receives a line of a file and returns the equivalent model for it.
*
* @param line - Array with the words in that line
* @param modelName - The name of model that will be created.
* @return model to be saved in the database.
**/
function createModel(line, modelName){
    var model = {};

    switch (modelName) {
        case 'Tag':
            //line[0] is an id that is not being used
            model['_id'] = line[1];
            model['soTotalCount'] = line[2];
            break;
        case 'SoProfile':
            model['soId'] = line[0];
            model['_id'] = line[1];
            model['email'] = line[2];
            break;
        case 'CoOccurrence':
            model['source'] = line[0];
            model['target'] = line[1];
            model['occurrences'] = line[2];
            break;
    }

    return model;
}
