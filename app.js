var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var tip = require('./routes/tip');
var like = require('./routes/like');
var memo = require('./routes/memo');
var card = require('./routes/card');
var image = require('./routes/image');
var chat = require('./routes/chat');

var app = express();

var mongo = require('mongodb');
var Server = mongo.Server,
    Db = mongo.Db;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('nht', server);

db.open(function(err, db) {
    if(!err) {
        console.log("Connected to 'NHTdb' datbase");
    }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
    req["db"] = db;
    next();
});

app.use('/', routes);
app.use('/users', users);
app.use('/tip', tip);
app.use('/like', like);
app.use('/memo', memo);
app.use('/card', card);
app.use('/image', image);
app.use('/chat', chat);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
