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
                // case 'CoOccurrence':
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
                    var headers = {
                        main: ['_id', 'projectId', 'number', 'title',
                          'body', 'pullRequest', 'labels', 'state',
                          'reporterLogin', 'assigneeLogin', 'createdAt'],
                        comments: ['_id', 'projectId', 'issueId', 'body',
                          'commenterLogin', 'createdAt'],
                    };

                    var transform = {
                        main: function (row) {
                            row.body = row.body
                              .replace(/\t/g, '        ');
                            row.body = row.body
                              .replace(/(?:\r\n|\r|\n)/g, '                ');
                            row.body = row.body
                              .replace(/[\x00-\x1F\x7F-\x9F]/gu, ' ');
                            row.reporterLogin = row.reporterId;
                            row.assigneeLogin = row.assigneeId;
                            delete row.reporterId;
                            delete row.assigneeId;
                            return row;
                        },
                        comments: function (row) {
                            row.issueId = row.modelId;
                            return row;
                        }
                    }
                    writeIssueOrCommit(option, headers, transform);
                    break;
                case 'Commit':
                    var headers = {
                        main: ['sha', 'message', 'commenterId', 'projectId', 'createdAt'],
                        comments: ['_id', 'projectId', 'commitSha', 'body', 'commenterLogin', 'createdAt'],
                    };

                    var transform = {
                        main: function (row) {
                            row.message = row.message
                              .replace(/\t/g, '        ');
                            row.message = row.message
                              .replace(/(?:\r\n|\r|\n)/g, '                ');
                            row.message = row.message
                              .replace(/[\x00-\x1F\x7F-\x9F]/gu, ' ');
                            row.commenterLogin = row.user;
                            row.sha = row._id;
                            delete row.user;
                            delete row._id;
                            return row;
                        },
                        comments: function (row) {
                            row.commitSha = row.modelId;
                            return row;
                        }
                    }
                    writeIssueOrCommit(option, headers, transform);
                    break;
                default:
                    file[option].status = NOT_READY;
                    writeFile(option);
                    break;
            }
            res.status(NOT_READY).send(file[option]);
        },

        oauth: function (req, res) {
            var req = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                uri: 'https://stackexchange.com/oauth/access_token',
                form: {
                    'client_id': '7345',
                    'client_secret': 'YlMgg2VjucoX9q9ksZyyKA((',
                    'code': req.query.code,
                    'redirect_uri': 'http://localhost:3000/admin'
                }
            };
            request(req, function (err, response, body){
                console.log(body);
                res.send(body);
            });
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
function writeFile(option, headers = true, items = '-updatedAt -createdAt -__v'){
    var MongooseModel = mongoose.model(option);
    var stream = fs.createWriteStream('files/' + option + 's.tsv');

    var dbStream = MongooseModel.find().select(items).lean().stream();

    var options = {
        delimiter: '\t',
        headers: headers
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
                        repositories: [],
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
        // populator.StackOverflow('Developer', repo._id);
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
                question.body = question.body.replace(/\t/g, '        ');
                question.body = question.body.replace(/(?:\r\n|\r|\n)/g, '                ');
                question.askerId = dev._id;
                question.askerSoId = dev.soProfile._id;
                questionCsvStream.write(question);
            }

            for(var answer of dev.soProfile.answers){
                answer.body = answer.body.replace(/\t/g, '        ');
                answer.body = answer.body.replace(/(?:\r\n|\r|\n)/g, '                ');
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


function writeIssueOrCommit(option = 'Issue',
            headers = {main: true, comments: true}, transform = {}){
    console.log('** Generating file **');
    var items = '-__v'
    var Model = mongoose.model(option);
    var dbStream = Model.find().select(items).lean().stream();

    var mainStream = fs.createWriteStream('files/' + option + 's.tsv');
    var commentStream = fs.createWriteStream('files/' + option + 'Comments.tsv');

    var options = {
        delimiter: '\t',
        headers: headers.main
    }

    var mainCvsStream = csv.createWriteStream(options)
    if(transform.main){
        mainCvsStream.transform(transform.main);
    }
    mainCvsStream.pipe(mainStream);

    options.headers = headers.comments;
    var commentCsvStream = csv.createWriteStream(options);
    if(transform.comments){
        commentCsvStream.transform(transform.comments);
    }
    commentCsvStream.pipe(commentStream);

    var counter = 0;
    dbStream.on('data', function (model) {
        counter++;
        delete model.tags;
        if(model.comments){
            for(var comment of model.comments){
                comment.body = comment.body
                  .replace(/\t/g, '        ');
                comment.body = comment.body
                  .replace(/(?:\r\n|\r|\n)/g, '                ');
                comment.body = comment.body
                  .replace(/[\x00-\x1F\x7F-\x9F]/gu, ' ');
                comment.modelId = model._id;
                comment.projectId = model.projectId;
                comment.createdAt = comment.createdAt.toISOString();
                commentCsvStream.write(comment);
            }
        }

        model.createdAt = model.createdAt.toISOString();

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
