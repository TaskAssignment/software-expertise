'use strict';

var mongoose = require('mongoose');
var Developer = mongoose.model('Developer');

var request = require('request');

module.exports = function (BaseFrame){
    return {
        /** Looks for the given user (req.params) in the database.
        *
        * @param req - Express request
        * @param res - Express response
        **/
        find: function (req, res){
            var filter = {
                'ghProfile.repositories': req.params.projectId
            };

            var soAssigned = JSON.parse(req.query.soAssigned);
            if(soAssigned){
                filter.soProfile = { $exists: true };
            }

            Developer.find(filter).sort('-updatedAt').exec(function (err, users){
                res.send(users);
            });
        },

        /** Populates all the user tags from stackoverflow using the
        * stackOverflowRequest function.
        *
        * @param req - Express request.
        * @param res - Express response.
        **/
        populateTags: function (req, res){
            /** Filter is generated by stackexchange api. This one includes
            * count, name. Page and total are added to .wrapper fields.
            * To understand better how this works, check
            *https://api.stackexchange.com/docs/tags-on-users#pagesize=100&order=desc&sort=popular&ids=696885&filter=!4-J-dtwSuoIA.NOpA&site=stackoverflow
            **/
            var url = '/tags?pagesize=100&order=desc&sort=popular&site=stackoverflow&filter=!4-J-dtwSuoIA.NOpA';
            var tags = [];
            var Tag = mongoose.model('Tag');

            var findTags = function (tag){
                Tag.findOne({_id: tag._id}, function (err, dbTag){
                    if(dbTag){
                        tag.soCount = dbTag.soTotalCount;
                    } else {
                        //TODO: Change this to fetch the count from SO
                        tag.soCount = tag.count;
                    }
                    tags.push(tag);
                });
            }

            var buildModels = function(items){
                for(var i in items){
                    var result = items[i];
                    var tag = {
                        _id: result.name,
                        count: result.count
                    };
                    findTags(tag);
                }

                return {
                    dataSet: "tags",
                    models: tags
                }
            }

            stackOverflowRequest(url, req.params, res, buildModels);
        },

        /** Populates all the user answers from stackoverflow using the
        * stackOverflowRequest function.
        *
        * @param req - Express request.
        * @param res - Express response.
        **/
        populateAnswers: function (req, res){
            var url = '/answers?pagesize=100&order=desc&sort=activity&site=stackoverflow&filter=!)s1i5t90HOwF9alAsofL';

            var buildModels = function(items){
                var answers = [];
                for(var i in items){
                    var result = items[i];
                    var question = {
                        _id: result.answer_id,
                        questionId: result.question_id,
                        body: result.body,
                        score: result.score,
                        tags: result.tags,
                        createdAt: result.creation_date * 1000,
                        updatedAt: result.last_activity_date * 1000
                    };
                    answers.push(question);
                }

                return {
                    dataSet: "answers",
                    models: answers
                }
            }

            stackOverflowRequest(url, req.params, res, buildModels);
        },

        /** Populates all the user questions from stackoverflow using the
        * stackOverflowRequest function.
        *
        * @param req - Express request.
        * @param res - Express response.
        **/
        populateQuestions: function (req, res){
            var ids = req.params;

            var url = '/questions?pagesize=100&order=desc&sort=activity&site=stackoverflow&filter=!4(Yr)(WQUnLoVCneu';

            var buildModels = function(items){
                var questions = [];
                for(var i in items){
                    var result = items[i];
                    var question = {
                        _id: result.question_id,
                        title: result.title,
                        body: result.body_markdown,
                        score: result.score,
                        tags: result.tags,
                        createdAt: result.creation_date * 1000,
                        updatedAt: result.last_activity_date * 1000
                    };
                    questions.push(question);
                }

                return {
                    dataSet: "questions",
                    models: questions
                }
            }

            stackOverflowRequest(url, req.params, res, buildModels);
        }
    }

    /** This function should be used to do any StackOverflow requests. It
    * represents the basic flow to the StackExchange API. It retrives the
    * data and stores in the database. It checks for pagination following the
    * StackExchange pattern.
    *
    * @param specificUrl - The baseUrl for the request is api.stackexchange.com.
        The specificUrl is the part after the user id. It will be something like
        /questions?pagesize... . It's important that there is no page specified
        in it. The pagination will be added as needed.
    * @param ids - An object with soId and userId to use in the model building.
    * @param res - The express response to be sent after the data is fetched.
    * @param callback - A callback to build the models. Because every model has
        different items and saving methods, this should be built in the Express
        function that calls this request.
    **/
    function stackOverflowRequest(specificUrl, ids, res, callback){
        //TODO: Change this ids to soId only!!
        var url = 'https://api.stackexchange.com/2.2/users/' + ids.soId +
            specificUrl + '&key=unaHxXqTCHJ5Ve6AfnIJGg((';

        /* StackOverflow requests are compressed, if this is not set, the data
        * won't be readable.
        **/
        var options = {
            headers: {
                'Accept-Encoding': 'gzip'
            },
            gzip: true,
            url: url
        };

        var requestCallback = function (error, response, body){
            if (!error && response.statusCode == 200) {
                var results = JSON.parse(body);
                console.log('Page ' + results.page);

                var build = callback(results.items);

                Developer.findOne({'soProfile._id': ids.soId}, '_id soProfile', function(err, user){
                    if(err){
                        console.log(err.message);
                    }else{
                        var soProfile = user.soProfile;
                        soProfile[build.dataSet] = build.models;
                        soProfile.soPopulated = true;

                        user.soProfile = soProfile;
                        user.save(function (newErr){
                            if(newErr){
                                console.log(newErr.message)
                            } else {
                                if(!res.headersSent){
                                    res.sendStatus(200);
                                }
                                console.log('User updated successfully!');
                            }
                        });
                    }
                });

                //Check for next page
                if(results.has_more){
                    var new_url = url + '&page=' + (parseInt(results.page) + 1);
                    options.url = new_url;
                    request(options, requestCallback);
                }

            } else {
                console.log(body);
                if(!res.headersSent){
                    res.status(500).send(body);
                }
            }
        }

        request(options, requestCallback);
    }
}
