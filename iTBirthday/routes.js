module.exports = function(express, app, path) {
    app.use('/', express.static(__dirname + '/'));

    app.get('/', function (req, res) {
        res.sendFile(path.join(__dirname+"/app/www/index.html"));
    });
}