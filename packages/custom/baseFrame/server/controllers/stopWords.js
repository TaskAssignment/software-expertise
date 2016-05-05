'use strict';

var mongoose = require('mongoose');
var StopWord = mongoose.model('StopWord');

var fs = require('fs');

module.exports = function (BaseFrame) {
    return {
        populateStopWords: function(req, res){
            var folder = 'files/stopwords/';
            fs.readdir(folder, function (err, files){
                for(var i in files){
                    var file = files[i];
                    fs.readFile(folder + file, 'utf8', function(err, data){
                        if(err) {
                            console.log(err);
                            return res.sendStatus(500);
                        }
                        //Get the words and remove last empty line
                        var words = data.split('\n').slice(0, -1);

                        var stopwords = [];
                        for(var j in words){
                            var stopword = {}
                            stopword['word'] = words[j];

                            stopwords.push(stopword);
                        }

                        StopWord.collection.insert(stopwords, function(err){
                            if(err){
                                console.log(err.message);
                            }else{
                                console.log('Stop Words saved successfully!');
                            }
                        });
                    });
                }
                res.sendStatus(200);
            });
        },
    }
}
