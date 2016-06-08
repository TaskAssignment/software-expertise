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

            var readFileCallback = function (line){

                var options = {
                    upsert: true,
                    setDefaultsOnInsert: true
                };

                var update = {
                    soProfile: {
                        _id: line[0]
                    },
                    ghProfile: {
                        _id: line[1],
                        email: line[2]
                    }
                };

                Developer.findByIdAndUpdate(line[1], update, options,
                    errorCallback);
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
            console.log(teste);

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
            var Tag = mongoose.model('Tag');
            writeFile('files/tags2.tsv', '_id soTotalCount',res, Tag);
        },

        /** Exports the coOccurrences to a file.
        *
        * @param req - Express request.
        * @param res - Express respnse.
        **/
        exportCoOccurrences: function (req, res){
            var CoOccurrence = mongoose.model('CoOccurrence');
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
    writeDevs();
    // console.log("Writing File!");
    // console.log(new Date());
    // var stream = fs.createWriteStream(file);
    // MongooseModel.findAndStreamCsv({}, items, {lean: true})
    // .pipe(stream)
    // .on('error', function(error){
    //     if(!res.headersSent){
    //         res.sendStatus(500);
    //     }
    //     console.log(error);
    // })
    // .on('finish', function (){
    //     console.log("Success!");
    //     console.log(new Date());
    //     if(!res.headersSent){
    //         res.download(file);
    //     }
    // });

    //This is to avoid timeout.
    res.sendStatus(202);
}

function writeDevs(){
    var Developer = mongoose.model('Developer');
    var dbStream = Developer.find({_id: 'rafaelfranca'}).lean().stream();
        // .populate('ghProfile.repositories', 'name').stream();

    // var devStream = fs.createWriteStream("files/devs.tsv");
    // var questionStream = fs.createWriteStream("files/questions.tsv");
    var answerStream = fs.createWriteStream("files/answers.tsv");

    var options = {
        delimiter: '\t',
        headers: true
    }
    var csvStream = csv.createWriteStream(options);
    // dbStream.pipe(csvStream);
    csvStream.pipe(answerStream);
    dbStream.on('data', function (data) {
        var questions = [];
        var answers = [];
        if(data.soProfile){
            for(var question of data.soProfile.questions){
                question.askerId = data._id;
                question.askerSoId = data.soProfile._id;
                delete question.tags; //TODO: CHANGE THIS!!!
                questions.push(question);
            }

            for(var answer of data.soProfile.answers){
                answer.answererId = data._id;
                answer.answererSoId = data.soProfile._id;
                delete answer.tags;
                console.log(answer);
                csvStream.write(answer);
                // answerStream.write(JSON.stringify(answer));
                answers.push(answer);
            }

        }
        var dev = {
            id: data._id,
            email: data.ghProfile.email,
            // tags: data.soProfile.tags,
            soId: data.soProfile._id
        }

        delete dev.questions;
        delete dev.answers;
        // dev.repositories = data.ghProfile.repositories.map(function (repo){
        //     return repo.name;
        // }).toString();



        // csv.write([dev], options).pipe(devStream);
        // answerStream.write(JSON.stringify(questions));
    }).on('error', function (err){
        console.log(err);
    }).on('close', function (){
        console.log("* Finished Developers! *");
        // devStream.end();
        // questionStream.end();
        answerStream.end();
        csvStream.end();
    });

    csvStream.on('data', function (data){
        // console.log("CSV DATA: ", data);
    }).on('data-invalid', function (dataInvalid){
        console.log("CSV DATA INVALID: ", dataInvalid);
    }).on('error', function (err){
        console.log("CSV ERROR: ", err);
    });

    answerStream.on('data', function (data){
        console.log("WRITABLE STREAM DATA: ", data);
    }).on("finish", function(){
        console.log(" * Done answers * ");
    });
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

    console.log("** Reading file! **")
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
