'use strict';

var mean = require('meanio');

module.exports = function(System){
    return {
        render:function(req,res){
            console.log(req.query);
            // console.log("=============== TESTE INDEX");
            res.render('index');
        },
        aggregatedList:function(req,res) {
            res.send(res.locals.aggregatedassets);
        }
    };
};
