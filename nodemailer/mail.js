var nodemailer = require('nodemailer');

//
var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'lgp2.teamc@gmail.com',
		pass: 'lgp2teamc'
	}
});

console.log('SMTP configured');

var mailOptions = {
	from: 'lgp2.teamc@gmail.com', // <-- change this
	to: 'wathever@wathever.com', // <-- change this
	subject: 'testing email',
	text: 'Hello world',
	html: '<b>Hello World<b>'
}

console.log('mailOptions configured');
console.log('Sending mail...');

transporter.sendMail(mailOptions, function(error, info) {
	if(error) {
		return console.log(error);
	}
	
	console.log('Message sent: ' + info.response);
});

transporter.close();