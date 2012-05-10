
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'supersecretsecret1234'}));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Database

mongoose.connect('mongodb://localhost/blog_db');

// Models

var PostSchema = new mongoose.Schema({
  author  : String,
  title   : String,
  body    : String,
  date    : { type: Date, default: Date.now }
});

var Post = mongoose.model('posts', PostSchema);

var UserSchema = new mongoose.Schema({
  username: String,
  password: String
});

var User = mongoose.model('users', UserSchema);

// Passport

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findOne({ _id: id }, function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username, password: password }, function(err, user) {
      return done(err, user);
    });
  }
));

// Routes

//app.get('/', routes.index); // doen't work don't know why
app.get('/', function(req, res) {
  Post.find({}, [], { sort: { date: -1 } }, function(err, docs) {
      res.render('index', { posts: docs, user: req.user });
    }
  );
});

app.get('/admin', ensureAuthenticated, function(req, res) {
  res.render('admin');
});

app.post('/post', ensureAuthenticated, function(req, res) {
  var title = req.body.post.title;
  var body = req.body.post.text;

  var post = new Post();

  post.author = req.user.username;
  post.title = title;
  post.body = body;

  post.save(function(err) {
    if (!err) {
      console.log('Post successfully saved!');
    } else {
      console.log('ERROR!');
    }
    res.redirect('/');
  });
});

app.get('/login', function(req, res) {
  res.render('login');
});

app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
});

app.get('/logout', function(req, res){
  req.logOut();
  res.redirect('/');
});

app.get('/post/:postId', function(req, res) {
  Post.findOne({ _id: req.params.postId }, function(err, post) {
    res.render('post', { post: post });
  });
});

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}