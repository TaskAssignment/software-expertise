/* jshint -W079 */
/* Related to https://github.com/linnovate/mean/issues/898 */
'use strict';

/**
 * Module dependencies.
 */
var expect = require('expect.js'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Article = mongoose.model('Article');

/**
 * Globals
 */
var user;
var article;

var https = require('https');
var http = require('http');
/**
 * Test Suites
 */
describe('<Unit Test>', function() {
  describe('Model Article:', function() {
    beforeEach(function(done) {
      this.timeout(10000);
      user = new User({
        name: 'Full name',
        email: 'test@test.com',
        username: 'user',
        password: 'password'
      });
      user.save(function() {
        article = new Article({
          title: 'Article Title',
          content: 'Article Content',
          user: user
        });
        done();
      });


  });
  describe('api test for jacard',function(){
      it('shoud get 0.05:' , function(){
          var getReqOptions = {
              host : 'localhost',
              port:3000,
            //   protocol:'https:',
              method: 'POST',

              path : '/api/baseFrame/getSimilarity?' + 'directed=false&' +
                 'soWeight=linear&' +
                 'similarity=cosine&' +
                 'comparisonType=textToDev&' +
                 'textA=hi%20I%20am%20r%20this%20r.js%20function&' +
                 'userName=mbostock&'+
                 'repoName=mbostock/d3',
              headers: {
                  'Content-Type':'application/x-www-form-urlencoded'
              }
          }
          var gitReq = http.get(getReqOptions, function(results){
              // Buffer the body entirely for processing as a whole.

               var bodyChunks = '';
               results.on('data', function(chunk) {
                 // You can process streamed parts here...
                 bodyChunks+= chunk;
               }).on('end', function() {
              //    var body = Buffer.concat(bodyChunks);
                  var similarity = JSON.parse(bodyChunks);

                  expect(similarity.slice(0,5)).to.be('0.05');


                });


                 // ...and/or process the entire body here.
          })
      })
      it('shoud get 0.05:' , function(){
              var getReqOptions = {
                  host : 'localhost',
                  port:3000,
                //   protocol:'https:',
                  method: 'POST',

                  path : '/api/baseFrame/getSimilarity?' + 'directed=false&' +
                     'soWeight=linear&' +
                     'similarity=cosine&' +
                     'comparisonType=textToText&' +
                     'textA=hi%20I%20am%20r%20java&' +
                     'textB=hi%20I%20am%20r%20c'
                     ,
                  headers: {
                      'Content-Type':'application/x-www-form-urlencoded'
                  }
              }
              var gitReq = http.get(getReqOptions, function(results){
                  // Buffer the body entirely for processing as a whole.

                   var bodyChunks = '';
                   results.on('data', function(chunk) {
                     // You can process streamed parts here...
                     bodyChunks+= chunk;
                   }).on('end', function() {
                  //    var body = Buffer.concat(bodyChunks);
                      var similarity = JSON.parse(bodyChunks);

                      expect(similarity.slice(0,5)).to.be('0.05');


                    });


                     // ...and/or process the entire body here.
              })
          })

    })
    describe('Method Save', function() {

      it('should be able to save without problems', function(done) {
        this.timeout(10000);

        return article.save(function(err, data) {
          expect(err).to.be(null);
          expect(data.title).to.equal('Article Title');
          expect(data.content).to.equal('Article Content');
          expect(data.user.length).to.not.equal(0);
          expect(data.created.length).to.not.equal(0);
          done();
        });

      });

      it('should be able to show an error when try to save without title', function(done) {
        this.timeout(10000);
        article.title = '';

        return article.save(function(err) {
          expect(err).to.not.be(null);
          done();
        });
      });

      it('should be able to show an error when try to save without content', function(done) {
        this.timeout(10000);
        article.content = '';

        return article.save(function(err) {
          expect(err).to.not.be(null);
          done();
        });
      });

      it('should be able to show an error when try to save without user', function(done) {
        this.timeout(10000);
        article.user = null;

        return article.save(function(err) {
          expect(err).to.not.be(null);
          done();
        });
      });

    });

    afterEach(function(done) {
      this.timeout(10000);
      article.remove(function() {
        user.remove(done);
      });
    });
  });
});
