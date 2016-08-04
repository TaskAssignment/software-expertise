'use strict';

/** Handles import and export requests from the UI
*
* @module export
* @requires mongoose
* @requires fs
* @requires fast-csv
**/
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
    var statuses = {
        Bug: {
            GitHubIssue: true,
            description: 'GitHub Issues and their comments and history. Bugzilla Bugs, their comments and history (where it was able to fetch them). 6 files.',
        },
        PullRequest: {
            label: 'Pull Requests',
            description: 'GitHub Pull Requests with their comments and history. 3 files.',
        },
        Commit: {
            label: 'Commits',
            description: 'GitHub commits with their comments. 2 files.',
        },
        Project: {
            label: 'Projects',
            description: 'GitHub repositories and Bugzilla services. 2 files.',
        },
        Developer: {
            label: 'Developers',
            description: 'Information from StackOverflow, GitHub and Bugzilla profiles, answers and questions from StackOverflow. 3 files',
        },
        Meta: {
            label: 'Metadata',
            description: 'StackOverflow Tags and CoOccurrences, StopWords to analise text. 3 files.',
        },
    }
    var models = ['Tag', 'CoOccurrence', 'Bug', 'Developer', 'Commit', 'Comment',
      'Project', 'Event', 'StopWord'];

    for(var model of models){
        statuses[model] = NOT_READY;
    }

}
module.exports = function (BaseFrame){
    return {
        generate: function (req, res) {
            var option = req.query.resource;
            switch (option) {
                case 'Bug':
                    writeIssues();
                    writeIssueComments();

                    var headers = ['_id', 'projectId', 'issueId', 'issueNumber',
                    'actor', 'commitId', 'typeOfEvent', 'assigneeId',
                    'createdAt'];
                    writeFile('Event', headers, undefined, 'IssueEvents.tsv',
                    '-updatedAt -__v', {isPrEvent: false});

                    break;
                case 'PullRequest':
                    writeIssues(true);

                    var headers = ['_id', 'projectId', 'issueId', 'issueNumber',
                    'actor', 'commitId', 'typeOfEvent', 'assigneeId',
                    'createdAt'];
                    writeFile('Event', headers, undefined, 'PullRequestEvents.tsv',
                    '-updatedAt -__v', {isPrEvent: true});

                    break;
                    break;
                case 'Commit':
                    writeCommits();
                    writeCommitComments();
                    break;
                case 'Project':
                    writeFile(option);
                    break;
                case 'Developer':
                    writeAnswersAndQuestions();
                    writeDevs();
                    break;
                case 'Meta':
                    writeFile('Tag');
                    writeFile('CoOccurrence');
                    writeFile('StopWord');
                    break;
            }
            res.sendStatus(NOT_READY);
        },

        download: function (req, res) {
            var JSZip = require("jszip");
            var zip = new JSZip();

            var option = req.query.resource;
            switch (option) {
                case 'Bug':
                    zip.file('Issues.tsv', fs.readFileSync('files/Issues.tsv'));
                    zip.file('IssueEvents.tsv', fs.readFileSync('files/IssueEvents.tsv'));
                    zip.file('IssueComments.tsv', fs.readFileSync('files/IssueComments.tsv'));
                    break;
                case 'PullRequest':
                    zip.file('PullRequests.tsv', fs.readFileSync('files/PullRequests.tsv'));
                    zip.file('PullRequestEvents.tsv', fs.readFileSync('files/PullRequestEvents.tsv'));
                    break;
                case 'Commit':
                    zip.file('Commits.tsv', fs.readFileSync('files/Commits.tsv'));
                    zip.file('CommitComments.tsv', fs.readFileSync('files/CommitComments.tsv'));
                    break;
                case 'Project':
                    zip.file('Projects.tsv', fs.readFileSync('files/Projects.tsv'));
                    break;
                case 'Developer':
                    zip.file('Questions.tsv', fs.readFileSync('files/Questions.tsv'));
                    zip.file('Answers.tsv', fs.readFileSync('files/Answers.tsv'));
                    zip.file('Developers.tsv', fs.readFileSync('files/Developers.tsv'));
                    break;
                case 'Meta':
                    zip.file('Tags.tsv', fs.readFileSync('files/Tags.tsv'));
                    zip.file('CoOccurrences.tsv', fs.readFileSync('files/CoOccurrences.tsv'));
                    zip.file('StopWords.tsv', fs.readFileSync('files/StopWords.tsv'));
                    break;
            }

            zip.generateNodeStream({
                type: 'nodebuffer',
                platform: process.platform,
                compression: 'DEFLATE',
                compressionOptions: {
                    level: 5,
                },
            }).pipe(fs.createWriteStream('files/' + option + '.zip'))
            .on('finish', function () {
                res.sendFile(option + '.zip', {root:'files/'});
            });
        },

        check: function (req, res) {
            var option = getModelName(req.query.resource);
            res.sendStatus(statuses[option]);
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
        headers: headers,
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
function writeIssues(isPR = false){
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

    var modelName = 'GitHubIssue';
    var filter = { isPR: isPR };

    var fileName = '';
    if(isPR){
        fileName = 'PullRequests.tsv';
    } else {
        fileName = 'Issues.tsv';
    }

    writeFile(modelName, headers, transform, fileName, '-updatedAt -__v',
      filter, 'bug');
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

function getStatus(model){
    model = getModelName(model);
    return statuses[model];
}

function changeStatus(model, status){
    model = getModelName(model);
    statuses[model] = status;
    if(status === READY){
        saveTimestamp(model);
    }
}

function getModelName(option){
    switch (option) {
        case 'CommitComment':
        case 'IssueComment':
        case 'Comment':
            option = 'Comment';
            break;
        case 'Bug':
        case 'Issue':
        case 'PullRequest':
        case 'GitHubIssue':
        case 'BugzillaBug':
            option = 'Bug';
            break;
    }
    return option
}
