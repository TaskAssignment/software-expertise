'use strict';

// Database connections
var mongoose = require('mongoose');

var fs = require('fs');
var csv = require('fast-csv');

var fileReady = {
    Tag: true,
    CoOccurrence: true,
    StopWord: true,
    Developer: false,
    Project: false
}

module.exports = function (BaseFrame){
    return {
        populate: function (req, res) {
            var option = req.query.resources;

            if(option == 'Developer'){
                //I'll write the populate users again
            } else {
                readFile(option);
            }

            res.sendStatus(202);
        },

        generate: function (req, res) {
            var option = req.query.resource;

            switch (option) {
                case 'Developer':
                    writeDevs();
                    break;
                case 'Project':
                    writeFile(option, 'languages._id');
                    break;
                default:
                    //I'm using the existing files, instead of checking the db, because this won't change for now!!

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

/** This is responsible for writing the file with the StackOverflow data.
*
* @param option - The Model that will be exported. The file will be the name of this model pluralized.
**/
function writeFile(option, items){
    var MongooseModel = mongoose.model(option);
    var stream = fs.createWriteStream('files/' + option + 's.tsv');

    var dbStream = MongooseModel.find().select().lean().stream();

    var options = {
        delimiter: '\t',
        headers: true
    }

    var csvStream = csv.createWriteStream(options);
    csvStream.pipe(stream);

    dbStream.on('data', function (model) {
        if(option == 'CoOccurrence'){
            delete model._id;
        } else if (option == 'Project'){
            model.languages = model.languages.map(function (lang) {
                return lang._id;
            });
        }

        delete model.createdAt;
        delete model.updatedAt;
        delete model.__v;

        csvStream.write(model);
    }).on('error', function (err) {
        console.log("========== AAAAHHHHHH")
        console.log(err);
    }).on('close', function (){
        console.log("* Finished! *");
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
        delete dev.createdAt;
        delete dev.updatedAt;
        delete dev.__v;

        devCsvStream.write(dev);
    }).on('error', function (err) {
        console.log("========== AAAAHHHHHH")
        console.log(err);
    }).on('close', function (){
        console.log("* Finished Developers! *");
        devCsvStream.end();
        answerCsvStream.end();
        questionCsvStream.end();
        fileReady.Developer = true;
    });
}

/** Helper function to read the files
*
*  @param option - The Model that will be exported. The file will be the name of this model pluralized.
**/

function readFile(option){
    var MongooseModel = mongoose.model(option);

    var countCallback = function (err, count) {
        if(count == 0) {
            var path = 'files/' + option + 's.tsv';
            var options = {
                delimiter: '\t',
                headers: true,
                ignoreEmpty: true
            }
            var readable = fs.createReadStream(path, {encoding: 'utf8'});

            console.log("** Reading file! **");
            var models = []
            csv.fromStream(readable, options)
            .on("data", function(model){
                models.push(model)
            }).on("end", function(){
                MongooseModel.collection.insert(models, function (err) {
                    if(err){
                        console.log(err);
                    } else {
                        console.log(option + 's populated');
                        console.log("***** DONE *****");
                    }
                })
            });
        }
    }

    MongooseModel.count().exec(countCallback);
}
