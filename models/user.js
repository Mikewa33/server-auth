const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs')
//Define our model
const userSchema = new Schema({
	email: { type: String, unique: true, lowercase: true },
	username: { type: String, unique: true, lowercase: true },
	password: String,
	created_at: { type: Date, default: Date.now},
	updated_at: {type: Date, default: Date.now },
	reset_token: String,
	reset_token_sent_at: Date,
	confirmation_token: { type:String, unique: true},
	confirmation_token_sent_at: Date,
	confirmation_at: Date,
	refresh_token: { type: String, unique: true},
	refresh_token_sent_at: Date

});

//ON save hook
userSchema.pre('save',function (next) {
	const user = this;
	if(this.isNew){
		bcrypt.genSalt(10,function(err,salt){
			if(err) { return next(err);}
			bcrypt.hash(user.password, salt, null, function(err,hash){
				if(err) {return next(err);}
				user.password = hash;
				next();
			});
		});
	}else{
		next();
	}
});

userSchema.methods.comparePassword = function(candidatePassword, callback){
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch){
		if (err) { return callback(err);}
		callback(null, isMatch);
	});
}
//Create the model class
const ModelClass = mongoose.model('user', userSchema);


//Export the model
module.exports = ModelClass;
