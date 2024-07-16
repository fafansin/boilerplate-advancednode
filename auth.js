const passport = require('passport');
const LocalStrategy = require('passport-local');
const { ObjectID } = require('mongodb');
const bcrypt = require('bcrypt');

module.exports = function (app, myDataBase){
    /**
   * Passport configuration
   */
  passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username: username}, (err, user) => {
      console.log(`User ${username} attempted to login.`);
      if(err) return done(err);
      if(!user) return done(null, false);
      if(!bcrypt.compareSync(password, user.password)) return done(null, false);
      return done(null, user);
    })
  }))
  passport.serializeUser((user, done) => {
    done(null, user._id);
  })

  passport.deserializeUser((id, done) => {
    myDataBase.findOne({_id: new ObjectID(id)}, (err, doc) => {
      done(null, doc);
    })
  })
}