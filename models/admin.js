const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs')
//Define our model
const adminSchema = new Schema({
	email: { type: String, unique: true, lowercase: true },
	password: String,
	created_at: { type: Date, default: Date.now},
	updated_at: {type: Date, default: Date.now },
	refresh_token: { type: String, unique: true},
	refresh_token_sent_at: Date

});

//ON save hook
adminSchema.pre('save',function (next) {
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

adminSchema.methods.comparePassword = function(candidatePassword, callback){
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch){
		if (err) { return callback(err);}
		callback(null, isMatch);
	});
}
//Create the model class
const ModelClass = mongoose.model('admin', adminSchema);


//Export the model
module.exports = ModelClass;