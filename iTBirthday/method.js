module.exports = function(express, app, mongoose, path, nodemailer, CronJob, fs, busboy, clickatell, oauth2) {
    var Finder = require('fs-finder');
    var CryptoJS = require("crypto-js");
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

    var scopes = [ "openid",
                    "https://outlook.office.com/calendars.readwrite",
                    "profile" ];

    //Schemas
    var AdminSchema = new mongoose.Schema({
        username: {type: String, trim: true, required: true},
        password: {type: String, trim: true, required: true, minlength: 64, maxlength: 64}
    });

    var employeeGender = 'Male Female'.split(' ');

    var EmployeeSchema = new mongoose.Schema({
        name: {type: String, trim: true, required: true},
        birthDate: {type: Date, required: true},
        phoneNumber: {type: String, minlength: 9, maxlength: 9, required: true, trim: true, unique: true},
        email: {type: String, required: true, match: [/^[a-zA-Z0-9_.-]*@[a-zA-Z0-9_.-]*.[a-zA-Z0-9_.-]*/], trim: true, unique: true},
        entryDate: {type: Date, required: true, default: Date.now},
        exitDate: {type: Date, required: false},
        sendMail: {type: Boolean, required: true, default: false},
        mailText: {type: String, required: false, trim: true},
        sendSMS: {type: Boolean, required: true, default: false},
        smsText: {type: String, required: false, trim: true},
        facebookPost: {type: Boolean, required: true, default: false},
        photoPath: {type: String, required: false, trim: true},
        gender: {type: String, enum: employeeGender, required: true, trim: true}
    });

    EmployeeSchema.virtual('age').get(function () {
        var today = new Date();
        var birthDate = this.birthDate;
        var age = today.getFullYear() - birthDate.getFullYear();
        var m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    });

    EmployeeSchema.virtual('timeSpent').get(function() {
        if(this.exitDate) return dateDiffInDays(this.entryDate, this.exitDate);
        else return dateDiffInDays(this.entryDate, new Date());
    });

    var templateTypes = 'Email SMS Facebook'.split(' ');

    var EmailTemplateSchema = new mongoose.Schema({
        text: {type: String, required: true, trim: true},
        path: {type: String, required: true, trim: true}
    });

    var SMSTemplateSchema = new mongoose.Schema({
        text: {type: String, required: true, trim:true}
    });

    var FacebookTemplateSchema = new mongoose.Schema({
        text: {type: String, required: true, trim:true}
    });

    var FacebookSchema = new mongoose.Schema({
        appId: {type: String, required: false, trim: true, unique:true},
        appSecret: {type: String, required: false, trim: true, unique:true},
        token: {type: String, required: false, trim: true},
        expirationDate: {type: Date, required: false}
    });

    //Create the Models
    var Admin = mongoose.model('Admin', AdminSchema);
    var Employee = mongoose.model('Employee', EmployeeSchema);
    var Facebook = mongoose.model('Facebook', FacebookSchema);
    var EmailTemplate = mongoose.model('EmailTemplate', EmailTemplateSchema);
    var SMSTemplate = mongoose.model('SMSTemplate', EmailTemplateSchema);
    var FacebookTemplate = mongoose.model('FacebookTemplate', EmailTemplateSchema);

    function cleanAdmin() {
        Admin.remove({}, function (err) {
            if (err) {
                console.log('[MONGOOSE] Error deleting old date in Admin Doc: ' + err);
            } else {
                console.log('[MOGOOSE] Deleted all data in Admin');
            }
        });
    }

    function cleanEmployee() {
        Employee.remove({}, function (err) {
            if (err) {
                console.log('[MONGOOSE] Error deleting old date in Employee Doc ' + err);
            } else {
                console.log('[MOGOOSE] Deleted all data in Employee');
            }
        });
    }

    function cleanTemplate() {
        Template.remove({}, function (err) {
            if (err) {
                console.log('[MONGOOSE] Error deleting old date in Template Doc ' + err);
            } else {
                console.log('[MOGOOSE] Deleted all data in Template');
            }
        });
    }

    //Access to database

    function searchByName(param) {
        var query = Employee.find({name: new RegExp(param, "i")});
        query.exec(function (err, result) {
            if (!err) {
                if (result.length > 0) {
                    var resultStr = JSON.stringify(result, undefined, 2);
                    console.log(resultStr);
                } else {
                    console.log('[MONGOOSE] No Employees found! Length: ' + result.length);
                }
            } else {
                console.log('[MONGOOSE] Error in searchByName: ' + err);
            }
            ;
        });
    }

    //Post of employee
    app.post('/post_employee', function (req, res) {

        console.log(req.body);
        var emp_temp = new Employee({
            name: req.body.name,
            birthDate: req.body.birthDate,
            phoneNumber: req.body.phoneNumber,
            email: req.body.email,
            entryDate: req.body.entryDate,
            sendMail: req.body.sendMail,
            sendSms: req.body.sendSMS,
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
    app.post('/save_image_employee/:id',function (req, res) {
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

            //removes previous image if it exists
            var files = Finder.from("images/employees/").findFiles(req.params.id + '.*');
            fs.unlinkSync(files[0]);
            //Path where image will be uploaded
            var ext = filename.substr(filename.indexOf('.'),filename.lenght);
            fstream = fs.createWriteStream(__dirname + '/images/employees/' + req.params.id + ext);
            file.pipe(fstream);
            fstream.on('close', function () {
                var photo = { photoPath : req.params.id + ext };
                //changes the value of the photoPath of the employee
                Employee.findOneAndUpdate({_id: req.params.id},photo, function(err,emp) {
                });
                console.log("Upload Finished of " + req.params.id + ext);
                res.redirect('back');           //where to go next
            });
        });

    });


    //Update informations of the employee
    //Employee ID passed in the url
    app.post('/update_employee/:id', function (req, res) {
        //if exit date then sendMail,sendSMS and facebookPost will be false
        //No message will be sent
        if ( req.body.exitDate != undefined){
            req.body.sendMail = false;
            req.body.sendSMS = false;
            req.body.facebookPost = false;
        }
        Employee.findOneAndUpdate({_id: req.params.id}, req.body, function (err, emp) {
            console.log("UPDATEIND");
            if ( err ) {
                console.error('[MONGOOSE] Error in updated employee: ' + err);
                res.status(500).json('[MONGOOSE] Error in updated employee: ' + err);
            } else {
                console.log('[MONGOOSE] Employee Updated');
                res.status(200).json('[MONGOOSE] Employee Updated');
            }
        })
    });

    app.post('/check_login', function (req, res) {
        var query = Admin.findOne({'username': req.body.username, 'password': req.body.password});
        query.exec(function (err, result) {
            if (!err) {
                if (result) {
                    console.log('[MONGOOSE] Found Admin Login');
                    var  date = new Date();
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
        var cook = CryptoJS.AES.decrypt(req.params.cookie,"1234567890").toString(CryptoJS.enc.Utf8);
        cook = cook.split("/");

        var id = cook[0];

        var date = new Date(cook[1]);
        var date2 = new Date();
        var session = { username: ""};

        //if session can expire after some time
        //if((Math.abs(date - date2)/(1000 * 3600 * 4)) < 4){}
        Admin.find({_id : id},function (err, docs) {
            if (err == null) {
                if ( docs.length == 0 ) {
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

    app.get('/list_employees', function (req, res) {
        var query = Employee.find({}, 'name email exitDate photoPath');
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

    app.delete('/delete_employee/:email', function (req, res) {
        Employee.remove({'email': req.params.email}, function (err, result) {
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
    });

    app.get('/employee_profile/:id', function (req, res) {
        var query = Employee.findOne({'_id': req.params.id});
        query.exec(function (err, result) {
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

    //Example of the use of cron
    //Every day of the week at 15.05.00
    //Change to a convenient time
    //TODO see what to do to 29 February
    new CronJob('00 37 20 * * 1-7', function () {
        var query = Employee.find({
            $where: function () {
                return this.birthDate.getMonth() == new Date().getMonth() && this.birthDate.getDate() == new Date().getDate()
            }, sendMail: true
        });
        query.exec(function (err, result) {

            for (var i = 0; i < result.length; i++) {
                var template = "Happy Birthday"; // add template  text
                if (result[i].mailText) { //if employee has different template
                    template = result[i].mailText;
                }
                var mailOptions = {
                    from: 'lgp2.teamc@gmail.com', // <-- change this
                    to: result[i].email,
                    subject: "Happy Birthday", // TO be changed
                    text: "Happy Birthday", // TO be changed
                    html: '<b>' + template + '<b>' // TO be changed
                }
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: ' + info.response);
                });
                if(result[i].sendSMS){
                    // SendSMSService("Happy Birthday", "+351" + result[i].phoneNumber); //TO change to the message itself
                }

            }
        });
    }, null, true, 'Europe/London');

    function SendSMSService(message, destination) {
        click.sendmsg(message, [destination], function (res) {
            console.log(res);
        });
    }

    //TODO: get the default or personalized message
    app.get('/test_sms', function (req, res) {
        console.log("SENDING TEST SMS");
        //SendSMSService("HAPPY BIRTHDAY!", "+351962901682");
        res.status(200).json();
    });

    app.get('/statistics', function (req, res){
        var query = Employee.find({});
        query.exec(function (err, result) {
            if (!err) {
                if (result.length > 0) {
                    console.log('[MONGOOSE] Found all employees');
                    var stats = gatherStatistics(result);
                    res.status(200).json({'MFRatio':{'Male':stats[0][0], 'Female':stats[0][1]},
                        'MFTotal':{'Male':stats[1][0], 'Female':stats[1][1]},
                        'BirthsByMonthRatio':{'Jan':stats[2][0],'Feb':stats[2][1],'Mar':stats[2][2],'Apr':stats[2][3],'May':stats[2][4],'Jun':stats[2][5],
                            'Jul':stats[2][6],'Aug':stats[2][7],'Sep':stats[2][8],'Oct':stats[2][9],'Nov':stats[2][10],'Dec':stats[2][11]},
                        'BirthsByMonthTotal':{'Jan':stats[3][0],'Feb':stats[3][1],'Mar':stats[3][2],'Apr':stats[3][3],'May':stats[3][4],'Jun':stats[3][5],
                            'Jul':stats[3][6],'Aug':stats[3][7],'Sep':stats[3][8],'Oct':stats[3][9],'Nov':stats[3][10],'Dec':stats[3][11]},
                        'AverageTime':stats[4],
                        'AgeGroups':{'18to21':stats[5][0], '21to25':stats[5][1],'25to30':stats[5][2],'30to40':stats[5][3], '40+':stats[5][4]},
                        'TotalEmployees':stats[6]});
                } else {
                    console.log('[MONGOOSE] No employees to find');
                }
            } else {
                console.error('[MONGOOSE] ' + err);
                res.status(500).json('[MONGOOSE] ' + err);
            }
        });
    });

    function gatherStatistics(employees){
        var statistics = [];
        var MFratio = [0, 0]; // Male Female
        var MFtotal = [0, 0];
        var birthByMonthTotal = [0,0,0,0,0,0,0,0,0,0,0,0];
        var birthByMonthRatio = [0,0,0,0,0,0,0,0,0,0,0,0];
        var averageTime = 0;
        var ageGroup = [0,0,0,0,0]; //18-24, 25-34, 35-44, 45-54, 55+
        var totalEmployees = employees.length;
        for(var i = 0; i < totalEmployees; i++) {
            var person = employees[i];

            averageTime += person.timeSpent;

            if(!person.exitDate) {
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
        MFratio[0] = MFtotal[0] / totalEmployees;
        MFratio[1] = MFtotal[1] / totalEmployees;

        for(var i = 0; i < birthByMonthTotal.length; i++) {
            birthByMonthRatio[i] = birthByMonthTotal[i] / totalEmployees;
        }

        statistics[0] = MFratio;
        statistics[1] = MFtotal;
        statistics[2] = birthByMonthRatio;
        statistics[3] = birthByMonthTotal;
        statistics[4] = Math.ceil(averageTime / employees.length);
        statistics[5] = ageGroup;
        statistics[6] = totalEmployees;
        return statistics;
    }

    app.get('/temp_window/:start/:end', function (req, res) {
        var start = req.params.start;
        var end = req.params.end;
        var query = Employee.find({});
        var returnResult = [];
        query.exec(function(err, result){
            if(err) {
                console.log("[MONGOOSE] Error " + err);
                res.status(500).json(err);
            } else {
                for(var i = 0; i < result.length; i++) {
                    var person = result[i];
                    if(!person.exitDate){
                        if(person.birthDate.getMonth() > start-1 && person.birthDate.getMonth() < end-1){
                            returnResult[returnResult.length] = person;
                        }
                    }
                }
                res.status(200).json(returnResult);
            }
        });
    });

    var _MS_PER_DAY = 1000 * 60 * 60 * 24;

    function dateDiffInDays(a, b) {
        var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
        var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

        return Math.floor((utc2 - utc1) / _MS_PER_DAY);
    }

    app.get('/authUrl', function(req, res){
        var returnVal = oauth2.authCode.authorizeURL({
            redirect_uri: redirectUri,
            scope: scopes.join(" ")
        });
        console.log("Generated auth url: " + returnVal);
        res.status(200).json(returnVal);
    });

    var url = require('url');
    app.get('/authorize', function(req, res) {
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
            console.log("Token Received: " + token);
            /*var cookies = ['iTBirthday-outlook-token=' + token.token.access_token + ';Max-Age=3600',
                            'iTBirthday-outlook-email=' + authHelper.getEmailFromIdToken(token.token.id_token) + ';Max-Age=3600'];
            response.setHeader('Set-Cookie', cookies);
            response.writeHead(302, {'Location': 'http://localhost:8080/getEvents'});
            response.end();*/
        }
    }

    function getEmailFromIdToken(id_token) {
        var token_parts = id_token.split('.');
        var encoded_token = new Buffer(token_parts[1].replace("-", "+").replace("_", "/"), 'base64');
        var decoded_token = encoded_token.toString();
        var jwt = JSON.parse(decoded_token);
        return jwt.preferred_username;
    }

    app.get('/facebook_info', function(req, res){
        var query = Facebook.find({});
        query.exec(function(err, result){
            if(err){
                console.log('[MONGOOSE]: ' + err);
                res.status(500).json(err);
            } else {
                res.status(200).json(result);
            }
        });
    });

    app.post('/facebook_token', function(req, res){
        var query = Facebook.find({});
        Facebook.update(query, {token: req.body.newToken}, function(err, result){
            if(err){
                console.log('[MONGOOSE] Error: ' + err);
                res.status(500).json(err);
            } else {
                res.status(200).json();
            }
        });
        /*query.exec(function(err, result){
            if(err){
                console.log('[MONGOOSE] Error: ' + err);
                res.status(500).json(err);
            } else {
                result.token = req.body.newToken;
                result.expirationDate = req.body.expDate;
                result.save();
            }
        });*/
    });

    /*var facebookstuff = new Facebook({'appId':'thisisappid', 'appSecret':'thisisappsecret', 'token':'asdasdasdasdasdasdasd'});
    facebookstuff.save(function(err){if(err) console.log(err);});*/

    /*TESTS
     cleanAdmin();
     cleanEmployee();
     cleanTemplate();
     var admin = new Admin({username: 'admin', password: '68e656b251e67e8358bef8483ab0d51c6619f3e7a1a9f0e75838d41ff368f728'});
     admin.save(function (err) {if (err) console.log ('[MONGOOSE] Error saving new admin! ' + err)});
     checkLogin('admin','68e656b251e67e8358bef8483ab0d51c6619f3e7a1a9f0e75838d41ff368f728');
     /*
     var johndoe = new Employee ({
     name: 'John Doe',
     birthDate: '1990-01-30',
     phoneNumber: '965912228',
     email: 'johndoe@itgrow.com',
     entryDate: '2014-04-10',
     sendMail: true,
     sendSMS: false,
     facebookPost: false,
     gender: 'Male'
     });

     var maryjane = new Employee ({
     name: 'Mary Jane',
     birthDate: '1990-01-30',
     phoneNumber: '965912218',
     email: 'maryjane@itgrow.com',
     entryDate: '2014-04-10',
     sendMail: true,
     sendSMS: false,
     facebookPost: false,
     gender: 'Female'
     });

     var zecarlos = new Employee ({
     name: 'Zé Carlos',
     birthDate: '1990-01-30',
     phoneNumber: '965912328',
     email: 'zecarlos@itgrow.com',
     entryDate: '2014-04-10',
     sendMail: true,
     sendSMS: false,
     facebookPost: false,
     gender: 'Male'
     });

     johndoe.save(function (err) {if (err) console.log ('[MONGOOSE] Error saving new employee!' + err)});
     maryjane.save(function (err) {if (err) console.log ('[MONGOOSE] Error saving new employee!' + err)});
     zecarlos.save(function (err) {if (err) console.log ('[MONGOOSE] Error saving new employee!' + err)});*/
}