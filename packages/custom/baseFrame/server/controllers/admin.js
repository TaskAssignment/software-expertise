'use strict';

// Database connections
var mongoose = require('mongoose');

var fs = require('fs');
var csv = require('fast-csv');

var READY = 200; //Status code to be sent when ready.
var NOT_READY = 202; //Send accepted status code

var models = ['Tag', 'CoOccurrence', 'Issue', 'Developer', 'Commit', 'Comment', 'Language', 'Project', 'IssueEvent'];

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
                case 'StopProject':
                case 'Developer':
                case 'CoOccurrence':
                case 'Tag':
                    readFile(query.option);
                    break;
                case 'Project':
                    populated.Project.status = READY;
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
                    break;
                case 'IssueEvent':
                    writeIssues();
                    break;
                case 'Commit':
                    writeCommits();
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
        if(option == 'CoOccurrence'){
            delete model._id;
        } else if (option == 'Project'){
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
        console.log('* Finished! *');
        file[option].status = READY;
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
            .replace(/[\x00-\x1F\x7F-\x9F]/gu, ' ');
        }
        row.reporterLogin = row.reporterId;
        row.assigneeLogin = row.assigneeId;
        delete row.reporterId;
        delete row.assigneeId;
        return row;
    }
    writeFile('Issue', headers, transform);

    headers = ['_id', 'issueNumber', 'projectId', 'body',
      'commenterLogin', 'createdAt'];
    transform = function (row) {
        row.body = row.body
          .replace(/\t/g, '        ');
        row.body = row.body
          .replace(/(?:\r\n|\r|\n)/g, '                ');
        row.body = row.body
          .replace(/[\x00-\x1F\x7F-\x9F]/gu, ' ');
        row.commenterLogin = row.user;
        return row;
    }

    writeFile('Comment', headers, transform, 'IssueComments.tsv',
        '-updatedAt -__v', {type: 'issue'});

    headers = ['_id', 'projectId', 'issueId', 'issueNumber',
      'actor', 'commitId', 'typeOfEvent', 'assigneeId',
      'createdAt'];
    writeFile('IssueEvent', headers);
}

function writeCommits(){
    var headers = ['sha', 'message', 'committerId', 'projectId', 'createdAt', 'url'];
    var transform = function (row) {
        row.message = row.message
          .replace(/\t/g, '        ');
        row.message = row.message
          .replace(/(?:\r\n|\r|\n)/g, '                ');
        row.message = row.message
          .replace(/[\x00-\x1F\x7F-\x9F]/gu, ' ');
        row.sha = row._id;
        row.committerLogin = row.user;
        delete row.user;
        delete row._id;
        return row;
    }
    writeFile('Commit', headers, transform);

    headers = ['_id', 'commitSha', 'projectId', 'body',
      'commenterLogin', 'createdAt'];
    transform = function (row) {
        row.body = row.body
          .replace(/\t/g, '        ');
        row.body = row.body
          .replace(/(?:\r\n|\r|\n)/g, '                ');
        row.body = row.body
          .replace(/[\x00-\x1F\x7F-\x9F]/gu, ' ');
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
        populator.GitHub([repo._id]);
        // populator.StackOverflow('Developer', repo._id);
    } else {
        populated[option].status = READY;
        populator.StackOverflow(option);
    }
}
