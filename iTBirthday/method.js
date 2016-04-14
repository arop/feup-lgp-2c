module.exports = function(express, app, mongoose,path, nodemailer,CronJob) {
    //Database
    mongoose.connect('mongodb://localhost/iTBirthday'); // change name of database , local database at the moment
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function(){
        console.log("Connected to Database");
    });

    //Schemas
    //...



    //Access to database
    //...
	
	//Example of the use of cron
	//Every day of the week at 16.31.00
    new CronJob('00 31 16 * * 1-7', function() {
        console.log('Message');
    }, null, true, 'Europe/London');
}