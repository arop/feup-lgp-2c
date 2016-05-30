module.exports = function (express, app, mongoose, path, nodemailer, CronJob, fs, busboy, clickatell, oauth2, outlook) {
    var Finder = require('fs-finder');
    var CryptoJS = require("crypto-js");
    var leapYear = require('leap-year');
    var crypto = require('crypto');
    var FB = require('fb');
    var FBPromise = require('promise-facebook');

    //Database
    //mongoose.connect('mongodb://localhost/iTBirthday'); // change name of database , local database at the moment
    mongoose.connect('mongodb://lgpteamc:lgp201516@ds036069.mlab.com:36069/itbirthday');

    var db = mongoose.connection;
    db.on('error', console.error.bind(console, '[MONGOOSE] Database Connection Error'));
    db.once('open', function () {
        console.log("[MONGOOSE] Connected to Database");
    });

    var click = new clickatell({
        user: 'lgp2teamc',
        password: 'XTeBGUdJMHSLXS',
        api_id: '3600150'
    });

    //Nodemailer
    var transporter = nodemailer.createTransport("SMTP", {
        service: "gmail",
        auth: {
            user: "lgp2.teamc@gmail.com",
            pass: "lgp2teamc"
        }
    });

    var redirectUri = "http://localhost:8080/authorize";

    var scopes = ["openid",
        "https://outlook.office.com/calendars.readwrite",
        "profile"];


    /*************** SCHEMAS **********************************/

    var AdminSchema = new mongoose.Schema({
        username: {type: String, trim: true, required: true},
        password: {type: String, trim: true, required: true, minlength: 64, maxlength: 64}
    });

    var employeeGender = 'Male Female'.split(' ');

    var EmployeeSchema = new mongoose.Schema({
        name: {type: String, trim: true, required: true},
        birthDate: {type: Date, required: true},
        phoneNumber: {type: String, minlength: 9, maxlength: 9, required: true, trim: true, unique: true},
        email: {
            type: String,
            required: true,
            match: [/^[a-zA-Z0-9_.-]*@[a-zA-Z0-9_.-]*.[a-zA-Z0-9_.-]*/],
            trim: true,
            unique: true
        },
        entryDate: {type: Date, required: true, default: Date.now},
        exitDate: {type: Date, required: false},
        sendMail: {type: Boolean, required: true, default: false},
        mailText: {type: String, required: false, trim: true},
        sendPersonalizedMail: {type: Boolean, required: false, default: false},
        sendSMS: {type: Boolean, required: true, default: false},
        smsText: {type: String, required: false, trim: true},
        sendPersonalizedSMS: {type: Boolean, required: false, default: false},
        facebookPost: {type: Boolean, required: true, default: false},
        photoPath: {type: String, required: false, trim: true},
        gender: {type: String, enum: employeeGender, required: true, trim: true}
    });

    EmployeeSchema.virtual('age').get(function () {
        return dateDiffInYears(this.birthDate, new Date());
    });

    EmployeeSchema.virtual('daysSpent').get(function () {
        if (this.exitDate) return dateDiffInDays(this.entryDate, this.exitDate);
        else return dateDiffInDays(this.entryDate, new Date());
    });

    EmployeeSchema.virtual('yearsSpent').get(function () {
        if (this.exitDate) return dateDiffInYears(this.entryDate, this.exitDate);
        else return dateDiffInYears(this.entryDate, new Date());
    });

    var EmailTemplateSchema = new mongoose.Schema({
        text: {type: String, required: true, trim: true},
        path: {type: String, required: true, trim: true}
    });

    var SMSTemplateSchema = new mongoose.Schema({
        text: {type: String, required: true, trim: true}
    });

    var FacebookTemplateSchema = new mongoose.Schema({
        text: {type: String, required: true, trim: true}
    });

    var FacebookSchema = new mongoose.Schema({
        appId: {type: String, required: false, trim: true, unique: true},
        appSecret: {type: String, required: false, trim: true, unique: true},
        userID: {type: String, required: false, trim: true, unique: true},
        token: {type: String, required: false, trim: true},
        expirationDate: {type: Date, required: false}
    });

    var OutlookSchema = new mongoose.Schema({
        token: {type: String, required: false, trim: true},
        expirationDate: {type: Date, required: false}
    });

    //Create the Models
    var Admin = mongoose.model('Admin', AdminSchema);
    var Employee = mongoose.model('Employee', EmployeeSchema);
    var Facebook = mongoose.model('Facebook', FacebookSchema);
    var Outlook = mongoose.model('Outlook', OutlookSchema);
    var EmailTemplate = mongoose.model('EmailTemplate', EmailTemplateSchema);
    var SMSTemplate = mongoose.model('SMSTemplate', SMSTemplateSchema);
    var FacebookTemplate = mongoose.model('FacebookTemplate', FacebookTemplateSchema);

    /******************** LOGIN AND SESSION ***************/

    app.post('/check_login', function (req, res) {
        var query = Admin.findOne({'username': req.body.username, 'password': req.body.password});
        query.exec(function (err, result) {
            if (!err) {
                if (result) {
                    console.log('[MONGOOSE] Found Admin Login');
                    var date = new Date();
                    var cookie = CryptoJS.AES.encrypt("" + result._id + "/" + date.toJSON(), "1234567890");
                    res.json(cookie.toString());
                } else {
                    console.error('[MONGOOSE] Did not find Admin Login');
                    res.status(500).json('[MONGOOSE] Did not find Admin Login');
                }
            } else {
                console.error('[MONGOOSE] Error in checkLogin: ' + err);
                res.status(500).json('[MONGOOSE] Error in checkLogin: ' + err);
            }
        });
    });

    app.get('/Session/:cookie(*)', function (req, res) {
        var cook = CryptoJS.AES.decrypt(req.params.cookie, "1234567890").toString(CryptoJS.enc.Utf8);
        cook = cook.split("/");

        var id = cook[0];

        var date = new Date(cook[1]);
        var date2 = new Date();
        var session = {username: ""};

        //if session can expire after some time
        //if((Math.abs(date - date2)/(1000 * 3600 * 4)) < 4){}
        Admin.find({_id: id}, function (err, docs) {
            if (err == null) {
                if (docs.length == 0) {
                }
                else {
                    //returns the session
                    session.username = docs[0].username;
                    res.json(session);
                }
            } else {
                console.log(err);
            }
        });
    });

    /****************** EMPLOYEES *************************/

    //Post of employee
    app.post('/post_employee', function (req, res) {
        var emp_temp = new Employee({
            name: req.body.name,
            birthDate: req.body.birthDate,
            phoneNumber: req.body.phoneNumber,
            email: req.body.email,
            entryDate: req.body.entryDate,
            sendMail: req.body.sendMail,
            sendSMS: req.body.sendSMS,
            facebookPost: req.body.facebookPost,
            gender: req.body.gender
        });

        if (req.body.mailText)
            emp_temp.mailText = req.body.mailText;
        if (req.body.smsText)
            emp_temp.smsText = req.body.smsText;
        if (req.body.photoPath) {
            emp_temp.photoPath = req.body.photoPath;
        }
        if (req.body.sendPersonalizedMail) {
            emp_temp.sendPersonalizedMail = req.body.sendPersonalizedMail;
        }
        if (req.body.sendPersonalizedSMS) {
            emp_temp.sendPersonalizedSMS = req.body.sendPersonalizedSMS;
        }

        emp_temp.save(function (err, emp) {
            if (err) {
                console.error(err);
                res.status(500).json('[MONGOOSE] Error inserting new Employee');
            }
            else {
                console.log("Employee inserted correctly");
                res.status(200).json(emp._id);
            }
        });
    });

    app.use(busboy());
    app.post('/save_image_employee/:id', function (req, res) {
        console.log("UPDATE");
        var fstream;
        //checks if a folder named 'images' exists in directory
        //if it does not exist, the folder is created
        if (!fs.existsSync(__dirname + '/images/')) {
            fs.mkdirSync(__dirname + '/images/');
        }
        //checks if a folder named 'employees' inside the folder 'images' exists in directory
        //if it does not exist, the folder is created
        if (!fs.existsSync(__dirname + '/images/employees/')) {
            fs.mkdirSync(__dirname + '/images/employees/');
        }

        req.pipe(req.busboy);
        req.busboy.on('file', function (fieldname, file, filename) {
            console.log("Uploading: " + filename);
            var new_name = crypto.createHash('md5').update(req.params.id).digest("hex");
            Employee.findOne({_id: req.params.id}, function (err, emp) {
                console.log(emp);
                if (!err) {
                    //removes previous image if it exists
                    var f = __dirname + '/images/employees/';

                    if (emp.photoPath != undefined) {
                        var files = Finder.from(f).findFiles(emp.photoPath);
                        if (files.length > 0)
                            fs.unlinkSync(files[0])
                    }
                }
            });
            //Path where image will be uploaded
            var ext = filename.substr(filename.indexOf('.'), filename.lenght);
            fstream = fs.createWriteStream(__dirname + '/images/employees/' + new_name + ext);
            file.pipe(fstream);
            fstream.on('close', function () {
                var photo = {photoPath: new_name + ext};
                //changes the value of the photoPath of the employee
                Employee.findOneAndUpdate({_id: req.params.id}, photo, function (err, emp) {
                });
                console.log("Upload Finished of " + new_name + ext);
                res.redirect('back');           //where to go next
            });
        });
    });

    //Update informations of the employee
    //Employee ID passed in the url
    app.post('/update_employee/:id', function (req, res) {
        //if exit date then sendMail,sendSMS and facebookPost will be false
        //No message will be sent
        if (req.body.exitDate != undefined) {
            req.body.sendMail = false;
            req.body.sendSMS = false;
            req.body.facebookPost = false;
            req.body.sendPersonalizedMail = false;
            req.body.sendPersonalizedSMS = false;
        }
        Employee.findOneAndUpdate({_id: req.params.id}, req.body, function (err, emp) {
            console.log("UPDATEIND");
            if (err) {
                console.error('[MONGOOSE] Error in updated employee: ' + err);
                res.status(500).json('[MONGOOSE] Error in updated employee: ' + err);
            } else {
                console.log('[MONGOOSE] Employee Updated');
                res.status(200).json('[MONGOOSE] Employee Updated');
            }
        })
    });

    app.get('/list_employees', function (req, res) {
        var query = Employee.find({}/*, 'name email exitDate photoPath'*/);
        query.exec(function (err, result) {
            if (!err) {
                if (result.length > 0) {
                    console.log('[MONGOOSE] Found all employees');
                } else {
                    console.log('[MONGOOSE] No employees to find');
                }
                res.status(200).json(result);
            } else {
                console.error('[MONGOOSE] ' + err);
                res.status(500).json('[MONGOOSE] ' + err);
            }
        });
    });

    app.post('/delete_employee', function (req, res) {
        Employee.findOne({'email': req.body.email}, function (err, emp) {
            console.log(emp);
            if (!err) {
                //removes previous image if it exists
                var f = __dirname + '/images/employees/';

                if (emp.photoPath != undefined) {
                    var files = Finder.from(f).findFiles(emp.photoPath);
                    if (files.length > 0)
                        fs.unlinkSync(files[0])
                }

                Employee.remove({'email': req.body.email}, function (err, result) {
                    if (!err) {
                        if (result) {
                            console.log('[MONGOOSE] Employee Deleted');
                            res.status(202).json('[MONGOOSE] Employee Deleted');
                        } else {
                            console.log('[MONGOOSE] Employee not found');
                            res.status(200).json('[MONGOOSE] Employee not found');
                        }
                    } else {
                        console.error('[MONGOOSE] Error deleting user: ' + err);
                        res.status(500).json(err);
                    }
                });
            }
        });
    });

    app.get('/employee_profile/:id', function (req, res) {
        var query = Employee.findOne({'_id': req.params.id});
        query.exec(function (err, result) {
            //TODO
            if (!err) {
                if (result) {
                    console.log('[MONGOOSE] Found employee');
                } else {
                    console.log('[MONGOOSE] Did not find employee');
                }
                res.status(200).json(result);
            } else {
                console.error('[MONGOOSE] Error finding user ' + err);
                res.status(500).json(err);
            }
        });
    });

    /****************** CRON ************************
     * * * * * *
     | | | | | |
     | | | | | +---- Day of the Week   (range: 0-6, 0 standing for Sunday)
     | | | | +------ Month of the Year (range: 0-11)
     | | | +-------- Day of the Month  (range: 1-31)
     | | +---------- Hour              (range: 0-23)
     | +------------ Minute            (range: 0-59)
     +-------------- Seconds           (range: 0-59)
     /********************CRON ***********************/

    new CronJob('1 * * * * *', function () {
        var month = new Date().getMonth();
        var day = new Date().getDate();
        var year = new Date().getFullYear();
        var query;

        // If it is no leap year ( no 29 of february )
        // and today is 28 of February
        // also sends mail to people which birthday is the next day
        if (!leapYear(year) && day == 28 && month == 1) {
            query = Employee.aggregate([
                {
                    $project: {
                        month: {$month: '$birthDate'},
                        day: {$dayOfMonth: '$birthDate'},
                        name: '$name',
                        email: '$email',
                        sendMail: '$sendMail',
                        mailText: '$mailText',
                        sendPersonalizedMail: '$sendPersonalizedMail',
                        sendSMS: '$sendSMS',
                        smsText: '$smsText',
                        sendPersonalizedSMS: '$sendPersonalizedSMS'
                    }
                },
                {
                    $match: {
                        $and: [
                            {month: new Date().getMonth() + 1},
                            {
                                $or: [
                                    {day: new Date().getDate()},
                                    {day: 28}
                                ]
                            }]
                    }
                }
            ]);
        } else {
            query = Employee.aggregate([
                {
                    $project: {
                        month: {$month: '$birthDate'},
                        day: {$dayOfMonth: '$birthDate'},
                        name: '$name',
                        email: '$email',
                        sendMail: '$sendMail',
                        mailText: '$mailText',
                        sendPersonalizedMail: '$sendPersonalizedMail',
                        sendSMS: '$sendSMS',
                        smsText: '$smsText',
                        sendPersonalizedSMS: '$sendPersonalizedSMS'
                    }
                },
                {
                    $match: {
                        $and: [
                            {month: new Date().getMonth() + 1},
                            {day: new Date().getDate()}]
                    }
                }
            ]);
        }

        query.exec(function (err, result) {
            if (err) {
                console.log(err);
                return;
            } else {
                for (var i = 0; i < result.length; i++) {
                    var template = "Happy Birthday"; // add template  text
                    if (result[i].sendPersonalizedMail) { //if employee has different template
                        template = result[i].mailText;
                    } else {

                    }

                    var mailOptions = {
                        from: 'lgp2.teamc@gmail.com', // <-- change this
                        to: result[i].email,
                        subject: "Happy Birthday", // TO be changed
                        text: "Happy Birthday", // TO be changed
                        html: '<b>' + template + '<b>' // TO be changed
                    }
                    //TODO uncomment to send email
                    /*
                     console.log(result[i].sendMail);
                     if ( result[i].sendMail) {
                     console.log("MAILING");
                     transporter.sendMail(mailOptions, function (error, info) {
                     if (error) {
                     return console.log(error);
                     }
                     console.log('Message sent: ' + info.response);
                     });
                     }*/
                    if (result[i].sendSMS) {
                        //TODO: get the default or personalized message
                        // SendSMSService("Happy Birthday", "+351" + result[i].phoneNumber);
                    }
                }
            }
        });
    }, null, true, 'Europe/London');

    function SendSMSService(message, destination) {
        click.sendmsg(message, [destination], function (res) {
            console.log(res);
        });
    }

    /************** STATISTICS *************************/

    app.get('/statistics', function (req, res) {
        var query = Employee.find({});
        query.exec(function (err, result) {
            if (!err) {
                if (result.length > 0) {
                    console.log('[MONGOOSE] Found all employees');
                    var stats = gatherStatistics(result);
                    res.status(200).json({
                        'MFRatio': {'Male': stats[0][0], 'Female': stats[0][1]},
                        'MFTotal': {'Male': stats[1][0], 'Female': stats[1][1]},
                        'BirthsByMonthRatio': {
                            'Jan': stats[2][0],
                            'Feb': stats[2][1],
                            'Mar': stats[2][2],
                            'Apr': stats[2][3],
                            'May': stats[2][4],
                            'Jun': stats[2][5],
                            'Jul': stats[2][6],
                            'Aug': stats[2][7],
                            'Sep': stats[2][8],
                            'Oct': stats[2][9],
                            'Nov': stats[2][10],
                            'Dec': stats[2][11]
                        },
                        'BirthsByMonthTotal': {
                            'Jan': stats[3][0],
                            'Feb': stats[3][1],
                            'Mar': stats[3][2],
                            'Apr': stats[3][3],
                            'May': stats[3][4],
                            'Jun': stats[3][5],
                            'Jul': stats[3][6],
                            'Aug': stats[3][7],
                            'Sep': stats[3][8],
                            'Oct': stats[3][9],
                            'Nov': stats[3][10],
                            'Dec': stats[3][11]
                        },
                        'AverageTime': stats[4],
                        'AgeGroups': {
                            '18to21': stats[5][0],
                            '21to25': stats[5][1],
                            '25to30': stats[5][2],
                            '30to40': stats[5][3],
                            '40+': stats[5][4]
                        },
                        'TotalEmployees': stats[6]
                    });
                } else {
                    console.log('[MONGOOSE] No employees to find');
                }
            } else {
                console.error('[MONGOOSE] ' + err);
                res.status(500).json('[MONGOOSE] ' + err);
            }
        });
    });

    function gatherStatistics(employees) {
        var statistics = [];
        var MFratio = [0, 0]; // Male Female
        var MFtotal = [0, 0];
        var birthByMonthTotal = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        var birthByMonthRatio = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        var averageTime = 0;
        var ageGroup = [0, 0, 0, 0, 0]; //18-24, 25-34, 35-44, 45-54, 55+
        var totalEmployees = employees.length;
        var activeEmployees = 0;
        for (var i = 0; i < totalEmployees; i++) {
            var person = employees[i];

            averageTime += person.daysSpent;

            if (!person.exitDate) {
                activeEmployees++;

                if (person.gender == "Male") MFtotal[0]++;
                else MFtotal[1]++;

                birthByMonthTotal[person.birthDate.getMonth()]++;

                var age = person.age;
                if (age >= 18 && age < 21) ageGroup[0]++;
                else if (age >= 21 && age < 25) ageGroup[1]++;
                else if (age >= 25 && age < 30) ageGroup[2]++;
                else if (age >= 30 && age < 40) ageGroup[3]++;
                else if (age >= 40) ageGroup[4]++;
            }
        }
        MFratio[0] = ((MFtotal[0] / activeEmployees) * 100).toFixed(1) + "%";
        MFratio[1] = ((MFtotal[1] / activeEmployees) * 100).toFixed(1) + "%";

        for (var i = 0; i < birthByMonthTotal.length; i++) {
            birthByMonthRatio[i] = ((birthByMonthTotal[i] / activeEmployees) * 100).toFixed(1) + "%";
        }

        statistics[0] = MFratio;
        statistics[1] = MFtotal;
        statistics[2] = birthByMonthRatio;
        statistics[3] = birthByMonthTotal;
        statistics[4] = Math.ceil(averageTime / totalEmployees);
        statistics[5] = ageGroup;
        statistics[6] = activeEmployees;
        return statistics;
    }

    app.get('/temp_window/:start/:end', function (req, res) {
        var start = req.params.start;
        var end = req.params.end;
        var query = Employee.find({});
        var returnResult = [];
        query.exec(function (err, result) {
            if (err) {
                console.log("[MONGOOSE] Error " + err);
                res.status(500).json(err);
            } else {
                for (var i = 0; i < result.length; i++) {
                    var person = result[i];
                    if (!person.exitDate) {
                        if (person.birthDate.getMonth() > start - 1 && person.birthDate.getMonth() < end - 1) {
                            returnResult[returnResult.length] = person;
                        }
                    }
                }
                res.status(200).json(returnResult);
            }
        });
    });

    /***************** SMS TEMPLATE ***********************/

    app.get('/sms_template', function (req, res) {
        var query = SMSTemplate.find({});
        query.exec(function (err, result) {
            if (err) {
                console.log('[MONGOOSE] Error ' + err);
            } else {
                res.status(200).json(result);
            }
        });
    });

    app.post('/update_sms_template', function (req, res) {
        var query = SMSTemplate.find({});
        SMSTemplate.update(query, {text: req.body.template}, function (err, result) {
            if (err) {
                console.log('[MONGOOSE] Error: ' + err);
                res.status(500).json(err);
            } else {
                res.status(200).json();
            }
        });
    });

    app.post('/post_sms_template', function (req, res) {
        var temp_sms = new SMSTemplate({
            text: req.body.text
        });

        temp_sms.save(function (err, emp) {
            if (err) {
                console.error(err);
                res.status(500).json('[MONGOOSE] Error inserting new SMS Template');
            }
            else {
                console.log("SMS Template inserted correctly");
                res.status(200).json(emp._id);
            }
        });

    });

    /******************** EMAIL TEMPLATE *************************/
    app.get('/email_template', function (req, res) {
        var query = EmailTemplate.find({});
        query.exec(function (err, result) {
            if (err) {
                console.log('[MONGOOSE] Error ' + err);
            } else {
                res.status(200).json(result);
            }
        });
    });

    app.post('/update_email_template', function (req, res) {
        var query = EmailTemplate.find({});
        EmailTemplate.update(query, {text: req.body.template}, function (err, result) {
            if (err) {
                console.log('[MONGOOSE] Error: ' + err);
                res.status(500).json(err);
            } else {
                res.status(200).json();
            }
        });
    });

    app.post('/post_email_template', function (req, res) {
        var temp_email = new EmailTemplate({
            text: req.body.text
        });

        temp_email.save(function (err, emp) {
            if (err) {
                console.error(err);
                res.status(500).json('[MONGOOSE] Error inserting new Email Template');
            }
            else {
                console.log("Email Template inserted correctly");
                res.status(200).json(emp._id);
            }
        });

    });

    /************************** FACEBOOK **************************/
    new CronJob('00 0-59 * * * *', function () {
        var month = new Date().getMonth();
        var day = new Date().getDate();
        var year = new Date().getFullYear();

        // if(day == 30) {
        //     var query = Facebook.find({}, 'token');
        //     query.exec(function(err, result) {
        //         if (err) {
        //             console.log('[MONGOOSE] Error: ' + err);
        //         } else {
        //             FB.setAccessToken(result[0].token);
        //             var body = "This is a test post";
        //             FB.api('/me/feed', 'post', { message: body }, function (res) {
        //                 if (!res || res.error) {
        //                     console.log(!res ? 'error occurred' : res.error);
        //                     return;
        //                 }
        //
        //                 console.log("Post ID: " + res.id);
        //             });
        //         }
        //     });
        // }

    }, null, true, 'Europe/London');

    app.post('/post_facebook_info', function (req, res) {
        var query = Facebook.find({});
        Facebook.update(query,
            {
                userID: req.body.userID,
                token: req.body.token
            },
            function (err, result) {
                if (err) {
                    console.log('[MONGOOSE] Error: ' + err);
                    res.status(500).json(err);
                } else {
                    console.log("Post Facebook info: Success");
                    tradeFacebookToken();

                    res.status(200).json();
                }
            });
    });

    function tradeFacebookToken() {
        var query = Facebook.find({});
        query.exec(function (err, result) {
            if (err) {
                console.log('[MONGOOSE] Error ' + err);
            } else {
                var facebookData = result[0];

                FB.api('oauth/access_token', {
                    grant_type: 'fb_exchange_token',
                    client_id: facebookData.appId,
                    client_secret: facebookData.appSecret,
                    fb_exchange_token: facebookData.token
                }, function (res) {
                    if (!res || res.error) {
                        console.log(!res ? 'error occurred' : res.error);
                        return;
                    }

                    var accessToken = res.access_token;
                    var expires = res.expires ? res.expires : 0;
                    var expirationDate = new Date();
                    expirationDate.setSeconds(expirationDate.getSeconds() + expires);

                    console.log("Token: " + accessToken);
                    console.log("Expires in: " + expirationDate);

                    saveFacebookLLToken(accessToken, expirationDate);
                });
            }
        });
    }

    function saveFacebookLLToken(token, expirationDate) {
        var query = Facebook.find({});
        Facebook.update(query,
            {
                token: token,
                expirationDate: expirationDate
            },
            function (err, result) {
                if (err) {
                    console.log('[MONGOOSE] Error: ' + err);
                    return false;
                } else {
                    console.log("Save Facebook LLToken: Success");
                    return true;
                }
            });
    }

    app.get('/get_facebook_login_status', function(req, res) {
        var query = Facebook.find({}, 'token');
        query.exec(function(err, result) {
            if (err) {
                console.log('[MONGOOSE] Error: ' + err);
                res.status(500).json(err);
            } else {
                FB.setAccessToken(result[0].token);
                FB.api('/me', function(response) {
                    console.log(JSON.stringify(response));
                });
                res.status(200).json();
            }
        });
    });

    app.get('/get_facebook_expiration_date', function(req, res) {
        var query = Facebook.find({}, 'expirationDate');
        query.exec(function(err, result) {
            if (err) {
                console.log('[MONGOOSE] Error: ' + err);
                res.status(500).json(err);
            } else {
                res.status(200).json(result[0].expirationDate);
            }
        });
    });

    app.post('/update_facebook_template', function (req, res) {
        var query = FacebookTemplate.find({});
        FacebookTemplate.update(query, {text: req.body.template}, function (err, result) {
            if (err) {
                console.log('[MONGOOSE] Error: ' + err);
                res.status(500).json(err);
            } else {
                res.status(200).json();
            }
        });
    });

    app.get('/facebook_template', function (req, res) {
        var query = FacebookTemplate.find({});
        query.exec(function (err, result) {
            if (err) {
                console.log('[MONGOOSE] Error ' + err);
            } else {
                res.status(200).json(result);
            }
        });
    });

    /************************** OUTLOOK ****************************/

    app.get('/update_calendar', function (req, res) {
        console.log('Getting token');
        var query = Outlook.find({});
        query.exec(function (err, tokenResult) {
            if (err) {
                console.log('[MONGOOSE]: ' + err);
            } else {
                var query = Employee.find({}, 'name birthDate');
                query.exec(function (err, result) {
                    if (!err) {
                        if (result.length > 0) {
                            console.log('[MONGOOSE] Found all employees');
                            for (var i = 0; i < result.length; i++) {
                                var person = result[i];
                                createEvent(person, tokenResult[0]);
                            }
                        } else {
                            console.log('[MONGOOSE] No employees to find');
                        }
                        res.status(200).json(result);
                    } else {
                        console.error('[MONGOOSE] ' + err);
                        res.status(500).json('[MONGOOSE] ' + err);
                    }
                });
            }
        });
    });

    function setOutlookToken(token) {
        var query = Outlook.find({});
        Outlook.update(query, {token: token}, function (err, result) {
            if (err) {
                console.log('[MONGOOSE] Error: ' + err);
                return false;
            } else {
                return true;
            }
        });
    }

    app.get('/authUrl', function (req, res) {
        var returnVal = oauth2.authCode.authorizeURL({
            redirect_uri: redirectUri,
            scope: scopes.join(" ")
        });
        console.log("Generated auth url: " + returnVal);
        res.status(200).json(returnVal);
    });

    var url = require('url');
    app.get('/authorize', function (req, res) {
        console.log("Request handler 'authorize' was called.");
        var url_parts = url.parse(req.url, true);
        var code = url_parts.query.code;
        console.log("Code: " + code);
        getTokenFromCode(code, tokenReceived, res);
    });

    function getTokenFromCode(auth_code, callback, response) {
        var token;
        oauth2.authCode.getToken({
            code: auth_code,
            redirect_uri: redirectUri,
            scope: scopes.join(" ")
        }, function (error, result) {
            if (error) {
                console.log("Access token error: ", error.message);
                callback(response, error, null);
            }
            else {
                token = oauth2.accessToken.create(result);
                console.log("Token created: ", token.token);
                callback(response, null, token);
            }
        });
    }

    function tokenReceived(res, error, token) {
        if (error) {
            console.log("Access token error: ", error.message);
        }
        else {
            setOutlookToken(token.token.access_token);
        }
    }

    function createEvent(person, tokenInfo) {
        var token = tokenInfo.token;
        console.log(tokenInfo.token);
        var email = 'lgptest@xiiiorg.onmicrosoft.com';
        console.log('Creatint event');
        if (token) {
            outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
            outlook.base.setAnchorMailbox(email);
            outlook.base.setPreferredTimeZone('Eastern Standard Time');

            var newEvent = {
                "Subject": "Aniversário de " + person.name,
                "Body": {
                    "ContentType": "HTML",
                    "Content": "Aniversário de " + person.name
                },
                "Start": {
                    "DateTime": "2016-05-27T00:00:00",
                    "TimeZone": "Eastern Standard Time"
                },
                "End": {
                    "DateTime": "2016-05-27T00:00:00",
                    "TimeZone": "Eastern Standard Time"
                },
                "Attendees": []
            };

            var userInfo = {
                email: 'lgptest@xiiiorg.onmicrosoft.com'
            };

            outlook.calendar.createEvent({token: token, event: newEvent, user: userInfo},
                function (error, result) {
                    if (error) {
                        console.log('createEvent returned an error: ' + error);
                    }
                    else if (result) {
                        console.log('Created Event with success');
                    }
                });
        }
    }

    /****************** UTILS ************************/

    var _MS_PER_DAY = 1000 * 60 * 60 * 24;

    function dateDiffInDays(a, b) {
        var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
        var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

        return Math.floor((utc2 - utc1) / _MS_PER_DAY);
    }

    function dateDiffInYears(a, b) {
        var today = b;
        var birthDate = a;
        var age = today.getFullYear() - birthDate.getFullYear();
        var m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    /*var facebookstuff = new Facebook({'appId':'thisisappid', 'appSecret':'thisisappsecret', 'token':'asdasdasdasdasdasdasd'});
     facebookstuff.save(function(err){if(err) console.log(err);});*/

    /*var facebookstuff = new Outlook({'token':'asdasdasdasdasdasdasd'});
     facebookstuff.save(function(err){if(err) console.log(err);});*/
}