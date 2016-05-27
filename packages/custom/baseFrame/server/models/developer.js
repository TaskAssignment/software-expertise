'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongooseToCsv = require('mongoose-to-csv');

var DeveloperSchema = new Schema({
    name: String, //For now, this will be the GH username or the SO display_name
}, {
    timestamps: true
});

mongoose.model('Developer', DeveloperSchema);
