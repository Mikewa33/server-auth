# server-auth

Mircoservice Server side in Node.js for creating and authorizing users using mongodb. With test written in mocha
To use full functionality create a config.js and fill in 

```
module.exports = {
  secret: '####',
  gemail: 'youremail',
  gpassword: 'thatEmailPassword',
  wrong_secret: "TestBS"
}
```
