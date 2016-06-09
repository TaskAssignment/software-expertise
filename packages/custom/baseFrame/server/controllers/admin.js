'use strict';

// Database connections
var mongoose = require('mongoose');

var fs = require('fs');
var csv = require('fast-csv');

var fileReady = {
    Tag: false,
    CoOccurrence: false,
    Developer: false,
    Project: false
}

module.exports = function (BaseFrame){
    return {
        populate: function (req, res) {
            var option = req.query.resources;
            switch (option) {
                case 'tags':
                    populateTags();
                    break;
                case 'coOccurrences':
                    populateCoOccurrences();
                    break;
                case 'developers':
                    populateDevelopers();
                    break;
                case 'stopWords':
                    populateStopWords();
                    break;
            }
            res.sendStatus(202);
        },

        generate: function (req, res) {
            var option = req.query.resource;
            switch (option) {
                case 'Tag':
                case 'CoOccurrence':
                    writeFile(option);
                    break;
                case 'Developer':
                    writeDevs();
                    break;
            }
            res.sendStatus(202);
        },

        download: function (req, res) {
            var option = req.query.resource;
            res.download('files/' + option + 's.tsv');
        },

        check: function (req, res) {
            var option = req.query.resource;
            if(fileReady[option]){
                res.sendStatus(200);
            } else {
                res.sendStatus(202);
            }
        }
    }
}

/** Populates general StackOverflow tags from saved file.
**/
function populateTags() {
    var Tag = mongoose.model('Tag');

    var readFileCallback = function (line){
        var model = {};
        model._id = line[1];
        model.soTotalCount = line[2];

        Tag.create(model, errorCallback);
    }

    readFile('files/tags.csv', readFileCallback);
}

/** Populates general StackOverflow coOccurrences from saved file.
**/
function populateCoOccurrences (){
    var CoOccurrence = mongoose.model('CoOccurrence');

    var readFileCallback = function (line){
        var model = {};
        model.source = line[0];
        model.target = line[1];
        model.occurrences = line[2];

        CoOccurrence.create(model, errorCallback);
    }

    readFile('files/coOccurrences.csv', readFileCallback);
}

/** Populates StackOverflow users that have github accounts from saved file.
**/
function populateDevelopers(req, res) {
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
    readFile('files/commonUsers.csv', readFileCallback);
}

/** Read file and populate StopWords.
**/
function populateStopWords() {
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

    readFile('files/stopWords.csv', readFileCallback);
}



/** This is responsible for writing the file with the StackOverflow data.
*
* @param option - The Model that will be exported. The file will be the name of this model pluralized.
**/
function writeFile(option){
    var MongooseModel = mongoose.model(option);
    var stream = fs.createWriteStream('files/' + option + 's.tsv');
    MongooseModel.findAndStreamCsv()
    .pipe(stream)
    .on('error', function(error){
        console.log(error);
    })
    .on('finish', function (){
        console.log("Success!");
        fileReady[option] = true;
    });
}

function writeDevs(){
    console.log("** Generating developers file **");
    var Developer = mongoose.model('Developer');
    var dbStream = Developer.find().lean().stream();

    var devStream = fs.createWriteStream("files/Developers.tsv");
    var questionStream = fs.createWriteStream("files/Questions.tsv");
    var answerStream = fs.createWriteStream("files/Answers.tsv");

    var options = {
        delimiter: '\t',
        headers: true
    }
    var answerCsvStream = csv.createWriteStream(options);
    answerCsvStream.pipe(answerStream);

    var questionCsvStream = csv.createWriteStream(options);
    questionCsvStream.pipe(questionStream);

    var devCsvStream = csv.createWriteStream(options);
    devCsvStream.pipe(devStream);

    dbStream.on('data', function (dev) {
        if(dev.soProfile){
            for(var question of dev.soProfile.questions){
                question.askerId = dev._id;
                question.askerSoId = dev.soProfile._id;
                questionCsvStream.write(question);
            }

            for(var answer of dev.soProfile.answers){
                answer.answererId = dev._id;
                answer.answererSoId = dev.soProfile._id;
                answerCsvStream.write(answer);
            }

            dev.tags = dev.soProfile.tags.map(function (tag) {
                return tag._id;
            });
            dev.soId = dev.soProfile._id;
        }

        dev.email = dev.ghProfile.email;

        delete dev.ghProfile;
        delete dev.soProfile;
        delete dev.__v;

        devCsvStream.write(dev);
    }).on('error', function (err) {
        console.log("========== AAAAHHHHHH")
        console.log(err);
    }).on('close', function (){
        console.log("* Finished Developers! *");
        devStream.end();
        questionStream.end();
        answerStream.end();
        fileReady.Developer = true;
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
