var application_root = __dirname,
    express = require("express"),
    path = require("path"),
    mongoose = require("mongoose"),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    nodemailer = require('nodemailer'),
    CronJob = require('cron').CronJob,
    fs = require('fs-extra'), // File System - for file manipulation
    busboy = require('connect-busboy'), //middleware for form/file upload
    clickatell = require('node-clickatell'); //SMS

var app = express();

//Config
app.use(bodyParser.json());

//require file with routes
require('./routes')(express, app, path);

//require file with methods/api, access to database
require('./method')(express, app, mongoose, path, nodemailer, CronJob, fs, busboy, clickatell);

//Launch server
/*app.listen(4242, function(){
  console.log("Connected to server, port 4242.");
});*/

// launch server with ngrok
//https://e5230151.ngrok.io/
app.listen(8080, function(){
  console.log("Connected to server, port 8080.");
});

module.exports = app;