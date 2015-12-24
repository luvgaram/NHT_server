var formidable = require('formidable'),
    util = require('util'),
    path = require('path'),
    mime = require('mime'),
    fs = require('fs'),
    querystring = require('querystring'),
    dateformat = require('dateformat');

//var UPLOAD_FOLDER = __dirname + "/data";
var UPLOAD_FOLDER = "./data";

// set timezone
process.env.TZ = 'Asia/Seoul';

exports.create = function (req, res) {
    var form = new formidable.IncomingForm(),
        files = [],
        fields = [],
        newTip = {},
        result;

    form.uploadDir = UPLOAD_FOLDER;
    form.keepExtensions = true;
    form.multiple = "multiple";

    form.on ('field', function(field, value) {
        fields.push([field, value]);
    }).on ('file', function (field, file) {
        files.push([field, file]);
        console.log("files!!!! --- " + JSON.stringify(files));
    }).on ('progress', function(bytesReceived, bytesExpected) {
        console.log('progress: ' + bytesReceived + '/' + bytesExpected);
    }).on ('end', function() {
        console.log('-> upload done');

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
            fileInfos.push(fileInfo);
        }

        newTip.file = fileInfos;

        console.log('newTip - ' + JSON.stringify(newTip));
    });

    form.parse(req, function(err, fields, files) {
        var locationInfo = {
            type: "Point",
            coordinates : [parseFloat(fields ["longitude"]), parseFloat(fields ["latitude"])]
        }
        newTip.storename = fields["storename"];
        newTip.tipdetail = fields["tipdetail"];
        newTip.uid = fields["uid"] || "user1";
        newTip.nickname = fields["nickname"] || "익명의 허니팁퍼";
        newTip.profilephoto = fields["profilephoto"] || "icon/profilephoto1.png";
        newTip.date = dateformat(new Date(), 'yy-mm-dd HH:MM:ss');
        newTip.loc = locationInfo,
        newTip.status = "1";

        _insertTip(req, newTip, function (error, results) {
            result["error"] = error;
            result["results"] = results;
            res.end(JSON.stringify(newTip));
        });
    });
};

exports.read = function(req, res) {
    var getquery = req.params.getquery;
    var _id = querystring.parse(getquery)['_id'];
    var uid = querystring.parse(getquery)['uid'];
    //var nid = querystring.parse(getquery)['nid'];
    var where = {status: "1"};

    if (typeof _id !== 'undefined') {
        var ObjectID = require('mongodb').ObjectID;
        var objid = new ObjectID(_id);
        where = {$and: [{status: "1"},{_id: objid}]};
    }

    if (typeof uid !== 'undefined') {
        where = {$and: [{status: "1"},{uid: uid}]};
    }

    console.log("where: " + JSON.stringify(where));
    _findTip(req, where, function (err, results) {
        // res.json({error: err, results: results});
        res.json(results);
    });
};

exports.update = function(req, res) {
    var putquery = req.params.putquery;
    var _id = querystring.parse(putquery)['_id'];
    var where = {};
    var body = req.body;
    var uid = body.uid;

    if (typeof _id !== 'undefined' && typeof uid !== 'undefined') {
        var ObjectID = require('mongodb').ObjectID;
        var objid = new ObjectID(_id);

        where = {$and: [{uid: uid},{_id: objid}]};
    }

    _updateTip(req, where, body, function(error, results) {
        res.json( {error: error, results : results});
    });
};

exports.remove = function (req, res) {
    var delquery = req.params.delquery;
    var _id = querystring.parse(delquery)['_id'];
    var where = {};
    var body = req.body;
    var uid = body.uid;
    body = {status : "0"};

    if (typeof _id !== 'undefined' && typeof uid !== 'undefined') {
        var ObjectID = require('mongodb').ObjectID;
        var objid = new ObjectID(_id);
        where = {$and: [{uid: uid},{_id: objid}]};
    }

    _removeTip(req, where, body, function (error, results) {
        res.json({ error : error, results : results});
    });
};

function _insertTip(req, tip, callback) {
    req.db.collection('tips', function(err, collection) {
        collection.insert(tip, {safe:true}, callback);
    });
}

function _findTip(req, where, callback) {
    where = where || {};
    console.log("where: " + JSON.stringify(where));
    req.db.collection('tips', function(err, collection) {
        collection.find(where).toArray(callback);
    });
}

function _updateTip(req, where, body, callback) {
    console.log("where: " + JSON.stringify(where));
    console.log("body: " + JSON.stringify(body));
    req.db.collection('tips', function(err, collection) {
        collection.update(where, {$set : body}, callback);
    });
}

function _removeTip(req, where, body, callback) {
    console.log("where: " + JSON.stringify(where));
    console.log("body: " + JSON.stringify(body));
    req.db.collection('tips', function(err, collection) {
        collection.update(where, {$set : body}, callback);
        //collection.remove(where, callback);
    });
}