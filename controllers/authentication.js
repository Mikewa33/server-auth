const jwt = require('jwt-simple');
const User = require('../models/user');
const Admin = require('../models/admin');
const config = require('../config');
const uuid = require('node-uuid');
const nodemailer = require('nodemailer');

function tokenForUser(user){
	const timestamp = new Date().getTime();
	return jwt.encode({ sub: user.id, iat: timestamp, expires: (timestamp+ 86400000 )  },config.secret);
	//return jwt.encode({ sub: user.id, iat: timestamp, expires: (timestamp+86400000)  },config.secret);
	
}

function refreshToken(user){
	const timestamp = new Date().getTime();
	return jwt.encode({ refresh: user.refresh_token, iat: timestamp },config.secret);
}

function tokenForAdmin(admin){
	const timestamp = new Date().getTime();
	return jwt.encode({ sub: admin.id, iat: timestamp, expires: (timestamp+ 7200000), adminToken: true  },config.admin_secret);
	//return jwt.encode({ sub: user.id, iat: timestamp, expires: (timestamp+86400000)  },config.secret);
	
}

function refreshTokenAdmin(admin){
	const timestamp = new Date().getTime();
	return jwt.encode({ refresh: admin.refresh_token, iat: timestamp, adminToken: true },config.admin_secret);
}

exports.refreshing = function(req, res, next){
	var user = req.user;
	user.refresh_token = uuid.v4();
	user.refresh_token_sent_at = Date.now();
	user.save(function(err) {
        if (err) { return next(err); }
	});
	res.send({ token: tokenForUser(req.user) , refreshToken: refreshToken(req.user)});
}

exports.refreshingAdmin = function(req, res, next){
	var admin = req.user;
	admin.refresh_token = uuid.v4();
	admin.refresh_token_sent_at = Date.now();
	admin.save(function(err) {
        if (err) { return next(err); }
	});
	res.send({ token: tokenForAdmin(admin) , refreshToken: refreshTokenAdmin(admin)});
}

exports.signin = function(req, res, next){
	//Just need to give a token
	var user = req.user;
	user.refresh_token = uuid.v4();
	user.refresh_token_sent_at = Date.now();
	user.save(function(err) {
        if (err) { return next(err); }
        console.log("save");
        console.log(user.refresh_token)
	});
	res.send({ token: tokenForUser(req.user) , refreshToken: refreshToken(req.user)});
}

exports.adminSignin = function(req, res, next){
	//Just need to give a token
	console.log("THIS FAR");
	console.log(req)
	var admin = req.user;
	admin.refresh_token = uuid.v4();
	admin.refresh_token_sent_at = Date.now();
	admin.save(function(err) {
        if (err) { return next(err); }
        console.log("save");
        console.log(admin.refresh_token)
	});
	res.send({ token: tokenForAdmin(admin) , refreshToken: refreshTokenAdmin(admin)});
}

exports.confirmation = function(req,res,next){
	User.findOne({ confirmation_token: req.body.token }, function(err, user) {
	    if (err) { return next(err); }

	    if (user) {
		      return res.status(422).send({ error: 'Please contact support confimation token invaild' });
		}
	    user.confirmation_at = Date.now();
	    user.save(function(err) {
	      if (err) { return next(err); }

	      res.send({ token: tokenForUser(req.user) , refreshToken: refreshToken(req.user)});
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
    	// If a user with email does NOT exist, create and save user record
	    const user = new User({
	      email: email,
	      password: password,
	      confirmation_token: uuid.v4(),
	      confirmation_token_sent_at: Date.now(),
	      refresh_token:  uuid.v4(),
		  refresh_token_sent_at: Date.now()
	    });
	    user.save(function(err) {
	      if (err) { return res.status(422).send({ error: 'Couldnt process try again in a little' }); }
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
			transporter.sendMail(mailOptions, (error, info) => {
			    if (error) {
			         return res.status(422).send({ error: 'Couldnt send confirmation email. Contact support' });
			    }
			    res.json({ return_msg:"Plase confirm email" });
			});
	      // Repond to request indicating the user was created
	     
	    });
  	});
	//Respond to request indicating the user was created
}

exports.resetpassword = function(req,res,next){
	User.findOne({ reset_token: req.body.token_query, reset_token_sent_at: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          //res.json({ return_msg: 'Password reset token is invalid or has expired.'});
          res.status(422).send({ error: 'YOu must provide email and password'});
          //return res.redirect('back');
        }
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
			transporter.sendMail(mailOptions, (error, info) => {
			    if (error) {
			        return res.status(422).send({ error: 'Couldnt send confirmation email but password reset' });
			    }
			    //req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
			    res.json({ return_msg:  'Your password has been reset' });
			});
        });
      });
}


exports.forgotpassword = function(req,res,next){
	const email = req.body.email;
	if (!email) {
		return res.status(422).send({ error: 'You must provide email'});
	}
	User.findOne({ email: email }, function(err, user){
		if(!user){
			res.json({ return_msg:  'error' });
			//return res.redirect('/forgotpassword');
		}
		user.reset_token = uuid.v4();
		user.reset_token_sent_at = Date.now() + 3600000; // 1 hour
		user.save(function(err) {
         	if (err) { return res.status(422).send({ error: 'Couldnt send reset email. Try again in a little' }); }

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
			    subject: 'Node.js Password Reset', // Subject line
			    text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
		        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
		        'http://' + req.headers.origin + '/resetpassword?reset=' + user.reset_token + '\n\n' +
		        'If you did not request this, please ignore this email and your password will remain unchanged.\n'
			};
			transporter.sendMail(mailOptions, (error, info) => {
			    if (error) {
			        return res.status(422).send({ error: 'Couldnt send reset email. Try again in a little' });
			    }
			    //req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
			    res.json({ return_msg:  'An e-mail has been sent to ' + user.email + ' with further instructions.' });
			});
        });
	});

}