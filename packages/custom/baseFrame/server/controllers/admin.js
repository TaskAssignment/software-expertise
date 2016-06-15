'use strict';

// Database connections
var mongoose = require('mongoose');

var fs = require('fs');
var csv = require('fast-csv');

var READY = 200; //Status code to be sent when ready.
var NOT_READY = 202; //Send accepted status code

//TODO: Use a for loop here!!
var file = {
    Tag: {
        status: READY,
        linesRead: 0
    },
    CoOccurrence: {
        status: READY,
        linesRead: 0
    },
    StopWord: {
        status: READY,
        linesRead: 0
    },
    Developer: {
        status: NOT_READY,
        linesRead: 0
    },
    Project: {
        status: NOT_READY,
        linesRead: 0
    },
    Issue: {
        status: NOT_READY,
        linesRead: 0
    },
    Commit: {
        status: NOT_READY,
        linesRead: 0
    }
}

var populated = {
    Tag: {
        status: READY,
        linesRead: 0
    },
    CoOccurrence: {
        status: READY,
        linesRead: 0
    },
    StopWord: {
        status: READY,
        linesRead: 0
    },
    Developer: {
        status: NOT_READY,
        linesRead: 0
    },
    Project: {
        status: READY,
        linesRead: 0
    }
}

module.exports = function (BaseFrame){
    return {
        populate: function (req, res) {
            var query = req.query;
            switch (query.option) {
                case 'StopProject':
                case 'Developer':
                case 'CoOccurrence':
                    readFile(query.option);
                    break;
                case 'Project':
                    populate(query.option, query.project);
                    break;
                default:
                    populate(query.option);
            }

            res.status(NOT_READY).send(populated[query.option]);
        },

        generate: function (req, res) {
            var option = req.query.resource;

            switch (option) {
                case 'Developer':
                    file[option].status = NOT_READY;
                    writeDevs();
                    break;
                case 'StopWord':
                    file[option].status = READY;
                    writeFile(option);
                    break;
                case 'Issue':
                case 'Commit':
                    writeIssueOrCommit(option);
                default:
                    file[option].status = NOT_READY;
                    writeFile(option);
                    break;
            }
            res.status(NOT_READY).send(file[option]);
        },

        download: function (req, res) {
            var option = req.query.resource;
            res.download('files/' + option + 's.tsv');
        },

        check: function (req, res) {
            var option = req.query.resource;

            var populate = false;
            if(req.query.populate){
                populate = true;
            }

            if(!populate){
                res.status(file[option].status).send(file[option]);
            } else {
                res.status(populated[option].status).send(populated[option]);
            }
        }
    }
}

/** This is responsible for writing the file with the StackOverflow data.
*
* @param option - The Model that will be exported. The file will be the name of this model pluralized.
**/
function writeFile(option, items = '-updatedAt -createdAt -__v'){
    var MongooseModel = mongoose.model(option);
    var stream = fs.createWriteStream('files/' + option + 's.tsv');

    var dbStream = MongooseModel.find().select(items).lean().stream();

    var options = {
        delimiter: '\t',
        headers: true
    }

    var csvStream = csv.createWriteStream(options);
    csvStream.pipe(stream);

    var counter = 0;

    dbStream.on('data', function (model) {
        counter++;
        if(option == 'CoOccurrence'){
            delete model._id;
        } else if (option == 'Project'){
            model.languages = model.languages.map(function (lang) {
                return lang._id;
            });
        }

        file[option].linesRead = counter;

        csvStream.write(model);
    }).on('error', function (err) {
        console.log('========== AAAAHHHHHH')
        console.log(err);
    }).on('close', function (){
        console.log('* Finished! *');
        file[option].status = READY;
    });
}

/** Helper function to read the files
*
*  @param option - The Model that will be exported. The file will be the name of this model pluralized.
**/

function readFile(option){
    var MongooseModel = mongoose.model(option);

    var countCallback = function (err, dbCount) {
        if(dbCount == 0) {
            var path = 'files/' + option + 's.tsv';
            var options = {
                delimiter: '\t',
                headers: true,
                ignoreEmpty: true
            }
            var readable = fs.createReadStream(path, {encoding: 'utf8'});

            console.log('** Reading file! **');
            var models = [];
            var counter = 0;
            csv.fromStream(readable, options)
            .on('data', function(model){
                if(option == 'Developer'){
                    delete model.tags;
                    if(model.soId){
                        model.soProfile = {
                            _id: model.soId,
                            tags: [],
                            questions: [],
                            answers: [],
                            soPopulated: false
                        }
                    }
                    model.ghProfile = {
                        _id: model._id,
                        email: model.email
                    }
                    delete model.email;
                    delete model.soId;
                }

                models.push(model)
                counter++;
                populated[option].linesRead = counter;
            }).on('end', function(){
                MongooseModel.collection.insert(models, function (err) {
                    if(err){
                        console.log(err);
                    } else {
                        console.log(option + 's populated');
                        console.log('***** DONE *****');
                    }
                });
                populated[option].status = READY;
            });
        } else {
            populated[option].status = READY;
            populated[option].linesRead = dbCount;
        }
    }

    MongooseModel.count().exec(countCallback);
}

function populate(option, project = undefined){
    var populator = require('../controllers/populator')();
    if(project){
        var repo = JSON.parse(project);
        populator.GitHub([repo._id]);
        populator.StackOverflow('Developer', repo._id);
    } else {
        populator.StackOverflow(option);
    }
}


function writeDevs(){
    console.log('** Generating developers file **');
    var items = '-updatedAt -createdAt -__v'
    var Developer = mongoose.model('Developer');
    var dbStream = Developer.find().select(items).lean().stream();

    var devStream = fs.createWriteStream('files/Developers.tsv');
    var questionStream = fs.createWriteStream('files/Questions.tsv');
    var answerStream = fs.createWriteStream('files/Answers.tsv');

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

    var counter = 0;
    dbStream.on('data', function (dev) {
        counter++;
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

        devCsvStream.write(dev);
        file.Developer.linesRead = counter;
    }).on('error', function (err) {
        console.log('========== AAAAHHHHHH')
        console.log(err);
    }).on('close', function (){
        console.log('* Finished Developers! *');
        devCsvStream.end();
        answerCsvStream.end();
        questionCsvStream.end();
        file.Developer.status = READY;
    });
}


function writeIssueOrCommit(option = 'Issue'){
    console.log('** Generating file **');
    var items = '-__v'
    var Model = mongoose.model(option);
    var dbStream = Model.find().select(items).lean().stream();

    var mainStream = fs.createWriteStream('files/' + option + 's.tsv');
    var commentStream = fs.createWriteStream('files/' + option + 'Comments.tsv');

    var options = {
        delimiter: '\t',
        headers: true
    }

    var mainCvsStream = csv.createWriteStream(options);
    mainCvsStream.pipe(mainStream);

    var commentCsvStream = csv.createWriteStream(options);
    commentCsvStream.pipe(commentStream);

    var counter = 0;
    dbStream.on('data', function (model) {
        counter++;
        if(model.comments){
            for(var comment of model.comments){
                commentCsvStream.write(comment);
            }
            delete model.comments;
        }

        delete model.tags;

        mainCvsStream.write(model);
        file[option].linesRead = counter;
    }).on('error', function (err) {
        console.log('========== AAAAHHHHHH')
        console.log(err);
    }).on('close', function (){
        console.log('* Finished ' + option + '! *');
        mainCvsStream.end();
        commentCsvStream.end();
        file[option].status = READY;
    });
}
