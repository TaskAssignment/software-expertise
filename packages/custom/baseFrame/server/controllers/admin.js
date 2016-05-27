'use strict';

// Database connections
var mongoose = require('mongoose');


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
            var Tag = mongoose.model('Tag');

            var readFileCallback = function (line){
                var model = {};
                model._id = line[1];
                model.soTotalCount = line[2];

                Tag.create(model, errorCallback);
            }
            res.sendStatus(200);

            readFile('files/tags.csv', readFileCallback);
        },

        /** Populates general StackOverflow coOccurrences from saved file.
        *
        * @param req - Express request.
        * @param res - Express respnse.
        **/
        populateCoOccurrences: function (req, res){
            var CoOccurrence = mongoose.model('CoOccurrence');

            var readFileCallback = function (line){
                var model = {};
                model.source = line[0];
                model.target = line[1];
                model.occurrences = line[2];

                CoOccurrence.create(model, errorCallback);
            }
            res.sendStatus(200);

            readFile('files/coOccurrences.csv', readFileCallback);
        },

        /** Populates StackOverflow users that have github accounts from saved file.
        *
        * @param req - Express request.
        * @param res - Express respnse.
        **/
        populateSoProfiles: function (req, res){
            var Developer = mongoose.model('Developer');
            var SoProfile = mongoose.model('SoProfile');
            var GitHubProfile = mongoose.model('GitHubProfile');

            var readFileCallback = function (line){
                var dev = new Developer({name: line[1]});
                dev.save(function(err, dev){
                    var soProfile = new SoProfile({_id: line[0], developer: dev._id});
                    var ghProfile = new GitHubProfile({_id: line[1], email: line[2], developer: dev._id});

                    soProfile.save(errorCallback);
                    ghProfile.save(errorCallback);
                });
            }
            res.sendStatus(200);

            readFile('files/commonUsers.csv', readFileCallback);
        },

        /** Read file and populate StopWords.
        *
        * @param req - Express request.
        * @param res - Express response.
        **/
        populateStopWords: function(req, res){

            var readFileCallback = function (words){
                var StopWord = mongoose.model('StopWord');
                var stopwords = [];

                for(var j in words){
                    var stopword = {}
                    stopword._id = words[j];

                    stopwords.push(stopword);
                }

                StopWord.create(stopwords, function(err){
                    if(err){
                        console.log(err.message);
                    }else{
                        console.log('Stop Words saved successfully!');
                    }
                });
            }

            res.sendStatus(200);

            readFile('files/stopWords.csv', readFileCallback);
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
* @param path - The file address/name. The path given should be from the root
  folder instead of from the baseFrame package!
* @param callback - The callback to handle the read data.
**/

function readFile(path, callback){
    //Using readStream to avoid memory explosion
    var readable = fs.createReadStream(path, {encoding: 'utf8'});

    csv.fromStream(readable, {ignoreEmpty: true})
    .on("data", function(data){
        callback(data);
    })
    .on("end", function(){
        console.log("******************* DONE *******************");
    });
}

/** This prints the error, if it exists
**/
var errorCallback = function (err){
    if(err){
        console.log(err);
    }
}
