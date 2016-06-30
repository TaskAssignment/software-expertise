'use strict';

// Database connections
var mongoose = require('mongoose');

var fs = require('fs');
var csv = require('fast-csv');

var READY = 200; //Status code to be sent when ready.
var NOT_READY = 202; //Send accepted status code

var statuses = {};

initialStatus();

function initialStatus(){
    var models = ['Tag', 'CoOccurrence', 'Bug', 'Developer', 'Commit', 'Comment',
      'Language', 'Project', 'Event', 'StopWord', 'Contributor', 'IssueComment',
      'CommitComment', 'GitHubIssue'];

    for(var model of models){
        statuses[model] = {
            populated: NOT_READY,
            generated: NOT_READY,
        }
    }

}
module.exports = function (BaseFrame){
    return {
        populate: function (req, res) {
            var query = req.query;
            switch (query.option) {
                case 'StopProject':
                case 'CoOccurrence':
                case 'Tag':
                    readFile(query.option);
                    break;
                case 'Developer':
                    readDevs();
                    break;
                default:
                    populate(query.option, query.project);
            }

            res.sendStatus(NOT_READY);
        },

        generate: function (req, res) {
            var option = req.query.resource;

            switch (option) {
                case 'Developer':
                case 'Contributor':
                    writeAnswersAndQuestions();
                    // writeDevs();
                    break;
                case 'Event':
                    var headers = ['_id', 'projectId', 'issueId', 'issueNumber',
                      'actor', 'commitId', 'typeOfEvent', 'assigneeId',
                      'createdAt'];
                    writeFile('Event', headers);
                    break;
                case 'IssueComment':
                    writeIssueComments();
                    break;
                case 'Bug':
                    writeBugs();
                    break;
                case 'Commit':
                    writeCommits();
                    break;
                case 'CommitComment':
                    writeCommitComments();
                    break;
                default:
                    writeFile(option);
                    break;
            }
            res.sendStatus(NOT_READY);
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

            if(populate){
                var populator = require('../controllers/populator')();
                switch (option) {
                    case 'Contributor':
                        res.sendStatus(populator.check('Developer'));
                        break;
                    case 'StopWord':
                    case 'Developer':
                    case 'CoOccurrence':
                    case 'Tag':
                        res.sendStatus(getStatus(option, 'populated'));
                        break;
                    default:
                        res.sendStatus(populator.check(option));
                        break;
                }
            } else {
                res.sendStatus(getStatus(option, 'generated'));
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
        timestamp: new Date(),
    };
    GenerateFileLog.update({model: option}, update, {upsert: true}).exec();
}

/** This is responsible for writing the file with the StackOverflow data.
*
* @param modelName - The Model that will be exported. The file will be the name of this model pluralized.
**/
function writeFile(modelName,
            headers = true,
            transform = undefined,
            fileName = modelName + 's.tsv',
            items = '-updatedAt -__v',
            filter = {},
            populate = ''){
    var path = 'files/' + fileName;

    var MongooseModel = mongoose.model(modelName);
    var stream = fs.createWriteStream(path);

    var dbStream = MongooseModel.find(filter).select(items).populate(populate).lean().stream();

    var csvOptions = {
        delimiter: '\t',
        headers: headers
    }

    var csvStream = csv.createWriteStream(csvOptions);
    if(transform){
        csvStream.transform(transform);
    }
    csvStream.pipe(stream);

    dbStream.on('data', function (model) {
        //TODO: Change this to use transform!!
        if(modelName === 'CoOccurrence'){
            delete model._id;
        } else if (modelName === 'Project'){
            model.languages = model.languages.map(function (lang) {
                return lang._id + ':' + lang.amount;
            });
        }
        if(model.createdAt){
            model.createdAt = model.createdAt.toISOString();
        }

        csvStream.write(model);
    }).on('error', function (err) {
        console.log('========== AAAAHHHHHH')
        console.log(err);
    }).on('close', function (){
        csvStream.end();
        console.log('* Finished! *');
        changeStatus(modelName, READY);
    });
}


/** Export bugs to file
**/
function writeBugs(){
    var headers = ['_id', 'projectId', 'number', 'title',
      'body', 'labels', 'status', 'reporterLogin',
      'assigneesLogins', 'createdAt', 'url'];

    var transform = function (row) {
        if(row.bug.body){
            row.bug.body = row.bug.body
              .replace(/\t/g, '        ');
            row.bug.body = row.bug.body
              .replace(/(?:\r\n|\r|\n)/g, '                ');
            row.bug.body = row.bug.body
              .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
        }
        row.bug.createdAt = row.bug.createdAt.toISOString();

        row.bug.projectId = row.project;
        row.bug.number = row.number;
        row.bug.reporterLogin = row.bug.author;
        row.bug.assigneesLogins = [];
        for(var assignee of row.assignees){
            row.bug.assigneesLogins.push(assignee.username);
        }
        delete row.bug.author;
        return row.bug;
    }
    writeFile('GitHubIssue', headers, transform, 'Bugs.tsv', '-updatedAt -__v',
    {isPR: false}, 'bug');
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

/** Writes StackOverflow answers and questions to .tsv files. They are called
* 'Answers.tsv' and 'Questions.tsv' and are on the 'files/' folder.
**/
function writeAnswersAndQuestions(){
    console.log('** Generating developers file **');
    var items = '-updatedAt -createdAt -__v'
    var SoProfile = mongoose.model('StackOverflowProfile');
    var dbStream = SoProfile.find().select(items).lean().stream();

    var questionFilePath = 'files/Questions.tsv';
    var answerFilePath = 'files/Answers.tsv';
    var questionStream = fs.createWriteStream(questionFilePath);
    var answerStream = fs.createWriteStream(answerFilePath);

    var options = {
        delimiter: '\t',
        headers: true,
    }

    var questionCsvStream = csv.createWriteStream(options);
    questionCsvStream.pipe(questionStream);

    var answerCsvStream = csv.createWriteStream(options);
    answerCsvStream.pipe(answerStream);

    dbStream.on('data', function (dev) {
        for(var question of dev.questions){
            question.body = question.body
              .replace(/\t/g, '        ');
            question.body = question.body
              .replace(/(?:\r\n|\r|\n)/g, '                ');
            question.body = question.body
              .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
            question.askerEmail = dev.email;
            question.askerSoId = dev._id;

            if(question.createdAt){
                question.createdAt = question.createdAt.toISOString();
            }

            if(question.updatedAt){
                question.updatedAt = question.updatedAt.toISOString();
            }
            questionCsvStream.write(question);
        }

        for(var answer of dev.answers){
            answer.body = answer.body
              .replace(/\t/g, '        ');
            answer.body = answer.body
              .replace(/(?:\r\n|\r|\n)/g, '                ');
            answer.body = answer.body
              .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
            answer.answererEmail = dev.email;
            answer.answererSoId = dev._id;

            if(answer.createdAt){
                answer.createdAt = answer.createdAt.toISOString();
            }

            if(answer.updatedAt){
                answer.updatedAt = answer.updatedAt.toISOString();
            }

            answerCsvStream.write(answer);
        }

    }).on('error', function (err) {
        console.log('========== AAAAHHHHHH')
        console.log(err);
    }).on('close', function (){
        console.log('* Finished Developers! *');

        answerCsvStream.end();
        questionCsvStream.end();

        saveTimestamp('Answer', answerFilePath);
        saveTimestamp('Question', questionFilePath);
    });
}

/** Basic flow to read files. It's assumed that, whatever the file name, it's
* located on 'files/' (from the root of the project).
*
*  @param {string} modelName - The Model name that will be import.
*  @param {function} transformCallback - The function that will transform the data before
    writing it to the database.
*  @param {boolean|array} headers - If true, it will consider the first line
    of the file as headers. If an array is given, each entry will be a header.
*  @param fileName - The name of file to be read. This should be a .tsv.
    Default is modelName pluralized. E.g: modelName = Issue, fileName = Issues.tsv
**/
function readFile(modelName,
            transformCallback = undefined,
            savingOnTransform = false,
            headers = true,
            fileName = modelName + 's.tsv'){

    var MongooseModel = mongoose.model(modelName);

    var path = 'files/' + fileName;
    var options = {
        delimiter: '\t',
        headers: headers,
        ignoreEmpty: true,
    }
    var readable = fs.createReadStream(path, {encoding: 'utf8'});

    console.log('** Reading file! **');
    var models = [];
    var counter = 0;
    var readStream = csv.fromStream(readable, options);

    if(transformCallback){
        readStream.transform(transformCallback);
    }

    if(!savingOnTransform){
        readStream.on('data', function(model){
            models.push(model);
        }).on('end', function () {
            MongooseModel.collection.insert(models, function (err) {
                if(err){
                    console.log(err.message);
                } else {
                    console.log(modelName + 's populated');
                    console.log('***** DONE *****');
                }
                changeStatus(modelName, READY, 'populated');
            });
        })
    } else {
        readStream.on('end', function(){
            changeStatus(modelName, READY, 'populated');
        });
    }

}

/** Generates the callback to populate the common users.
**/
function readDevs(){
    var GitHubProfile = mongoose.model('GitHubProfile');
    var StackOverflowProfile = mongoose.model('StackOverflowProfile');
    var Developer = mongoose.model('Developer');

    var transform = function (data) {
        var soProfile = {};

        if(data.soId.length > 0){
            soProfile._id = data.soId;
            soProfile.email = data.email;

            StackOverflowProfile.create(soProfile, function (err){
                if(err){
                    console.log(err.message);
                }
            });
        }

        GitHubProfile.create(data, function (err){
            if(err){
                console.log(err.message);
            }
        });

        var dev = {
            email: data.email,
        }
        var updateFields = {
            $addToSet: {
                'profiles.gh': data._id,
                'profiles.so': soProfile._id,
            },
        }
        var options = {
            upsert: true,
        }

        Developer.findOneAndUpdate(dev, updateFields, options, function (err){
            if(err){
                console.log(err.message);
            }
        });
    }

    var savingOnTransform = true;

    readFile('Developer', transform, savingOnTransform);
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
        changeStatus(model, READY, 'populated');
        populator.StackOverflow(option);
    }
}

function getStatus(model, option = 'generated'){
    switch (model) {
        case 'CommitComment':
        case 'IssueComment':
        case 'Comment':
            model = 'Comment';
            break;
        case 'Bug':
        case 'Issue':
        case 'GitHubIssue':
        case 'BugzillaBug':
            model = 'Bug';
            break;
    }
    return statuses[model][option];
}

function changeStatus(model, status, option = 'generated'){
    switch (model) {
        case 'CommitComment':
        case 'IssueComment':
        case 'Comment':
            model = 'Comment';
            break;
        case 'Bug':
        case 'Issue':
        case 'GitHubIssue':
        case 'BugzillaBug':
            model = 'Bug';
            break;
    }

    statuses[model][option] = status;
    if(status === READY && option === 'generated'){
        saveTimestamp(model);
    }
}
