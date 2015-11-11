var formidable = require('formidable'),
    util = require('util'),
    path = require('path'),
    mime = require('mime'),
    fs = require('fs'),
    querystring = require('querystring');

//var UPLOAD_FOLDER = __dirname + "/data";
var UPLOAD_FOLDER = "./data";

// set timezone
process.env.TZ = 'Asia/Seoul';

exports.create = function (req, res) {
    var form = new formidable.IncomingForm(),
        files = [],
        fields = [],
        newCard = {},
        result;

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
        var fileInfos = [];

        for (var file in files) {
            var path = files[file][1]['path'],
                index = path.lastIndexOf('/') + 1,
                _id = path.substr(index);

            var fileInfo = {
                path: path,
                name: files[file][1]['name']
            };

            result[file]["_id"] = _id;
            console.log("fileinfos: " + JSON.stringify(fileInfo));
            fileInfos.push(fileInfo);
        }

        newCard.file = fileInfos;

        console.log('newCard - ' + JSON.stringify(newCard));
    });

    form.parse(req, function(err, fields, files) {
        newCard.authorid = fields["authorid"] || "00000001";
        newCard.nickname = fields["nickname"] || "노란 조커";
        newCard.icon = fields["icon"] || "icon/icon1.png";
        newCard.title = fields["title"] || "노란 조커의 초롱초롱한 새장";
        newCard.createtime = new Date().toLocaleString();
        newCard.content = fields["content"];
        newCard.partynumber = fields["partynumber"] || "1";
        newCard.chattingtime = newCard.createtime;
        newCard.status = "1";
        newCard.chatting = "temp";

        _insertCard(req, newCard, function (error, results) {
            result["error"] = error;
            result["results"] = results;
            res.end(JSON.stringify(newCard));
        });
    });
};

exports.read = function(req, res) {
    var getquery = req.params.getquery;
    var _id = querystring.parse(getquery)['_id'];
    var nid = querystring.parse(getquery)['nid'];
    var where = {status: "1"};

    if (typeof _id !== 'undefined') {
        var ObjectID = require('mongodb').ObjectID;
        var objid = new ObjectID(_id);
        where = {$and: [{status: "1"},{_id: objid}]};
    }

    if (typeof nid !== 'undefined') {
        var ObjectID = require('mongodb').ObjectID;
        var objid = new ObjectID(nid);
        where = {$and: [{status: "1"},{_id: {$gt: objid}}]};
    }

    console.log("where: " + JSON.stringify(where));
    _findCard(req, where, function (err, results) {
        // res.json({error: err, results: results});
        res.json(results);
    });
};

exports.update = function(req, res) {
    var putquery = req.params.putquery;
    var _id = querystring.parse(putquery)['_id'];
    var where = {};
    var body = req.body;

    if (typeof _id !== 'undefined') {
        var ObjectID = require('mongodb').ObjectID;
        var objid = new ObjectID(_id);
        where = {_id: objid};
    }

    _updateCard(req, where, body, function(error, results) {
        res.json( {error: error, results : results});
    });
};

exports.remove = function (req, res) {
    var delquery = req.params.delquery;
    var _id = querystring.parse(delquery)['_id'];
    var where = {};
    var body = {status : "0"};

    if (typeof _id !== 'undefined') {
        var ObjectID = require('mongodb').ObjectID;
        var objid = new ObjectID(_id);
        where = {_id: objid};
    }

    _removeCard(req, where, body, function (error, results) {
        res.json({ error : error, results : results});
    });
};

function _insertCard(req, card, callback) {
    req.db.collection('cards', function(err, collection) {
        collection.insert(card, {safe:true}, callback);
    });
}

function _findCard(req, where, callback) {
    where = where || {};
    console.log("where: " + JSON.stringify(where));
    req.db.collection('cards', function(err, collection) {
        collection.find(where).toArray(callback);
    });
}

function _updateCard(req, where, body, callback) {
    console.log("where: " + JSON.stringify(where));
    console.log("body: " + JSON.stringify(body));
    req.db.collection('cards', function(err, collection) {
        collection.update(where, {$set : body}, callback);
    });
}

function _removeCard(req, where, body, callback) {
    req.db.collection('cards', function(err, collection) {
        collection.update(where, {$set : body}, callback);
        //collection.remove(where, callback);
    });
}