'use stric';

//Module dependencies (following the Articles model)
var mongoose = require('mongoose');
var Tag = mongoose.model('Tag');
var config = require('meanio').loadConfig();
var _ = require('lodash');

var fs = require('fs');
var cf = require('crossfilter');
var d3 = require('d3');

module.exports = function (Tags){
    console.log('load data files 0/3');
    var coOccurrencesData;
    var fileName = 'coOccurrences.tsv';
    var coOccurrences;
    var tag1Filter;
    var tag2Filter;
    var coOccurrenceFilter;

    var commonUserDataCF;
    var commonUserFilter;
    var TagCountServices = {};
    var graphConfig;

    fs.readFile(fileName, 'utf8', function (err, result){
      if(err)  console.error(err);
      else {
        result = d3.tsv.parse(result);
        console.log('load data files 1/3');
        coOccurrencesData = result;
        coOccurrences = cf(result);
        tag1Filter = coOccurrences.dimension(function(d) { return d; });
        coOccurrenceFilter = coOccurrences.dimension(function(d) { return d.CoOccurrence; });
        coOccurrenceFilter.filter( function(d){ return d >= 10; } );
        fs.readFile('tags.tsv', 'utf8', function (err, result){
          if(err) console.error(err);
          else {
            var convertResults = d3.tsv.parse(result);

            console.log('load data files 2/3');
            for(var i = 0; i < convertResults.length; i++){
              var tag = convertResults[i];
              TagCountServices[tag.TagName] = tag.Count
            }
            fs.readFile('commonUsers.tsv', 'utf8', function(err, result){
              if(err) console.error(err);
              else {
                var commonUserResult = d3.tsv.parse(result);
                console.log('load data files 3/3');

                //Save this to Database!!!
                commonUserDataCF = cf(commonUserResult);
                commonUserFilter = commonUserDataCF.dimension(function(d) { return d.login; });
              }
            });
          }
        });
      }
    });

    return {
        soTags: function(req,res,next){
            res.send(JSON.stringify(TagCountServices));
        },

        soIDFromUser: function(req, res, next){
            if(req.body.getAll === 'true'){
                commonUsers.filter(null);
            } else {
                commonUserFilter.filter(req.body.gitName);
            }
            res.send(JSON.stringify(commonUserFilter.top(Infinity)));
        },

        coOccurrence: function (req, res, next) {
            var stringRes = '';
            if (req.body['getEverything'] === 'true'){

                 tag1Filter.filter(null);

                 var f1Data =tag1Filter.top(Infinity);

              res.send(JSON.stringify(f1Data));
              tag1Filter.filter();

            } else {
              var tagsToFilter = [];
              // console.log(req.body);
              for(var key in req.body) {
                  if(req.body.hasOwnProperty(key))
                  {
                      tagsToFilter = req.body[key];
                  }
              }
              //These tags come from 'displayIssueTags' on repository.js
              console.log(tagsToFilter);

              tag1Filter.filter(function(d,i){
                  if(tagsToFilter.indexOf(d.Tag1) !== -1 &&
                      tagsToFilter.indexOf(d.Tag2) !== -1){
                      return true;
                  } else {
                      return false;
                  }
              });

              var f1Data = tag1Filter.top(Infinity);
              console.log(f1Data);


              res.send(JSON.stringify(f1Data));
              tag1Filter.filter();
            }

        }
    }
}
