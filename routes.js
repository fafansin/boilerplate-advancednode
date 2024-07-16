const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = function (app, myDataBase){

  app.route('/login')
    .post(passport.authenticate('local', {failureRedirect: '/'}), (req, res) => {
        res.redirect('/profile');
    });
    
  
  app.route('/profile')
    .get(ensureAuthenticated, (req, res) => {
      res.render('profile', {username:req.user.username});
    })
  
  app.route('/logout')
    .get((req, res) => {
      req.logout();
      res.redirect('/');
    })

  app.route('/register')
    .post((req, res, next) => {
      //hashing password
      const hash = bcrypt.hashSync(req.body.password, 12);
      myDataBase.findOne({username:req.body.username}, (err, user) => {
        if(err){
          console.log('error in finding')
          next(err);
        }else if(user){
          console.log('user exists');
          res.redirect('/');
        }else{
          myDataBase.insertOne({
            username: req.body.username,
            password: hash
          }, (err, doc) => {
            if(err){
              console.log('error in adding');
              res.redirect('/')
            }else{
              console.log(doc);
              next(null, doc.ops[0]);
            }
          }
        )
        }
      })
    },
      passport.authenticate('local', {failureRedirect: '/'}),
      (req, res, next) => {
        res.redirect('profile');
      }
    )

  app.route('/')
    .get((req, res) => {
      res.render('index', {
        title:'Connected to Database', 
        message:'Please log in',
        showLogin: true,
        showRegistration: true
      });
    });

app.use((req, res, next) => {
    res.status(404)
        .type('text')
        .send('Not Found');
    })
}

function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated()) {
      return next();
    }else{
      res.redirect('/');
    }
  }