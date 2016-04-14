var application_root = __dirname,
    express = require("express"),
    path = require("path"),
    mongoose = require("mongoose"),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    nodemailer = require('nodemailer'),
    CronJob = require('cron').CronJob;

var app = express();

//Config
app.use(bodyParser.json());

//require file with routes
require('./routes')(express, app, path);

//require file with methods/api, access to database
require('./method')(express, app, mongoose, path, nodemailer, CronJob);

//Launch server
app.listen(4242, function(){
  console.log("Connected to server");
});

module.exports = app;
