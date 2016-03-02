// app/routes.js

// REQUIRED FOR IMAGE UPLOAD
var multer = require('multer');
var fs = require('fs');
var path = require('path');
var options = multer.diskStorage({ destination : 'public/uploads/' ,
  filename: function (req, file, cb) {
    cb(null, (Math.random().toString(36)+'00000000000000000').slice(2, 10) + Date.now() + path.extname(file.originalname));
  }
});
var upload = multer({ storage: options });

// var upload = multer({ dest: 'uploads/' });

// load the todo and token models
var Todo = require('./models/todo');
var Token = require('./models/token');
var User = require('./models/user');

// expose the routes to our app with module.exports
module.exports = function(app, passport) {
	
	// routes ======================================================================

	// WEB ROUTES
	app.get('/', function(req, res) {
      res.render('index.ejs');  // load the index.ejs file
  });

  app.get('/login', function(req, res) {
      // render the page and pass in any flash data if it exists
      res.render('login.ejs', { message: req.flash('loginMessage') }); 
  });

  app.post('/login', passport.authenticate('local-login', {
      successRedirect : '/profile', // redirect to the secure profile section
      failureRedirect : '/login', // redirect back to the signup page if there is an error
      failureFlash : true // allow flash messages
  }));

  app.get('/signup', function(req, res) {
      // render the page and pass in any flash data if it exists
      res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  app.post('/signup', passport.authenticate('local-signup', {
      successRedirect : '/profile', // redirect to the secure profile section
      failureRedirect : '/signup', // redirect back to the signup page if there is an error
      failureFlash : true // allow flash messages
  }));

  app.get('/profile', isLoggedIn, function(req, res) {
      res.render('profile.ejs', {
          user : req.session.user // get the user out of session and pass to template
      });
  });

  app.get('/logout', function(req, res) {
      req.logout();
      res.redirect('/');
  });

  // NOTE: also used in phone API
  app.get('/api/todos', function(req, res) {

      // use mongoose to get all todos in the database
      Todo.find(function(err, todos) {

          // if there is an error retrieving, send the error. nothing after res.send(err) will execute
          if (err)
              res.send(err)

          res.json(todos); // return all todos in JSON format
      });
  });

  // create todo and send back all todos after creation
  app.post('/api/todos', isLoggedIn, upload.single('file'), function(req, res) {

      // create a todo, information comes from AJAX request from Angular
      Todo.create({
          text : req.body.info.text,
          price: req.body.info.price,
          address: req.body.info.address,
          author: req.session.user.local.display_name,
          photo: req.file.filename,
          done : false
      }, function(err, todo) {
          if (err)
              res.send(err);

          // get and return all the todos after you create another
          Todo.find(function(err, todos) {
              if (err)
                  res.send(err)
              res.json(todos);
          });
      });

  });

  // delete a todo
  // NOTE: also used in phone API
  app.delete('/api/todos/:todo_id', function(req, res) {
      Todo.remove({
          _id : req.params.todo_id
      }, function(err, todo) {
          if (err)
              res.send(err);

          // get and return all the todos after you create another
          Todo.find(function(err, todos) {
              if (err)
                  res.send(err)
              res.json(todos);
          });
      });
  });

  // API ROUTES

  app.post('/api/login', function(req, res) {
  	passport.authenticate('local-login', function(err, user, info) {

        //an error was encountered (ie. no database available)
        if (err) {  
          return next(err); 
        }

        //a user wasn't returned; this means that the user isn't available, or the login information is incorrect
        if (!user) {  
          return res.json({
            'loginstatus' : 'failure',
            'message' : info.message
          }); 
        }
        else {  

          //success!  create a token and return the successful status and the if of the logged in user

          // create a token (random 32 character string)
          var token = Math.round((Math.pow(36, 32 + 1) - Math.random() * Math.pow(36, 32))).toString(36).slice(1);

          // add the token to the database
          Token.create({
            user_id: user.id,
            token: token,
          }, function(err, tokenRes) {
            if (err)
                res.send(err);

            return res.json({
              'loginstatus' : 'success',
              'userid' : user.id,
              'token' : token,
            });
          });
        }
      })(req, res);
  });

  // authenticates a userid/token combination
  app.post('/api/authlogin', function(req, res) {

      if (!req.param('user_id') || !req.param('token')) {
          
          // user_id/token combination not complete, return invalid
          return res.json({ status: 'error'});
      }

      // attempt to retrieve the token info
      Token.find({
        user_id: req.param('user_id'),
        token: req.param('token'),
      }, function(err, tokenRes) {
        if (err)
            return res.json(err);

        // not found
        if (!tokenRes) {
            res.json({ status: 'error'});
        }

        // all checks pass, we're good!
        return res.json({ status: 'success'});
      });
  });

  app.post('/api/upload', function(req, res) {
    console.log(req.file);
    return res.ok();
  });

  // create todo and send back all todos after creation
  app.post('/api/phonetodos', upload.single('file'), isApiLoggedIn, function(req, res) {

      var todoInfo = req.body.info;
      User.findById(req.body.user_id, function(err, user) {
          if (err)
              res.send({ status: 'error', message: "We're sorry, but there was an error with your request"});

          // not found
          if (!user) {
              res.send({ status: 'error', message: "You're not real!"});
          }


          // save the image (if applicable)
          if (req.file.filename != "") {

            // there is an image found, save the image data and continue 
            if (err)
              console.log(err);

            // create a todo, information comes from AJAX request from Angular
            Todo.create({
                text : todoInfo.text,
                price: todoInfo.price,
                address: todoInfo.address,
                author: user.local.display_name,
                photo: req.file.filename,
                done : false
            }, function(err, todo) {
                if (err)
                    res.send(err);

                // get and return all the todos after you create another
                Todo.find(function(err, todos) {
                    if (err)
                        res.send(err)
                    return res.json(todos);
                });
            });
          }
          else {

            // No image, save with the empty image variable

            // create a todo, information comes from AJAX request from Angular
            Todo.create({
                text : req.body.info.text,
                price: req.body.info.price,
                address: req.body.info.address,
                author: user.local.display_name,
                photo: '',
                done : false
            }, function(err, todo) {
                if (err)
                    res.send(err);

                // get and return all the todos after you create another
                Todo.find(function(err, todos) {
                    if (err)
                        res.send(err)
                    return res.json(todos);
                });
            });
          }
      });

  });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/login');
}

// route middleware for API
function isApiLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated()) {
        return next();
    }
    else if (req.body.user_id && req.body.token) {
        Token.find({
          user_id: req.body.user_id,
          token: req.body.token,
        }, function(err, tokenRes) {
          if (err)
              res.send({ status: 'error', message: "why aren't you logged in?"});

          // not found
          if (!tokenRes) {
              res.send({ status: 'error', message: "why aren't you logged in?"});
          }

          // all checks pass, we're good!
          return next();
        });
    }
    else {
      res.send({ status: 'error', message: "why aren't you logged in?"});
    }
}