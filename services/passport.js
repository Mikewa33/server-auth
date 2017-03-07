const passport = require('passport');
const User = require('../models/user');
const Admin = require('../models/admin');
const config = require('../config');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const LocalStrategy = require('passport-local');

const localOptions = { usernameField: 'email' };
const localLogin = new LocalStrategy(localOptions,function(email,password,done){
	console.log(email);
	console.log("HI")
	User.findOne({ email: email }, function(err,user){
		if (err){ return done(err);}
		console.log(user);
		console.log("HERE");
		if (!user) { 
			console.log("if statement");
			console.log(email)
			Admin.findOne({ email: email }, function(err,admin){
				console.log(email);
				console.log(admin);
				console.log("query")
				if (err){ return done(err);}
				if (!admin) {  return done(null,false); }
				admin.comparePassword(password, function(err, isMatch){
					console.log("compare");
					if (err) { return done()}
					if (!isMatch) { return done(null,false); }

					return done(null, admin);
				});				 
			});
			console.log("WHAT?")
		}
		else if(user.confirmation_at){
			console.log("Confirmed")
			user.comparePassword(password, function(err, isMatch){
				if (err) { return done()}
				if (!isMatch) { return done(null,false); }

				return done(null, user);
			});
		}else{
			return done(null,false);
		}

	});

	
});
//Set up options for JWT Strat
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromHeader('authorization'),
  secretOrKey: config.secret
};
const jwtCallBack = function(payload,done) {
	User.findById(payload.sub, function(err,user){
		if(err) { return done(err,false);}
		if(user){
			done(null,user);
		}else{
			done(null,false)
		}
	});
};
//Create JWT Strat
//const jwtLogin = new JwtStrategy(jwtOptions,jwtCallBack );
const jwtRefresh = new JwtStrategy(jwtOptions, function(payload, done){
	const timestamp = new Date.getTime();
	
});

const jwtLogin = new JwtStrategy(jwtOptions, function(payload, done) {
	// See if the user ID in the payload exists in our database
	// If it does, call 'done' with that other
	// otherwise, call done without a user object
	const timestamp = new Date().getTime();
    if(payload.refresh){
    	var refresh_time = payload.iat;
	  	if(timestamp >  refresh_time+ 604800000){
			return done(null,false);
		};
		if(payload.adminToken){
			Admin.findOne({ refresh_token: payload.refresh }, function(err, admin) {
				if (err) { return done(err, false); }
			    if (admin) {
			      done(null, admin);
			    } else {
			      done(null, false);
			    }
			});
		}
		else{
			User.findOne({ refresh_token: payload.refresh }, function(err, user) {
				if (err) { return done(err, false); }
				console.log(user);
			    if (user) {
			      done(null, user);
			    } else {
			      done(null, false);
			    }
			});
		}
		
	}else{
		if(timestamp > payload.expires){
		  	return done(null,false);
		}
		if(payload.adminToken){
			Admin.findOne({ refresh_token: payload.refresh }, function(err, admin) {
				if (err) { return done(err, false); }
			    if (admin) {
			      done(null, admin);
			    } else {
			      done(null, false);
			    }
			});
		}
		else{
			User.findById(payload.sub, function(err, user) {
				if (err) { return done(err, false); }

			    if (user) {
			    	console.log("still comes here")
			        done(null, user);
			    } else {
					done(null, false);
				}
			});
		}
	}
});

passport.use(jwtLogin);
passport.use(localLogin);