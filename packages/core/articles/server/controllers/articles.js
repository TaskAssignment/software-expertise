'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Article = mongoose.model('Article'),
    config = require('meanio').loadConfig(),
    _ = require('lodash');

module.exports = function(Articles) {

    return {
        /**
         * Find article by id
         *
         * @param req - the required credentials
         * @param res - the result 
         * @param next
         * @param id - the id of an article
         */
        article: function(req, res, next, id) {
            Article.load(id, function(err, article) {
                if (err) return next(err);
                if (!article) return next(new Error('Failed to load article ' + id));
                req.article = article;
                next();
            });
        },
        /**
         * Create an article
         *
         * @param req - the required credentials to create an article
         * @param res - the result 
         */
        create: function(req, res) {
            var article = new Article(req.body);
            article.user = req.user;

            article.save(function(err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot save the article'
                    });
                }

                Articles.events.publish({
                    action: 'created',
                    user: {
                        name: req.user.name
                    },
                    url: config.hostname + '/articles/' + article._id,
                    name: article.title
                });

                res.json(article);
            });
        },
        /**
         * Update an article
         *
         * @param req - the required credentials to create an article
         * @param res - the result 
         */
        update: function(req, res) {
            var article = req.article;

            article = _.extend(article, req.body);


            article.save(function(err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot update the article'
                    });
                }

                Articles.events.publish({
                    action: 'updated',
                    user: {
                        name: req.user.name
                    },
                    name: article.title,
                    url: config.hostname + '/articles/' + article._id
                });

                res.json(article);
            });
        },
        /**
         * Delete an article
         *
         * @param req - the required credentials to delete an article
         * @param res - the result 
         */
        destroy: function(req, res) {
            var article = req.article;


            article.remove(function(err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot delete the article'
                    });
                }

                Articles.events.publish({
                    action: 'deleted',
                    user: {
                        name: req.user.name
                    },
                    name: article.title
                });

                res.json(article);
            });
        },
        /**
         * Show an article
         *
         * @param req - the required credentials to show an article
         * @param res - the result 
         */
        show: function(req, res) {

            Articles.events.publish({
                action: 'viewed',
                user: {
                    name: req.user.name
                },
                name: req.article.title,
                url: config.hostname + '/articles/' + req.article._id
            });

            res.json(req.article);
        },
        /**
         * List of Articles
         *
         * @param req - the required credentials to show an article
         * @param res - the result 
         */
        all: function(req, res) {
            var query = req.acl.query('Article');

            query.find({}).sort('-created').populate('user', 'name username').exec(function(err, articles) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot list the articles'
                    });
                }

                res.json(articles)
            });

        }
    };
}