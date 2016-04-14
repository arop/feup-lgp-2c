module.exports = function(express, app, mongoose, path, nodemailer, CronJob) {
    //Database
    mongoose.connect('mongodb://localhost/iTBirthday'); // change name of database , local database at the moment
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, '[MONGOOSE] Database Connection Error'));
    db.once('open', function(){
        console.log("[MONGOOSE] Connected to Database");
    });
	
    //Schemas
    var AdminSchema = new mongoose.Schema({
		username : {type: String, trim: true, required: true},
		password : {type: String, trim: true, required: true, minlength: 64, maxlength: 64}
	});

	var EmployeeSchema = new mongoose.Schema({
		name : {type: String, trim: true, required: true},
		birthDate : {type: Date, required: true},
		phoneNumber : {type: String, minlength: 9, maxlength: 9, required: true, trim:true},
		email : {type: String, required: true, match: [/^[a-zA-Z0-9_.-]*@itgrow.com/], trim: true},
		entryDate : {type: Date, required: true, default: Date.now},
		exitDate : {type: Date, required: false},
		sendMail : {type: Boolean, required: true, default: false},
		mailText : {type: String, required: false, trim: true},
		sendSMS : {type: Boolean, required: true, default: false},
		smsText : {type: String, required: false, trim: true},
		facebookPost : {type: Boolean, required:true, default: false},
		photoPath : {type: String, required:false, trim: true}
	});

	EmployeeSchema.virtual('age').get(function(){
		var today = new Date();
		var birthDate = this.birthDate;
		var age = today.getFullYear() - birthDate.getFullYear();
		var m = today.getMonth() - birthDate.getMonth();
		if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) 
		{
			age--;
		}
		return age;
	});
	
	var templateTypes = 'Email SMS Facebook'.split(' ');

	var TemplateSchema = new mongoose.Schema({
		name : {type: String, enum: templateTypes, required: true, trim: true},
		path : {type: String, required: true, trim: true}
	});
	
	//Create the Models
	var Admin = mongoose.model('Admin', AdminSchema);
	var Employee = mongoose.model('Employee', EmployeeSchema);
	var Template = mongoose.model('Template', TemplateSchema);
	
	function cleanAdmin(){
		Admin.remove({}, function(err) {
		  if (err) {
			console.log ('[MONGOOSE] Error deleting old date in Admin Doc: ' + err);
		  }
		});
	}

	function cleanEmployee(){
		Employee.remove({}, function(err) {
		  if (err) {
			console.log ('[MONGOOSE] Error deleting old date in Employee Doc ' + err);
		  }
		});
	}

	function cleanTemplate(){
		Template.remove({}, function(err) {
		  if (err) {
			console.log ('[MONGOOSE] Error deleting old date in Template Doc ' + err);
		  }
		});
	}
	
    //Access to database
	function listAll(param){
		if(param == 'Employee') var query = Employee.find({});
		else if(param == 'Admin') var query = Admin.find({});
		else if(param == 'Template') var query = Template.find({});
		else return;
		query.exec(function(err, result){
			if(!err){
				if(result.length > 0){
					var resultStr = JSON.stringify(result, undefined, 2);
					console.log(resultStr);
				} else{
					console.log('[MONGOOSE] No Results found! Length: ' + result.length);
				}
			} else {
				console.log('[MONGOOSE] Error in listAll: ' + err);
			}
		});
	}

	function searchByName(param){
		var query = Employee.find({name: new RegExp(param, "i")});
		query.exec(function(err, result) { 
			if (!err) {
				if(result.length > 0){
					var resultStr = JSON.stringify(result, undefined, 2);
					console.log(resultStr);
				} else {
					console.log('[MONGOOSE] No Employees found! Length: ' + result.length);
				}
			} else {
				console.log('[MONGOOSE] Error in searchByName: ' + err);
			};
		});
	}
	
	function checkLogin(username, password){
		var query = Admin.findOne({'username': username, 'password': password});
		query.exec(function(err, result){
			if(!err){
				if(result){
					console.log('[MONGOOSE] Found Admin Login');
					return true;
				} else {
					console.log('[MONGOOSE] Did not find Admin Login');
					return false;
				}
			} else {
				console.log('[MONGOOSE] Error in checkLogin: ' + err);
				return false;
			}
		});
	}
	
	//Example of the use of cron
	//Every day of the week at 16.31.00
    new CronJob('00 31 16 * * 1-7', function() {
        console.log('Message');
    }, null, true, 'Europe/London');
	
	/*TESTS
	cleanAdmin();
	cleanEmployee();
	cleanTemplate();
	var admin = new Admin({username: 'admin', password: '68e656b251e67e8358bef8483ab0d51c6619f3e7a1a9f0e75838d41ff368f728'});
	admin.save(function (err) {if (err) console.log ('[MONGOOSE] Error saving new admin! ' + err)});
	checkLogin('admin','68e656b251e67e8358bef8483ab0d51c6619f3e7a1a9f0e75838d41ff368f728');
	
	var johndoe = new Employee ({
	  name: 'John Doe',
	  birthDate: '1990-01-30',
	  phoneNumber: '965912228',
	  email: 'johndoe@itgrow.com',
	  entryDate: '2014-04-10',
	  sendMail: true,
	  sendSMS: false,
	  facebookPost: false
	});

	johndoe.save(function (err) {if (err) console.log ('[MONGOOSE] Error saving new employee!' + err)});

	listAll('Employee');
	listAll('Admin');
	listAll('Template');
	searchByName('John Doe');
	/**/
}