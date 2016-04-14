module.exports = function(express, app, mongoose,path, nodemailer) {
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

}