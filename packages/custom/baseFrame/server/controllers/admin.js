'use strict';

// Database connections
var mongoose = require('mongoose');

var fs = require('fs');
var csv = require('fast-csv');

var READY = 200; //Status code to be sent when ready.
var NOT_READY = 202; //Send accepted status code

var models = ['Tag', 'CoOccurrence', 'Issue', 'Developer', 'Commit', 'Comment',
  'Language', 'Project', 'IssueEvent', 'StopWord', 'Contributor', 'IssueComment', 'CommitComment'];

var populated = {};
var file = {};
for(var model of models){
    populated[model] = {
        status: NOT_READY,
        pagesAdded: 0
    };
    file[model] = {
        status: NOT_READY,
        pagesAdded: 0
    };
}

module.exports = function (BaseFrame){
    return {
        populate: function (req, res) {
            var query = req.query;
            switch (query.option) {
                case 'StopWord':
                case 'Developer':
                case 'CoOccurrence':
                case 'Tag':
                    readFile(query.option);
                    break;
                default:
                    populate(query.option, query.project);
            }

            res.status(NOT_READY).send(populated[query.option]);
        },

        generate: function (req, res) {
            var option = req.query.resource;

            switch (option) {
                case 'Developer':
                case 'Contributor':
                    writeDevs();
                    break;
                case 'IssueEvent':
                    var headers = ['_id', 'projectId', 'issueId', 'issueNumber',
                      'actor', 'commitId', 'typeOfEvent', 'assigneeId',
                      'createdAt'];
                    writeFile('IssueEvent', headers);
                    break;
                case 'IssueComment':
                    writeIssueComments();
                    saveTimestamp(option, 'files/IssueComments.tsv');
                    break;
                case 'Issue':
                    writeIssues();
                    break;
                case 'Commit':
                    writeCommits();
                    break;
                case 'CommitComment':
                    writeCommitComments();
                    saveTimestamp(option, 'files/CommitComments.tsv');
                    break;
                default:
                    writeFile(option);
                    break;
            }
            res.status(NOT_READY).send(file[option]);
        },

        oauth: function (req, res) {
            var config = {
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
            request(config, function (err, response, body){
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
                var populator = require('../controllers/populator')();
                switch (option) {
                    case 'Contributor':
                        res.sendStatus(populator.check('Developer'));
                        break;
                    case 'StopWord':
                    case 'Developer':
                    case 'CoOccurrence':
                    case 'Tag':
                        res.sendStatus(populated[option].status);
                        break;
                    default:
                        res.sendStatus(populator.check(option));
                }
            }
        },

        timestamps: function (req, res) {
            var GenerateFileLog = mongoose.model('GenerateFileLog');
            GenerateFileLog.find({}).select('model timestamp').exec(function (err, logs) {
                var generatedLogs = {};
                for(var log of logs){
                    generatedLogs[log.model] = log.timestamp;
                }
                delete generatedLogs.Comment;
                res.send(generatedLogs);
            });
        }
    }
}

function saveTimestamp(option, path){
    var GenerateFileLog = mongoose.model('GenerateFileLog');
    var update = {
        filePath: path,
        timestamp: new Date(),
    };
    GenerateFileLog.update({model: option}, update, {upsert: true}).exec();
}

/** This is responsible for writing the file with the StackOverflow data.
*
* @param option - The Model that will be exported. The file will be the name of this model pluralized.
**/
function writeFile(option,
            headers = true,
            transform = undefined,
            fileName = option + 's.tsv',
            items = '-updatedAt -__v',
            filter = {}){
    var path = 'files/' + fileName;

    var MongooseModel = mongoose.model(option);
    var stream = fs.createWriteStream(path);

    var dbStream = MongooseModel.find(filter).select(items).lean().stream();

    var options = {
        delimiter: '\t',
        headers: headers
    }

    var csvStream = csv.createWriteStream(options);
    if(transform){
        csvStream.transform(transform);
    }
    csvStream.pipe(stream);

    var counter = 0;

    dbStream.on('data', function (model) {
        counter++;
        if(option === 'CoOccurrence'){
            delete model._id;
        } else if (option === 'Project'){
            model.languages = model.languages.map(function (lang) {
                return lang._id + ':' + lang.amount;
            });
        }
        if(model.createdAt){
            model.createdAt = model.createdAt.toISOString();
        }

        file[option].linesRead = counter;

        csvStream.write(model);
    }).on('error', function (err) {
        console.log('========== AAAAHHHHHH')
        console.log(err);
    }).on('close', function (){
        csvStream.end();
        console.log('* Finished! *');
        file[option].status = READY;
        saveTimestamp(option, path);
    });
}

function writeIssues(){
    var headers = ['_id', 'projectId', 'number', 'title',
      'body', 'type', 'labels', 'state', 'reporterLogin',
      'assigneeLogin', 'createdAt', 'url'];

    var transform = function (row) {
        if(row.body){
            row.body = row.body
              .replace(/\t/g, '        ');
            row.body = row.body
              .replace(/(?:\r\n|\r|\n)/g, '                ');
            row.body = row.body
              .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
        }
        row.reporterLogin = row.reporterId;
        row.assigneeLogin = row.assigneeId;
        delete row.reporterId;
        delete row.assigneeId;
        return row;
    }
    writeFile('Issue', headers, transform);
}

function writeIssueComments(){
    var headers = ['_id', 'issueNumber', 'projectId', 'body',
    'commenterLogin', 'createdAt'];
    var transform = function (row) {
        row.body = row.body
        .replace(/\t/g, '        ');
        row.body = row.body
        .replace(/(?:\r\n|\r|\n)/g, '                ');
        row.body = row.body
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
        row.commenterLogin = row.user;
        return row;
    }

    writeFile('Comment', headers, transform, 'IssueComments.tsv',
    '-updatedAt -__v', {type: 'issue'});
}

function writeCommits(){
    var headers = ['sha', 'message', 'committerLogin', 'projectId', 'createdAt', 'url'];
    var transform = function (row) {
        row.message = row.message
          .replace(/\t/g, '        ');
        row.message = row.message
          .replace(/(?:\r\n|\r|\n)/g, '                ');
        row.message = row.message
          .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
        row.sha = row._id;
        row.committerLogin = row.user;
        delete row.user;
        delete row._id;
        return row;
    }
    writeFile('Commit', headers, transform);
}

function writeCommitComments() {
    var headers = ['_id', 'commitSha', 'projectId', 'body',
      'commenterLogin', 'createdAt'];
    var transform = function (row) {
        row.body = row.body
          .replace(/\t/g, '        ');
        row.body = row.body
          .replace(/(?:\r\n|\r|\n)/g, '                ');
        row.body = row.body
          .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
        row.commenterLogin = row.user;
        return row;
    }

    writeFile('Comment', headers, transform, 'CommitComments.tsv',
      '-__v', {type: 'commit'});
}

function writeDevs(){
    console.log('** Generating developers file **');
    var items = '-updatedAt -createdAt -__v'
    var Developer = mongoose.model('Developer');
    var dbStream = Developer.find().select(items).lean().stream();

    var devFilePath = 'files/Developers.tsv';
    var questionFilePath = 'files/Questions.tsv';
    var answerFilePath = 'files/Answers.tsv';
    var devStream = fs.createWriteStream(devFilePath);
    var questionStream = fs.createWriteStream(questionFilePath);
    var answerStream = fs.createWriteStream(answerFilePath);

    var options = {
        delimiter: '\t',
        headers: ['_id', 'email', 'repositories', 'soId', 'tags']
    }

    var devCsvStream = csv.createWriteStream(options);
    devCsvStream.pipe(devStream);

    options.headers = true;

    var questionCsvStream = csv.createWriteStream(options);
    questionCsvStream.pipe(questionStream);

    var answerCsvStream = csv.createWriteStream(options);
    answerCsvStream.pipe(answerStream);

    var counter = 0;
    dbStream.on('data', function (dev) {
        counter++;
        dev.email = dev.ghProfile.email;
        dev.repositories = dev.ghProfile.repositories;
        if(dev.soProfile){
            for(var question of dev.soProfile.questions){
                question.body = question.body
                  .replace(/\t/g, '        ');
                question.body = question.body
                  .replace(/(?:\r\n|\r|\n)/g, '                ');
                question.body = question.body
                  .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
                question.askerId = dev._id;
                question.askerSoId = dev.soProfile._id;

                if(question.createdAt){
                    question.createdAt = question.createdAt.toISOString();
                }

                if(question.updatedAt){
                    question.updatedAt = question.updatedAt.toISOString();
                }
                questionCsvStream.write(question);
            }

            for(var answer of dev.soProfile.answers){
                answer.body = answer.body
                  .replace(/\t/g, '        ');
                answer.body = answer.body
                  .replace(/(?:\r\n|\r|\n)/g, '                ');
                answer.body = answer.body
                  .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
                answer.answererId = dev._id;
                answer.answererSoId = dev.soProfile._id;

                if(answer.createdAt){
                    answer.createdAt = answer.createdAt.toISOString();
                }

                if(answer.updatedAt){
                    answer.updatedAt = answer.updatedAt.toISOString();
                }

                answerCsvStream.write(answer);
            }

            dev.soId = dev.soProfile._id;

            dev.tags = dev.soProfile.tags.map(function (tag) {
                return tag._id;
            });
        }

        if(dev.createdAt){
            dev.createdAt = dev.createdAt.toISOString();
        }

        if(dev.updatedAt){
            dev.updatedAt = dev.updatedAt.toISOString();
        }

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
        file.Contributor.status = READY;
        saveTimestamp('Developer', devFilePath);
        saveTimestamp('Contributor', devFilePath);
        saveTimestamp('Answer', answerFilePath);
        saveTimestamp('Question', questionFilePath);
    });
}

/** Helper function to read the files
*
*  @param option - The Model that will be exported. The file will be the name of this model pluralized.
**/

function readFile(option){
    var MongooseModel = mongoose.model(option);

    var countCallback = function (err, dbCount) {
        if(dbCount === 0) {
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
                if(option === 'Developer'){
                    delete model.tags;
                    if(model.soId){
                        model.soProfile = {
                            _id: parseInt(model.soId),
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
        if(option === 'Contributor'){
            populator.GitHub('Developer', repo._id);
            populator.StackOverflow('Developer', repo._id);
        } else {
            populator.GitHub(option, repo._id);
        }
    } else {
        populated[option].status = READY;
        populator.StackOverflow(option);
    }
}
