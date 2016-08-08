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

var files = {
    'Bug': [
        'Issues.tsv', 'IssueEvents.tsv', 'IssueComments.tsv', 'Bugs.tsv',
        'BugzillaBugsComments.tsv', 'BugzillaBugsHistory.tsv',
    ],
    'PullRequest': [
        'PullRequests.tsv', 'PullRequestEvents.tsv',
    ],
    'Commit': [
        'Commits.tsv', 'CommitComments.tsv',
    ],
    'Project': [
        'Projects.tsv',
    ],
    'Developer': [
        'Questions.tsv', 'Answers.tsv', 'Developers.tsv',
    ],
    'Meta': [
        'Tags.tsv', 'CoOccurrences.tsv', 'StopWords.tsv',
    ],
}

module.exports = function (BaseFrame){
    return {
        generate: function (req, res) {
            var option = req.query.resource;
            statuses[option] = NOT_READY;
            switch (option) {
                case 'Bug':
                    writeIssues();
                    writeIssueComments();

                    var headers = ['_id', 'projectId', 'issueId', 'issueNumber',
                    'actor', 'commitId', 'typeOfEvent', 'assigneeId',
                    'createdAt'];
                    writeFile('Event', headers, undefined, 'IssueEvents.tsv',
                    '-updatedAt -__v', {isPrEvent: false});

                    writeBugzillaBugs();
                    writeBugzillaComments();
                    writeBugzillaHistory();

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
            zipFiles(option);
            res.sendStatus(NOT_READY);
        },

        download: function (req, res) {
            var option = req.query.resource;
            res.sendFile(option + '.zip', {root:'files/'});
        },

        check: function (req, res) {
            var option = req.query.resource;
            res.sendStatus(statuses[option] || NOT_READY);
        },

        timestamps: function (req, res) {
            var GenerateFileLog = mongoose.model('GenerateFileLog');
            GenerateFileLog.find({}).select('model timestamp').exec(function (err, logs) {
                var generatedLogs = {};
                for(var log of logs){
                    generatedLogs[log.model] = log.timestamp;
                }
                res.send(generatedLogs);
            });
        }
    }
}

function zipFiles(option){
    var zipInterval = setInterval(function () {
        var optionReady = true;
        for(var fileName of files[option]){
            optionReady = optionReady && (statuses[fileName] === READY);
        }
        if(optionReady === true){
            stopInterval();
        }
    }, 2000);

    function stopInterval(){
        clearInterval(zipInterval);

        var JSZip = require("jszip");
        var zip = new JSZip();

        for (var fileName of files[option]) {
            zip.file(fileName, fs.readFileSync('files/' + fileName));
        }

        zip.generateNodeStream({
            type: 'nodebuffer',
            platform: process.platform,
            compression: 'DEFLATE',
            compressionOptions: {
                level: 8,
            },
        }).pipe(fs.createWriteStream('files/' + option + '.zip'))
        .on('finish', function () {
            statuses[option] = READY;
            saveTimestamp(option, 'files/' + option + '.zip');
        });
    }
}

function saveTimestamp(option, path){
    var GenerateFileLog = mongoose.model('GenerateFileLog');
    var update = {
        timestamp: new Date(),
    };
    GenerateFileLog.update({model: option}, update, {upsert: true}).exec();
}

/** This is responsible for writing the file with the StackOverflow data. This is
* considered a 'private' method and all the write methods depend on it. All files
* generated with this method will be saved on the folder 'files/'.
*
* @param {String} modelName - The Model that will be exported.
* @param {boolean|Array} headers - If true, each attribute will be a header in the
    tsv file. If array, each entry will be a header and the other attributes will
    be ignored.
* @param {function} transform - The callback to transform the data. If none, the
    data will be saved the way it was read.
* @param {String} fileName - The name of the generated file. Default is the model name.
* @param {String} items - The items that should be included or excluded when fetching
    the database.
* @param {Object} filter - The filter to the database query.
* @param {String} populate - The fields that will be populated when fetching from
    the database.
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
        statuses[fileName] = READY;
    });
}
function writeBugzillaHistory(){
    var headers = ['bugId', 'who', 'removed', 'added', 'what', 'when']
    var modelName = 'BugzillaHistory';
    var fileName = 'BugzillaBugsHistory.tsv';
    var transform = function (row) {
        return row;
    }

    writeFile(modelName, headers, transform, fileName);
}

function writeBugzillaComments(){
    var headers = ['bugId', 'commentNumber', 'service', 'comment', 'date']
    var modelName = 'BugzillaComment';
    var fileName = 'BugzillaBugsComments.tsv';
    var transform = function (row) {
        return row;
    }

    writeFile(modelName, headers, transform, fileName);
}

function writeBugzillaBugs(){
    var headers = ['_id', 'service', 'component', 'title', 'body', 'status',
      'author', 'asignee', 'ccUsers', 'platform', 'product', 'classification',
      'version', 'severity', 'op_sys', 'url', 'createdAt']

    var transform = function (row) {
        row.createdAt = row.bugId.createdAt;
        if(row.bugId.body){
            row.body = row.bugId.body
              .replace(/\t/g, '        ');
            row.body = row.bugId.body
              .replace(/(?:\r\n|\r|\n)/g, '                ');
            row.body = row.bugId.body
              .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
        }
        row.status = row.bugId.status;
        row.author = row.bugId.author;
        row.title = row.bugId.title;
        row.url = row.bugId.url;

        return row;
    }

    var modelName = 'BugzillaBug';

    var fileName = 'Bugs.tsv';

    writeFile(modelName, headers, transform, fileName, '-updatedAt -__v',
      {}, 'bugId');
}


/** This calls the 'writeFile' with the right parameters to export issues to file.
*
* @param {boolean} isPR - If true, will fetch only Pull Requests from the database.
**/
function writeIssues(isPR = false){
    var headers = ['_id', 'projectId', 'number', 'title',
      'body', 'labels', 'status', 'reporterLogin',
      'assigneesLogins', 'createdAt', 'url'];

    var transform = function (row) {
        if(row.bug){
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
        } else {
            return {};
        }
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

/** This calls the 'writeFile' with the right parameters to export issue comments.
**/
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

/** This calls the 'writeFile' with the right parameters to export commits.
**/
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

/** This calls the 'writeFile' with the right parameters to export commit comments.
**/
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
* 'Answers.tsv' and 'Questions.tsv' and are on the 'files/' folder. This is simillar
* to writeFile, but it needs two streams to save both answers and questions.
*
* @todo Maybe reimplement this to use writeFile. Use one function to answers
    and another to questions.
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

/** This calls the 'writeFile' with the right parameters to export developers.
**/
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
