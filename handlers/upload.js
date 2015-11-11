/**
 * Created by eunjoo on 2015. 11. 11..
 */

var formidable = require('formidable'),
    util = require('util'),
    path = require('path'),
    mime = require('mime'),
    fs = require('fs'),
    querystring = require('querystring');

//var UPLOAD_FOLDER = __dirname + "/data";
var UPLOAD_FOLDER = "./data";

exports.create = function (req, res) {
    var form = new formidable.IncomingForm(),
        files = [],
        fields = [];
    form.uploadDir = UPLOAD_FOLDER;
    form.keepExtensions = true;
    form.multiple="multiple";

    form.on ('field', function(field, value) {
        console.log(field, value);
        fields.push([field, value]);
    }).on ('file', function (field, file) {
        console.log(field, file);
        files.push([field, file]);
    }).on ('progress', function(bytesReceived, bytesExpected) {
        console.log('progress: ' + bytesReceived + '/' + bytesExpected);
    }).on ('end', function() {
        console.log('-> upload done');
    });

    form.parse(req, function(err, fields, files) {
        console.log('parse - ' + JSON.stringify(files));
        var card = {};
        var result = files;
        var fileInfos = [];

        card.author = fields["author"];
        card.memo = fields["memo"];
        card.date = new Date();

        for (var file in files) {
            var path = files[file]['path'],
                index = path.lastIndexOf('/') + 1,
                _id = path.substr(index);

            var fileInfo = {
                path: path,
                name: files[file]['name']
            };

            result[file]["_id"] = _id;
            console.log(files);
            fileInfos.push(fileInfo);
        }

        card.file = fileInfos;

        console.log('card - ' + JSON.stringify(card));

        _insertMemo(req, card, function (error, results) {
            result["error"] = error;
            result["results"] = results;
            res.end(JSON.stringify(card));
        });

    });
};

exports.read = function(req, res) {

    var uploadquery = req.params.uploadquery;
    var _id = querystring.parse(uploadquery)['_id'];
    var path = querystring.parse(uploadquery)['path'];

    var where = req.query;

    if (typeof _id !== 'undefined') {
        var ObjectID = require('mongodb').ObjectID;
        var objid = new ObjectID(_id);
        where = {_id: objid};
    }

    if (typeof path !== 'undefined') {
        console.log("path: " + path);
        var vpath = UPLOAD_FOLDER + "/" + path;

        fs.readFile(vpath, function(err, data) {

            if (err) {
                res.writeHead(404, {
                    'content-type': 'text/plain'
                });
                res.end('404');
            }

            res.writeHead(200, {
                'Content-Type': 'image/png'
            });
            res.end(data);
        });

    } else {
        console.log("where: " + JSON.stringify(where));
        _findMemo(req, where || {}, function (err, results) {
            res.json({error: err, results: results});
        });
    }
};

exports.remove = function (req, res) {
    var where = req.query;

    _removeMemo(req, where, function (error, results) {
        res.json({ error : error, results : results});
    });
};

function _insertMemo(req, card, callback) {
    req.db.collection('test', function(err, collection) {
        collection.insert(card, {safe:true}, callback);
    });
}

function _findMemo(req, where, callback) {
    where = where || {};

    console.log("where: " + JSON.stringify(where));
    req.db.collection('test', function(err, collection) {
        collection.find(where).toArray(callback);
    });
}

function _updateMemo(req, where, body, callback) {
    req.db.collection('test', function(err, collection) {
        collection.update(where, {$set : body}, callback);
    });
}

function _removeMemo(req, where, callback) {
    req.db.collection('test', function(err, collection) {
        collection.remove(where, callback);
    });
}