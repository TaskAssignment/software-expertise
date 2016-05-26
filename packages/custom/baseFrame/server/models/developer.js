'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongooseToCsv = require('mongoose-to-csv');

var DeveloperSchema = new Schema({
    name: String,
}, {
    timestamps: true
});
