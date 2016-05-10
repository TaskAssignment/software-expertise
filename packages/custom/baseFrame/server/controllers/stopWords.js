'use strict';

var mongoose = require('mongoose');
var StopWord = mongoose.model('StopWord');

var fs = require('fs');

module.exports = function (BaseFrame) {
    return {
        populateStopWords: function(req, res){
            var folder = 'files/stopwords/';
            fs.readdir(folder, function (err, files){
                var stopwords = [];

                for(var i in files){
                    var file = files[i];
                    // reading syncronous to make only one database request
                    var data = fs.readFileSync(folder + file, 'utf8');
                    var words = data.split(',');

                    for(var j in words){
                        var stopword = {}
                        stopword['word'] = words[j];

                        stopwords.push(stopword);
                    }
                }

                StopWord.create(stopwords, function(err){
                    if(err){
                        console.log(err.message);
                    }else{
                        console.log('Stop Words saved successfully!');
                    }
                });
                res.sendStatus(200);
            });
        },
    }
}
