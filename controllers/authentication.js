const jwt = require('jwt-simple');
const User = require('../models/user');
const config = require('../config');
const uuid = require('node-uuid');
const nodemailer = require('nodemailer');

function tokenForUser(user){
	const timestamp = new Date().getTime();
	return jwt.encode({ sub: user.id, iat: timestamp },config.secret);
}

exports.signin = function(req, res, next){
	//Just need to give a token
	res.send({ token: tokenForUser(req.user)})
}

exports.confirmation = function(req,res,next){
	console.log(req)
	User.findOne({ confirmation_token: req.body.token }, function(err, user) {
	    if (err) { return next(err); }

	    user.confirmation_at = Date.now();
	    user.save(function(err) {
	      if (err) { return next(err); }

	      res.json({ token: tokenForUser(user) });
	  	});

	});
}

exports.signup = function(req,res,next){
	// See if a user with the given email exists
	const email = req.body.email
	const password = req.body.password;

	if (!email || !password) {
		return res.status(422).send({ error: 'YOu must provide email and password'});
	}
	// if a user with the email does exist, return an error

	// If a user with email does NOt exist, create and save user record
	User.findOne({ email: email }, function(err, existingUser) {
	    if (err) { return next(err); }

	    // If a user with email does exist, return an error
	    if (existingUser) {
	      return res.status(422).send({ error: 'Email is in use' });
	    }
	    console.log("before make")
    	// If a user with email does NOT exist, create and save user record
	    const user = new User({
	      email: email,
	      password: password,
	      confirmation_token: uuid.v4(),
	      confirmation_token_sent_at: Date.now()
	    });
	    console.log(user);
	    user.save(function(err) {
	      if (err) { return next(err); }
	      let transporter = nodemailer.createTransport({
			    service: 'gmail',
			    auth: {
			        user: config.gemail,
			        pass: config.gpassword
			    }
			});
			// setup email data with unicode symbols
			let mailOptions = {
			    from: 'passwordreset@demo.com', // sender address
			    to: user.email, // list of receivers
			    subject: 'Node.js confirmation', // Subject line
			    text: 'Please click this link to confirm your'+'\n\n' +
		        'http://' + req.headers.origin + '/confirmation?token=' + user.confirmation_token
			};
			console.log("sending email")
			transporter.sendMail(mailOptions, (error, info) => {
			    if (error) {
			        return console.log(error);
			    }
			    res.json({ return_msg:"Plase confirm email" });
			});
	      // Repond to request indicating the user was created
	     
	    });
  	});
	//Respond to request indicating the user was created
}

exports.resetpassword = function(req,res,next){
	console.log("RESET")
	console.log(req.body)
	User.findOne({ reset_token: req.body.token_query, reset_token_sent_at: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          //res.json({ return_msg: 'Password reset token is invalid or has expired.'});
          res.status(422).send({ error: 'YOu must provide email and password'});
          //return res.redirect('back');
        }
        console.log(user)
        console.log(req.body)
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
        	let transporter = nodemailer.createTransport({
			    service: 'gmail',
			    auth: {
			        user: config.gemail,
			        pass: config.gpassword
			    }
			});
          	let mailOptions = {
			    from: 'passwordreset@demo.com', // sender address
			    to: user.email, // list of receivers
			    subject: 'Node.js Password Reset', // Subject line
			    text: 'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
			};
			console.log("sending email")
			transporter.sendMail(mailOptions, (error, info) => {
			    if (error) {
			        return console.log(error);
			    }
			    //req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
			    console.log('Message %s sent: %s', info.messageId, info.response);
			    res.json({ return_msg:  'Your password has been reset' });
			});
        });
      });
}


exports.forgotpassword = function(req,res,next){
	console.log("FORGOT PASSWORD");
	const email = req.body.email;
	console.log("HHHIIII")
	if (!email) {
		return res.status(422).send({ error: 'You must provide email'});
	}
	console.log("NO EMAIL?");
	console.log(req.body.email)
	User.findOne({ email: email }, function(err, user){
		console.log("found something")
		if(!user){
			console.log("REDIRTED BACK ERROR")
			res.json({ return_msg:  'error' });
			//return res.redirect('/forgotpassword');
		}
		console.log("USER?")
		user.reset_token = uuid.v4();
		console.log("token issue")
		user.reset_token_sent_at = Date.now() + 3600000; // 1 hour
		console.log("error here")
		user.save(function(err) {
         	if (err) { return next(err); }

         	let transporter = nodemailer.createTransport({
			    service: 'gmail',
			    auth: {
			        user: config.gemail,
			        pass: config.gpassword
			    }
			});
         	console.log(req.headers)
			// setup email data with unicode symbols
			let mailOptions = {
			    from: 'passwordreset@demo.com', // sender address
			    to: user.email, // list of receivers
			    subject: 'Node.js Password Reset', // Subject line
			    text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
		        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
		        'http://' + req.headers.origin + '/resetpassword?reset=' + user.reset_token + '\n\n' +
		        'If you did not request this, please ignore this email and your password will remain unchanged.\n'
			};
			console.log("sending email")
			transporter.sendMail(mailOptions, (error, info) => {
			    if (error) {
			        return console.log(error);
			    }
			    console.log("SENT EMAIL")
			    //req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
			    console.log('Message %s sent: %s', info.messageId, info.response);
			    res.json({ return_msg:  'An e-mail has been sent to ' + user.email + ' with further instructions.' });
			});
        });
	});

}