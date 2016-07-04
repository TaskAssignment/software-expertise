'use strict';

// Database connections
var mongoose = require('mongoose');

var fs = require('fs');
var csv = require('fast-csv');

var READY = 200; //Status code to be sent when ready.
var NOT_READY = 202; //Send accepted status code

var statuses = {};

initialStatus();


var SO_APPS = {
    7211: {
        client_secret: 'yurW77OF7QW5a*M84WnxJw((',
        access_token: '',
        key: 'unaHxXqTCHJ5Ve6AfnIJGg((',
    },
    7344: {
        client_secret: '1iPAaK1iEz1gYlrJ73Yi4w((',
        access_token: '',
        key: 'Ctt)0cvvDQttNSj9wmv38g((',
    },
    7343: {
        client_secret: 'ae5OXiV4C2OtuPWFjVuoXQ((',
        access_token: '',
        key: 'LrB92oMtLUnGJ5uyZvA)bw((',
    },
    7342: {
        client_secret: 'mxH2R184QmhGDrWI1TikaQ((',
        access_token: '',
        key: 'vqnCl1eW8aKqHEBXFabq7Q((',
    },
    7341: {
        client_secret: 'aiU5CjKOd*6Nyvjjf38ALA((',
        access_token: '',
        key: 'vRMoDd5M)SvR0OSzLWQIfw((',
    },
}

function initialStatus(){
    var models = ['Tag', 'CoOccurrence', 'Bug', 'Developer', 'Commit', 'Comment',
      'Language', 'Project', 'Event', 'StopWord', 'Contributor', 'IssueComment',
      'CommitComment', 'GitHubIssue', ];

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
                    writeDevs();
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
            var request = require('request');
            var clientId = req.query.client_id;
            var config = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                uri: 'https://stackexchange.com/oauth/access_token',
                form: {
                    'client_id': clientId,
                    'scope': 'no_expiry',
                    'client_secret': SO_APPS[clientId].client_secret,
                    'code': req.query.code,
                    'redirect_uri': 'http://localhost:3000/admin'
                }
            };
            request(config, function (err, response, body){
                console.log(body);
                var equalsIndex = body.lastIndexOf('=') + 1;
                var accessToken = body.substring(equalsIndex);

                SO_APPS[clientId].access_token = accessToken;
                console.log(SO_APPS);
                res.sendStatus(200);
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
        console.log('* Finished ' + fileName + ' *');
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
    console.log('** Generating answers and questions files **');
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
        console.log('* Finished Answers and questions! *');

        answerCsvStream.end();
        questionCsvStream.end();

        saveTimestamp('Answer', answerFilePath);
        saveTimestamp('Question', questionFilePath);
    });
}

function writeDevs() {
    var transform = function (data) {
        data.tags = [];
        data.soIds = [];
        for(var soProfile of data.profiles.so){
            for(var tag of soProfile.tags){
                data.tags.push(tag._id);
            }
            data.soIds.push(soProfile._id);
        }


        data.repositories = [];
        for(var ghProfile of data.profiles.gh){
            for(var repo of ghProfile.repositories){
                data.repositories.push(repo);
            }
        }

        return data;
    }

    var headers = ['_id', 'email', 'repositories', 'soIds', 'tags'];

    writeFile('Developer', headers, transform, 'Developers.tsv',
      '-updatedAt -__v', {}, 'profiles.so profiles.gh');
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
    console.log('** Reading file! **');

    var readable = fs.createReadStream(path, {encoding: 'utf8'});
    var readStream = csv.fromStream(readable, options);

    if(transformCallback){
        readStream.on('data', function(data){
            transformCallback(data)
        });
    }

    if(!savingOnTransform){
        var models = [];
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
        });
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
        StackOverflowProfile.create({_id: data.soId, email: data.email}, function (err){
            if(err){
                console.log(err.message);
            }
        });

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
                'profiles.so': data.soId,
            },
        }
        var options = {
            upsert: true,
        }

        Developer.update(dev, updateFields, options, function (err){
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
        case 'Contributor':
        case 'Developer':
            model = 'Developer';
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
    console.log(statuses);
    if(status === READY && option === 'generated'){
        saveTimestamp(model);
    }
}
