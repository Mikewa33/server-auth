const Authentication = require('./controllers/authentication');
const passportService = require('./services/passport');
const passport = require('passport');

const requireAuth = passport.authenticate('jwt', { session: false });
const requireSignin = passport.authenticate('local', { session: false });
const refreshAuth = passport.authenticate('jwtRefresh',{ session: false});

module.exports = function(app) {
  app.get('/', requireAuth, function(req, res) {
    res.send({ message: 'Super secret code is ABC123' });
  });
  app.post('/signin', requireSignin, Authentication.signin);
  app.post('/signup', Authentication.signup);
  app.post('/forgotpassword',Authentication.forgotpassword);
  app.post('/resetpassword', Authentication.resetpassword);
  app.post('/confirmation', Authentication.confirmation);
  app.get('/refreshing', requireAuth, Authentication.refreshing);
  app.post('/adminSignin', requireSignin, Authentication.adminSignin);
  app.get('/refreshingAdmin', requireAuth, Authentication.refreshingAdmin);
}