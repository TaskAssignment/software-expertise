'use strict';

var request = require('request');

var populated = {
    Tag: {
        status: NOT_READY,
        linesRead: 0
    },
    CoOccurrence: {
        status: NOT_READY,
        linesRead: 0
    },
    Issue: {
        status: NOT_READY,
        linesRead: 0
    },
    Developer: {
        status: NOT_READY,
        linesRead: 0
    },
    Commit: {
        status: NOT_READY,
        linesRead: 0
    },

}

var gitHubPopulate = function (specificUrl, callback){
    var uri = 'https://api.github.com/' + specificUrl
    if(specificUrl.lastIndexOf('?') < 0){
        uri += '?per_page=100'; //If there is no query it has to have the question mark
    } else {
        uri += '&per_page=100';
    }
    var options = {
        headers: {
            'User-Agent': 'software-expertise',
            Accept: 'application/vnd.github.v3+json'
        },
        uri: uri,
        auth:{
            bearer: 'ab441f93f9d317b41966cc8b75d8531629036039'
        }
    };

    var requestCallback = function (error, response, body){
        if (!error && response.statusCode == 200) {
            var results = JSON.parse(body);

            // callback(results);
            var links = response.headers.link || [];

            var next = undefined;


            for(var link of links.split(',')){
                if(link.lastIndexOf('next') > 0){
                    next = link;
                }
            }

            if(next){
                var begin = next.indexOf('<');
                var end = next.indexOf('>');

                //This gets string = [begin, end)
                var new_uri = next.substring(begin + 1, end);

                options.uri = new_uri;
                request(options, requestCallback);
            }
        } else {
            console.log(body, error)
        }
    }

    request(options, requestCallback);
};

var soPopulate = function (specificUrl, callback) {
    var uri = 'https://api.stackexchange.com/2.2/' + specificUrl +
      '&pagesize=100&order=desc&pagesize=100&key=unaHxXqTCHJ5Ve6AfnIJGg((';

    var options = {
        headers: {
            'Accept-Encoding': 'gzip'
        },
        gzip: true,
        uri: uri
    };

    var requestCallback = function (error, response, body){
        if (!error && response.statusCode == 200) {
            var results = JSON.parse(body);
            callback(results.items);

            //Check for next page
            if(results.has_more){
                var new_uri = uri + '&page=' +
                  (parseInt(results.page) + 1);
                options.uri = new_uri;
                request(options, requestCallback);
            }

        } else {
            console.log(body, error);
        }
    }

    request(options, requestCallback);
}

module.exports = function (BaseFrame) {
    return {
        GitHub: gitHubPopulate,
        StackOverflow: soPopulate
    }
}
