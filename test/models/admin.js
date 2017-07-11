var expect = require('chai').expect;
var utils = require('../utils');
var Admin = require('../../models/admin.js');

describe('Admin: models', function () {


  describe('#create()', function () {
    it('should create a new User', function (done) {
      // Create a User object to pass to User.create()
      const user = new Admin({
	      email: 'CapTest@gmail.com',
	      password: 'hashThis'
	    });
      user.save(user, function (err, createdUser) {
        // Confirm that that an error does not exist
        // verify that the returned user is what we expect
        expect(createdUser.email).to.equal('captest@gmail.com');
        expect(createdUser.email).to.not.equal('hashThis');
        // Call done to tell mocha that we are done with this test
        done();
      });
    });
  });

  describe('password compare', function () {
    it('should compare the password correctly', function (done) {
      const user = new Admin({
	      email: 'CapTest@gmail.com',
	      password: 'hashThis'
	    });

      user.save(user, function (err, createdUser) {
      });
      user.comparePassword('hashThis',function(err, isMatch){
        expect(err).to.not.exist;
				expect(isMatch).to.equal('true');
			});
      done();
    });

    it('should compare the password wrongly', function (done) {
      const user = new Admin({
	      email: 'CapTest@gmail.com',
	      password: 'hashThis'
	    });

      user.save(user, function (err, createdUser) {
      });
      user.comparePassword('hashThisWrong',function(err, isMatch){
        expect(err).to.exist;
				expect(isMatch).to.equal('false');
			});
      done();
    });
  });



});
