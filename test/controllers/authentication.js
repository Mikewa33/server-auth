var expect = require('chai').expect;
var chai = require('chai')
var request = require('supertest');
let server = require('../../index.js');
let should = chai.should();

describe('Auth Server', function () {
  it('responds to /signup correctly', function testSlash(done) {
    request(server)
      .post('/signup')
      .send({
        'email': "mikewalters015@gmail.com",
        'password': 'testPassword1'
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.return_msg).to.equal("Plase confirm email");
        done();
      });
  });

  it('responds to /signup without sending email', function testSlash(done) {
    request(server)
      .post('/signup')
      .send({
        'email': "mikewalters015",
        'password': 'testPassword1'
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.error).to.equal("Couldnt send confirmation email. Contact support");
        done();
      });
  });
});
