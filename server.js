'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const passport = require('passport');
const session = require('express-session');
const { ObjectID } = require('mongodb');
const LocalStrategy = require('passport-local');

const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up views settings
app.set('view engine', 'pug');
app.set('views', './views/pug');

// Set up session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {secure:false}
}))

app.use(passport.initialize());
app.use(passport.session());

// Connect to database and encompass everything
myDB(async client => {

  // DB Connection
  const myDataBase = await client.db('database').collection('users');

  /** 
   * Routes section
   */
  app.route('/login')
    .post(passport.authenticate('local', {failureRedirect: '/'}), (req, res) => {
      res.redirect('/profile');
    })
  
  app.route('/profile')
    .get(ensureAuthenticated, (req, res) => {
      res.render('profile', {username:req.user.username});
    })
  
  app.route('/logout')
    .get((req, res) => {
      req.logout();
      req.redirect('/');
    })

  app.route('/')
    .get((req, res) => {
      res.render('index', {
        title:'Connected to Database', 
        message:'Please log in',
        showLogin: true
      });
  
  });
  /**
   *  -- END of ROUTES --
   */
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  })
  /**
   * Passport configuration
   */
  passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username: username}, (err, user) => {
      console.log(`User ${username} attempted to login.`);
      if(err) return done(err);
      if(!user) return done(null, false);
      if(password !== user.password) return done(null, false);
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
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', {title: e, message: 'Unable to connect to database'});
  })
})

/**
 * Custom Middleware
 */
function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()) {
    return next();
  }else{
    res.redirect('/');
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
