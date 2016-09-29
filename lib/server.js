'use strict';

var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    redis = require('connect-redis'),
    models = require('../models');

app.use(cookieParser());
var RedisStore = redis(session);
app.use(session({
  secret: 'Shhhhh!',
  resave: false,
  saveUninitialized: true,
  store: new RedisStore()
}));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

app.set('views', './views');
app.set('view engine', 'pug');

app.use(function(request, response, next) {
  if (request.session.flash_message) {
    response.locals.flash_message = request.session.flash_message;
    delete request.session.flash_message;
    request.session.save(function() {
      next();
    });
  } else {
    next();
  }
});

app.use(function(request, response, next) {
    if (request.session.username) {
        response.locals.username = request.session.username;
    }
    next();
});

function redirectToTask(response, task) {
  response.redirect('/tasks/' + task.id);
};

app.get("/", function(request, response) {
  response.render('index', {title: 'Hello World!'});
});

app.get('/tasks', function(request, response) {
  models.Task.findAll()
    .then(function(tasks) {
      response.render('tasks/tasks', { tasks: tasks, title: 'Tasks!' });
    });
});

app.get('/tasks/:task_id', function(request, response) {
  console.log(request.session);
  models.Task.findById(request.params.task_id)
    .then(function(task) {
      response.render('tasks/task', { task: task, title: 'Task: ' + request.params.task_id });
    });
});

app.get('/users/register', function(request, response) {
    response.render('register', {title: 'Register', title: 'Register!'});
});

app.get('/users/login', function(request, response) {
    response.render('login', {title: 'Login'});
});

app.get('/users/logout', function(request, response) {
    request.session.username = null;
    request.session.flash_message = 'You have successfully logged out!';
    response.redirect('/');
});

app.get('/users/:username', function(request, response) {
    var username = request.params.username;
    if (request.session.username == username) {
        response.render('login_landing', {
            username: username,
            title: username + '\'s Home'
        });
    } else {
        response.end('You must be logged in to see this.');
    }
});

app.get('/:name', function(req, res) {
    res.end('Hello, ' + req.params.name + '!');
})

/***********************
*                      *
*    POST functions    *
*                      *
***********************/



app.post('/tasks', function(request, response) {
  models.Task.create({ name: request.body.todo })
    .then(function(task) {
      request.session.flash_message = "Added task " + task.name + " successfully!";
      request.session.save(function() {
        response.redirect("/tasks");
      });
    });
});

app.post('/tasks/:task_id', function(request, response) {
  models.Task.findById(request.params.task_id)
    .then(function(task) {
      task.name = request.body.todo;
      return task.save();
    }).then(function (task) {
      request.session.flash_message = "Updated successfully!";
      redirectToTask(response, task);
    });
});

app.post('/users/login', function(request, response) {
    var username = request.body.username.trim(),
        password = request.body.password;
    models.User.findOne({       // Look to see if username matches password in database
            where: {
                username: username,
                password: password
            }
        })
        .then(function(user) {
            if (user == null) { // If password doesn't match, display error message.
                request.session.flash_message = 'Oops! Wrong username or password. Try again.';
                response.redirect('/users/login');
            } else {            // If password matches, add username to session
                request.session.flash_message = '';
                request.session.username = user.username;
                response.redirect('/users/' + user.username);
            }
        });
});


app.post('/users/register', function(request, response) {
    var username = request.body.username.trim(),
        password = request.body.password;
    if (password.length < 8) {
        request.session.flash_message = 'Password must be at least 8 characters';
        response.redirect('/users/register');
    } else {
        models.User.findOne({       // Look to see if user already exists
            where: {
                username: username
            }
        })
        .then(function(user) {
            console.log(user);
            if (user == null) {     // If user doesn't exist, create user
                models.User.create({
                    username: username,
                    password: password
                })
                .then(function(user) {
                    request.session.username = user.username;
                    request.session.flash_message = 'Successfully registered! You are now logged in.';
                    response.redirect('/users/' + user.username);
                });
            } else {                // If user exists, warn that username exists
                request.session.flash_message = 'Username already exists.';
                response.redirect('/users/register');
            };
        });
    };
});



// allow other modules to use the server
module.exports = app;
