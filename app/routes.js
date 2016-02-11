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

// load the todo model
var Todo = require('./models/todo');

// expose the routes to our app with module.exports
module.exports = function(app, passport) {
	
	// routes ======================================================================

	// main page
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
          else {  //success!  return the successful status and the if of the logged in user
            return res.json({
              'loginstatus' : 'success',
              'userid' : user.id
            })
          }
        })(req, res);
    });

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

	// api ---------------------------------------------------------------------
	// get all todos
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
	app.post('/api/todos', isApiLoggedIn, upload.single('file'), function(req, res) {

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

	// application -------------------------------------------------------------
	// app.get('*', function(req, res) {
	//     res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
	// });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/login');
}

function isApiLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    // res.redirect('/login');
    res.send({ status: 'error', message: "why aren't you logged in?"});
}