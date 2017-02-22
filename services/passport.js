const passport = require('passport');
const User = require('../models/user');
const config = require('../config');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const LocalStrategy = require('passport-local');

const localOptions = { usernameField: 'email' };
const localLogin = new LocalStrategy(localOptions,function(email,password,done){
	console.log(email);
	User.findOne({ email: email }, function(err,user){
		if (err){ return done(err);}
		if (!user) { return done(null, false);}
		console.log(password);
		console.log(user)
		if(user.confirmation_at){
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

const jwtLogin = new JwtStrategy(jwtOptions, function(payload, done) {
  // See if the user ID in the payload exists in our database
  // If it does, call 'done' with that other
  // otherwise, call done without a user object
  console.log(payload);
  User.findById(payload.sub, function(err, user) {
    if (err) { return done(err, false); }

    if (user) {
      done(null, user);
    } else {
      done(null, false);
    }
  });
});


passport.use(jwtLogin);
passport.use(localLogin)