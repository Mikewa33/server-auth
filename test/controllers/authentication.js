var expect = require('chai').expect;
var chai = require('chai');
const jwt = require('jwt-simple');
var request = require('supertest');
let server = require('../../index.js');
let should = chai.should();
var User = require('../../models/user.js');
var config = require('../../config.js');

describe('SignUp function', function () {
  this.timeout(15000);
  it('responds to /signup correctly', function testSlash(done) {
    request(server)
      .post('/signup')
      .send({
        'email': "mikewalters015@gmail.com",
        'username': 'username1',
        'password': 'testPassword1'
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.return_msg).to.equal("Please confirm email");
        done();
      });
  });
  it('responds to /signup dups error', function testSlash(done) {
    request(server)
      .post('/signup')
      .send({
        'email': "mikewalters015@gmail.com",
        'username': 'username1',
        'password': 'testPassword1'
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.return_msg).to.equal("Please confirm email");
        request(server)
          .post('/signup')
          .send({
            'email': "mikewalters015@gmail.com",
            'username': 'username2',
            'password': 'testPassword1'
          })
          .expect('Content-Type', /json/)
          .expect(422)
          .end(function (err, res) {
            expect(res.body.error).to.equal('Email is in use');
            done();
          });
      });
  });
  it('responds to /signup dups error in username', function testSlash(done) {
    request(server)
      .post('/signup')
      .send({
        'email': "mikewalters015@gmail.com",
        'username': 'username1',
        'password': 'testPassword1'
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.return_msg).to.equal("Please confirm email");
        request(server)
          .post('/signup')
          .send({
            'email': "mikewalters0151@gmail.com",
            'username': 'username1',
            'password': 'testPassword1'
          })
          .expect('Content-Type', /json/)
          .expect(422)
          .end(function (err, res) {
            expect(res.body.error).to.equal('Username is in use');
            done();
          });
      });
  });

  it('responds to /signup without password', function testSlash(done) {
    request(server)
      .post('/signup')
      .send({
        'email': "mikewalters015",
        'username': 'username1',
        'password': ''
      })
      .expect('Content-Type', /json/)
      .expect(422)
      .end(function (err, res) {
        expect(res.body.error).to.equal("You must provide email and password");
        done();
      });
  });

  it('responds to /signup without sending email', function testSlash(done) {
    request(server)
      .post('/signup')
      .send({
        'email': "mikewalters015",
        'username': 'username1',
        'password': 'testPassword1'
      })
      .expect('Content-Type', /json/)
      .expect(422)
      .end(function (err, res) {
        expect(res.body.error).to.equal("Couldnt send confirmation email. Contact support");
        done();
      });
  });
});

describe('Confirmation functions', function () {
  this.timeout(15000);
  it('confirmation hit works correctly', function testSlash(done) {
    request(server)
      .post('/signup')
      .send({
        'email': "mikewalters015@gmail.com",
        'username': 'username1',
        'password': 'testPassword1'
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.return_msg).to.equal("Please confirm email");
        User.findOne({ email: "mikewalters015@gmail.com" }, function(err, user) {
          request(server)
            .post('/confirmation')
            .send({
              'token': user.confirmation_token
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
              expect(res.body.token).to.not.equal(undefined);
              expect(res.body.refreshToken).to.not.equal(undefined);
              done();
            });
        });
      });
  });
  it('confirmation hit incorrect token', function testSlash(done) {
    request(server)
      .post('/signup')
      .send({
        'email': "mikewalters015@gmail.com",
        'username': 'username1',
        'password': 'testPassword1'
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.return_msg).to.equal("Please confirm email");
        User.findOne({ email: "mikewalters015@gmail.com" }, function(err, user) {
          request(server)
            .post('/confirmation')
            .send({
              'token': '12345'
            })
            .expect('Content-Type', /json/)
            .expect(422)
            .end(function (err, res) {
              expect(res.body.error).to.equal('Please contact support confimation token invaild');
              done();
            });
        });
      });
  });
});

describe('Refresh Token functions', function () {
  this.timeout(15000);
  it('refreshes token correctly', function testSlash(done) {
    request(server)
      .post('/signup')
      .send({
        'email': "mikewalters015@gmail.com",
        'username': 'username1',
        'password': 'testPassword1'
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.return_msg).to.equal("Please confirm email");
        User.findOne({ email: "mikewalters015@gmail.com" }, function(err, user) {
          request(server)
            .post('/confirmation')
            .send({
              'token': user.confirmation_token
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
              request(server)
                .post('/signin')
                .send({
                  'email': "mikewalters015@gmail.com",
                  'password': 'testPassword1'
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                  request(server)
                    .get('/refreshing')
                    .set('authorization', res.body.refreshToken)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                      expect(res.body.token).to.not.equal(undefined);
                      expect(res.body.refreshToken).to.not.equal(undefined);
                      done();
                    });
                });
             });
        });
      });
  });
  it('refreshes token incorrect data', function testSlash(done) {
    request(server)
      .post('/signup')
      .send({
        'email': "mikewalters015@gmail.com",
        'username': 'username1',
        'password': 'testPassword1'
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.return_msg).to.equal("Please confirm email");
        User.findOne({ email: "mikewalters015@gmail.com" }, function(err, user) {
          request(server)
            .post('/confirmation')
            .send({
              'token': user.confirmation_token
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
              request(server)
                .post('/signin')
                .send({
                  'email': "mikewalters015@gmail.com",
                  'password': 'testPassword1'
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                  const timestamp = (new Date().getTime() + 604800001);
                  var refresh_token = jwt.encode({ refresh: user.refresh_token, iat: timestamp },config.wrong_secret);
                  request(server)
                    .get('/refreshing')
                    .set('authorization', refresh_token)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                      expect(res.body.token).to.equal(undefined);
                      expect(res.body.refreshToken).to.equal(undefined);
                      done();
                    });
                });
            });
        });
     });
  });
});

describe('Sign In Function', function () {
  this.timeout(15000);
  it('Sign In hit works correctly', function testSlash(done) {
    request(server)
      .post('/signup')
      .send({
        'email': "mikewalters015@gmail.com",
        'username': 'username1',
        'password': 'testPassword1'
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.return_msg).to.equal("Please confirm email");
        User.findOne({ email: "mikewalters015@gmail.com" }, function(err, user) {
          request(server)
            .post('/confirmation')
            .send({
              'token': user.confirmation_token
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
              request(server)
                .post('/signin')
                .send({
                  'email': "mikewalters015@gmail.com",
                  'password': 'testPassword1'
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                  expect(res.body.token).to.not.equal(undefined);
                  expect(res.body.refreshToken).to.not.equal(undefined);
                  done();
                });
            });
        });
      });
  });
  it('Sign In hit works correctly when not confirmed', function testSlash(done) {
    request(server)
      .post('/signup')
      .send({
        'email': "mikewalters015@gmail.com",
        'username': 'username1',
        'password': 'testPassword1'
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.return_msg).to.equal("Please confirm email");
        User.findOne({ email: "mikewalters015@gmail.com" }, function(err, user) {
          request(server)
            .post('/signin')
            .send({
              'email': "mikewalters015@gmail.com",
              'password': 'testPassword1'
            })
            .expect('Content-Type', /json/)
            .expect(401)
            .end(function (err, res) {
              expect(res.body.token).to.equal(undefined);
              expect(res.body.refreshToken).to.equal(undefined);
              done();
            });
        });
      });
  });
  it('Sign In hit works correctly with wrong password', function testSlash(done) {
    request(server)
      .post('/signup')
      .send({
        'email': "mikewalters015@gmail.com",
        'username': 'username1',
        'password': 'testPassword1'
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.return_msg).to.equal("Please confirm email");
        User.findOne({ email: "mikewalters015@gmail.com" }, function(err, user) {
          request(server)
            .post('/confirmation')
            .send({
              'token': user.confirmation_token
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
              request(server)
                .post('/signin')
                .send({
                  'email': "mikewalters015@gmail.com",
                  'password': 'testPassword11'
                })
                .expect('Content-Type', /json/)
                .expect(401)
                .end(function (err, res) {
                  expect(res.body.token).to.equal(undefined);
                  expect(res.body.refreshToken).to.equal(undefined);
                  done();
                });
            });
        });
      });
  });
});

describe('Forgot Password', function () {
  this.timeout(15000);
  it('works correctly', function testSlash(done) {
    request(server)
      .post('/signup')
      .send({
        'email': "mikewalters015@gmail.com",
        'username': 'username1',
        'password': 'testPassword1'
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.return_msg).to.equal("Please confirm email");
        User.findOne({ email: "mikewalters015@gmail.com" }, function(err, user) {
          request(server)
            .post('/confirmation')
            .send({
              'token': user.confirmation_token
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
              request(server)
                .post('/forgotpassword')
                .send({
                  'email': "mikewalters015@gmail.com",
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                  expect(res.body.return_msg).to.equal('An e-mail has been sent to mikewalters015@gmail.com with further instructions.');
                  done();
                });
            });
        });
      });
  });
  it('works correctly no email', function testSlash(done) {
    request(server)
      .post('/forgotpassword')
      .send({
        'email': "",
      })
      .expect('Content-Type', /json/)
      .expect(422)
      .end(function (err, res) {
        expect(res.body.error).to.equal('You must provide email');
        done();
      });
  });
  it('works correctly invalid email', function testSlash(done) {
    request(server)
      .post('/forgotpassword')
      .send({
        'email': "mikewalters0151@gmail.com",
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.return_msg).to.equal('Error invaild email');
        done();
      });
  });
});


describe('Reset Password', function () {
  this.timeout(15000);
  it('works correctly', function testSlash(done) {
    request(server)
      .post('/signup')
      .send({
        'email': "mikewalters015@gmail.com",
        'username': 'username1',
        'password': 'testPassword1'
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.return_msg).to.equal("Please confirm email");
        User.findOne({ email: "mikewalters015@gmail.com" }, function(err, user) {
          request(server)
            .post('/confirmation')
            .send({
              'token': user.confirmation_token
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
              request(server)
                .post('/forgotpassword')
                .send({
                  'email': "mikewalters015@gmail.com",
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                  User.findOne({ email: "mikewalters015@gmail.com" }, function(err, user) {
                    request(server)
                      .post('/resetpassword')
                      .send({
                        'password' : 'newpass1',
                        'token_query': user.reset_token
                      })
                      .expect('Content-Type', /json/)
                      .expect(200)
                      .end(function (err, res) {
                        expect(res.body.return_msg).to.equal('Your password has been reset');
                        done();
                      });
                  });
                });
            });
        });
      });
  });
  it('invaild token', function testSlash(done){
    request(server)
      .post('/resetpassword')
      .send({
        'password' : 'newpass1',
        'token_query': 'notexisting'
      })
      .expect('Content-Type', /json/)
      .expect(422)
      .end(function (err, res) {
        expect(res.body.error).to.equal('Your token is invaild or expired');
        done();
      });
  })
});
