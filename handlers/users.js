var formidable = require('formidable'),
    util = require('util'),
    path = require('path'),
    mime = require('mime'),
    fs = require('fs'),
    querystring = require('querystring');

//var UPLOAD_FOLDER = __dirname + "/icon";
var UPLOAD_FOLDER = "./icon";

exports.create = function (req, res) {
    var body = req.body;
    var uid = body.uid;
    var newUser = {};

    if (typeof uid !== 'undefined') {
        newUser = {_id: uid, nickname: "익명의 허니팁퍼", profilephoto: "icon/profilephoto1.png", status: "1"};
    }

    console.log('user - ' + JSON.stringify(newUser));

    _insertUser(req, newUser, function (error, results) {
        res.json(results);
    });
};

exports.read = function(req, res) {
    var getquery = req.params.getquery;
    var _id = querystring.parse(getquery)['_id'];
    var where = {status: "1"};

    if (typeof _id !== 'undefined') {
        where = {$and: [{status: "1"},{_id: _id}]};
    }

    console.log("where: " + JSON.stringify(where));
    _findUser(req, where, function (err, results) {
        // res.json({error: err, results: results});
        res.json(results);
    });
};

exports.update = function(req, res) {
    var putquery = req.params.putquery;
    var _id = querystring.parse(putquery)['_id'];
    var where = {};
    path = {};
    console.log("old path: " + JSON.stringify(path));

    if (typeof _id !== 'undefined') {
        where = {_id: _id};
    }

    console.log("update");

    var form = new formidable.IncomingForm(),
        files = [],
        fields = [],
        updateUser = {},
        result
        path;

    console.log("update" + form);

    form.uploadDir = UPLOAD_FOLDER;
    form.keepExtensions = true;
    form.multiple = "multiple";

    form.on ('field', function(field, value) {
        console.log(field, value);
        fields.push([field, value]);
    }).on ('file', function (field, file) {
        console.log(field, file);
        files.push([field, file]);
        console.log("files!!!! --- " + JSON.stringify(files));
    }).on ('progress', function(bytesReceived, bytesExpected) {
        console.log('progress: ' + bytesReceived + '/' + bytesExpected);
    }).on ('end', function() {
        console.log('-> upload done');

        console.log('parse - ' + JSON.stringify(files));

        result = files;

        for (var file in files) {
            console.log("files[0]: " + JSON.stringify(files[0]));
            console.log("files[0][1]: " + JSON.stringify(files[0][1]));
            console.log("files[0][1]['path']: " + JSON.stringify(files[0][1]['path']));

            path = files[file][1]['path'];
            console.log("file path: " + JSON.stringify(path));
        }
    });

    form.parse(req, function(err, fields) {

        var nickname;

        nickname = (fields["nickname"]);

        console.log("nickname type: " + typeof nickname);

        if (typeof nickname === 'string') {
            updateUser.nickname = nickname;
            console.log("nickname: +" + nickname);
        }

        if (JSON.stringify(path) != "{}") {
            console.log("path: " + JSON.stringify(path));
            updateUser.profilephoto = path;
        } else console.log("path is null");

        console.log('updateUser - ' + JSON.stringify(updateUser));
        _updateUser(req, where, updateUser, function (error, results) {
            result["error"] = error;
            result["results"] = results;
            res.end(JSON.stringify(updateUser));
        });
    });
};

exports.remove = function (req, res) {
    var delquery = req.params.delquery;
    var _id = querystring.parse(delquery)['_id'];
    var where = {};
    var body = {status : "0"};

    if (typeof _id !== 'undefined') {
        where = {_id: _id};
    }

    _removeUser(req, where, body, function (error, results) {
        res.json({ error : error, results : results});
    });
};

function _insertUser(req, user, callback) {
    req.db.collection('user', function(err, collection) {
        collection.insert(user, {safe:true}, callback);
    });
}

function _findUser(req, where, callback) {
    where = where || {};
    console.log("where: " + JSON.stringify(where));
    req.db.collection('user', function(err, collection) {
        collection.find(where).toArray(callback);
    });
}

function _updateUser(req, where, body, callback) {
    console.log("where: " + JSON.stringify(where));
    console.log("body: " + JSON.stringify(body));
    req.db.collection('user', function(err, collection) {
        collection.update(where, {$set : body}, callback);
    });
}

function _removeUser(req, where, body, callback) {
    req.db.collection('user', function(err, collection) {
        console.log("where: " + JSON.stringify(where));
        console.log("body: " + JSON.stringify(body));
        collection.update(where, {$set : body}, callback);
    });
}