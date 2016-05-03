module.exports = function(express, app, mongoose, path, nodemailer, CronJob, fs, busboy, clickatell) {
    //Database
    mongoose.connect('mongodb://localhost/iTBirthday'); // change name of database , local database at the moment
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
        email: {type: String, required: true, match: [/^[a-zA-Z0-9_.-]*@itgrow.com/], trim: true, unique: true},
        entryDate: {type: Date, required: true, default: Date.now},
        exitDate: {type: Date, required: false},
        sendMail: {type: Boolean, required: true, default: false},
        mailText: {type: String, required: false, trim: true},
        sendSMS: {type: Boolean, required: true, default: false},
        smsText: {type: String, required: false, trim: true},
        facebookPost: {type: Boolean, required: true, default: false},
        photoPath: {type: String, required: false, trim: true},
        gender: {type: String, enum: employeeGender, required: false, trim: true}
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

    var TemplateSchema = new mongoose.Schema({
        name: {type: String, enum: templateTypes, required: true, trim: true},
        path: {type: String, required: true, trim: true}
    });

    //Create the Models
    var Admin = mongoose.model('Admin', AdminSchema);
    var Employee = mongoose.model('Employee', EmployeeSchema);
    var Template = mongoose.model('Template', TemplateSchema);

    function cleanAdmin() {
        Admin.remove({}, function (err) {
            if (err) {
                console.log('[MONGOOSE] Error deleting old date in Admin Doc: ' + err);
            }
        });
    }

    function cleanEmployee() {
        Employee.remove({}, function (err) {
            if (err) {
                console.log('[MONGOOSE] Error deleting old date in Employee Doc ' + err);
            }
        });
    }

    function cleanTemplate() {
        Template.remove({}, function (err) {
            if (err) {
                console.log('[MONGOOSE] Error deleting old date in Template Doc ' + err);
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
            facebookPost: req.body.facebookPost
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
            //Path where image will be uploaded
            var ext = filename.substr(filename.indexOf('.'),filename.lenght);
            fstream = fs.createWriteStream(__dirname + '/images/employees/' + req.params.id + ext);
            file.pipe(fstream);
            fstream.on('close', function () {
                console.log("Upload Finished of " + req.params.id + ext);
                res.redirect('back');           //where to go next
            });
        });

    });


    //Update informations of the employee
    //Employee ID passed in the url
    app.post('/update_employee/:id', function (req, res) {
        Employee.findOneAndUpdate({_id: req.params.id}, req.body, function (err, emp) {
            if ( err ) {
                console.error('[MONGOOSE] Error in updated employee: ' + err);
                res.status(500).json('[MONGOOSE] Error in updated employee: ' + err);
            } else {
               //TODO change image

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
                    res.status(200).json('[MONGOOSE] Found Admin Login');
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

    app.get('/list_employees', function (req, res) {
        var query = Employee.find({}, 'name email');
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
                    res.status(200).json({'Ratio':{'Male':stats[0][0], 'Female':stats[0][1]},
                                          'BirthsByMonth':{'Jan':stats[1][0],'Feb':stats[1][1],'Mar':stats[1][2],'Apr':stats[1][3],'May':stats[1][4],'Jun':stats[1][5],
                                                         'Jul':stats[1][6],'Aug':stats[1][7],'Sep':stats[1][8],'Oct':stats[1][9],'Nov':stats[1][10],'Dec':stats[1][11]},
                                          'AverageTime':stats[2],
                                          'AgeGroups':{'18to24':stats[3][0], '25to34':stats[3][1],'35to44':stats[3][2],'45to54':stats[3][3], '55+':stats[3][4]}});
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
        var ratio = [0, 0]; // Male Female
        var birthByMonth = [0,0,0,0,0,0,0,0,0,0,0,0];
        var averageTime = 0;
        var ageGroup = [0,0,0,0,0]; //18-24, 25-34, 35-44, 45-54, 55+
        for(var i = 0; i < employees.length; i++) {
            var person = employees[i];
            if(person.gender == "Male") ratio[0]++;
            else ratio[1]++;

            birthByMonth[person.birthDate.getMonth()]++;

            averageTime += person.timeSpent;

            var age = person.age;
            if(age >= 18 && age <= 24) ageGroup[0]++;
            else if(age >= 25 && age <= 34) ageGroup[1]++;
            else if(age >= 35 && age <= 44) ageGroup[2]++;
            else if(age >= 45 && age <= 54) ageGroup[3]++;
            else if(age >= 55) ageGroup[4]++;
        }
        statistics[0] = ratio;
        statistics[1] = birthByMonth;
        statistics[2] = Math.ceil(averageTime / employees.length);
        statistics[3] = ageGroup;
        return statistics;
    }

    var _MS_PER_DAY = 1000 * 60 * 60 * 24;

    function dateDiffInDays(a, b) {
        var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
        var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

        return Math.floor((utc2 - utc1) / _MS_PER_DAY);
    }

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