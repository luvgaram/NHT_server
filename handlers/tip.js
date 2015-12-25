var formidable = require('formidable'),
    path = require('path'),
    querystring = require('querystring'),
    dateformat = require('dateformat'),
    async = require('async');

//var UPLOAD_FOLDER = __dirname + "/data";
var UPLOAD_FOLDER = "./data";
var dateScope = 7;

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

    form.parse(req, function(err, fields) {
        var locationInfo = {
            type: "Point",
            coordinates : [parseFloat(fields ["longitude"]), parseFloat(fields ["latitude"])]
        }
        newTip.storename = fields["storename"];
        newTip.tipdetail = fields["tipdetail"];
        newTip.uid = fields["uid"] || "user1";
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
    var sid = querystring.parse(getquery)['sid'];
    var longitude = querystring.parse(getquery)['long'];
    var latitude = querystring.parse(getquery)['lat'];
    var distance = querystring.parse(getquery)['dis'];
    var where = {status: "1"};

    if (typeof _id !== 'undefined') {
        var ObjectID = require('mongodb').ObjectID;
        var objid = new ObjectID(_id);
        where = {$and: [{status: "1"},{_id: objid}]};

        _findTip(req, where, function (err, results) {
            res.json(results);
        });
    } else if (typeof uid !== 'undefined') {
        where = {$and: [{status: "1"},{uid: uid}]};

        _findTip(req, where, function (err, results) {
            res.json(results);
        });
    } else if (typeof longitude !== 'undefined' && typeof latitude !== 'undefined' && typeof sid !== 'undefined' ) {

        var date = new Date();
        date.setDate(date.getDate() - dateScope);
        var searchingDate = dateformat(date, 'yy-mm-dd HH:MM:ss');

        var long = parseFloat(longitude);
        var lat = parseFloat(latitude);
        var disMul = 3963.2;
        var mToMile = 0.000621371;
        var desKm = 3000;

        if (typeof distance !== 'undefined') desKm = distance;

        where =
            {$and: [{status: "1"},
                    {date: {$gte: searchingDate}},
                    {loc :
                        {$geoWithin :
                            {$centerSphere :
                                [[long,lat], (desKm * mToMile) / disMul]
                            }
                        }
                    }]
            };
        var command = { geoNear: 'tips',
            near: [ parseFloat(longitude), parseFloat(latitude) ],
            spherical: true,
            distanceMultiplier: disMul,
            query: where
        };

        _findNearTip(req, command, function (resultsWithStats) {
            var nearTips = [];
            var tipIds = [];

            resultsWithStats = JSON.parse(resultsWithStats);
            //console.log(resultsWithStats);

            for (var i = 0; i < resultsWithStats.results.length; i++) {
                var middleTip = resultsWithStats.results[i];
                //console.log("middletip: " + middleTip.toString());

                async.waterfall([
                    function(callback){
                        var tipResult;
                        tipResult = middleTip.obj;
                        tipResult.dis = middleTip.dis;
                        callback(null, tipResult);
                    },
                    function(tipResult, callback){
                        callback(null, tipResult, {"_id": tipResult.uid});
                    },
                    function(tipResult, where, callback) {
                        req.db.collection('user', function(err, collection) {
                            nearTips.push(tipResult);
                            console.log("tipResult: " + JSON.stringify(tipResult.storename));
                            collection.find(where).toArray(callback);
                        });
                    }
                ], function (err, results) {
                    tipIds.push(results[0]);

                    var index = tipIds.length - 1;

                    if (index >= 0) {

                        var targetTip =  nearTips[index];
                        targetTip.nickname = tipIds[index].nickname;
                        targetTip.profilephoto = tipIds[index].profilephoto;
                        targetTip.dis =  Math.floor(targetTip.dis / mToMile);

                        var like = targetTip.like;

                        if (like == null) {
                            targetTip.like = 0;
                            targetTip.isliked = false;

                        } else {
                            var isLiked = false;
                            for (var i = 0; i < like.length; i++) {
                                console.log("uid: " + like[i]);
                                if (like[i] == sid) {
                                    isLiked = true;
                                    break;
                                }
                            }
                            targetTip.like = like.length;
                            targetTip.isliked = isLiked;
                        }
                    } else (res.json(err));

                    if (index == nearTips.length - 1) {
                        res.json(nearTips);
                    }
                });
            }
            //res.json(nearTips);
        });

    } else {
        console.log("where: " + JSON.stringify(where));
        _findTip(req, where, function (err, results) {
            res.json(results);
        });
    }

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

function _findNearTip(req, command, callback) {
    command = command || {};
    console.log("command: " + JSON.stringify(command));
    console.log("db: " + req.db.toString());

    req.db.command(command, req.db, function(err, resultsWithStats) {
        console.log("_findNearTip:" + JSON.stringify(resultsWithStats.results));
        callback(JSON.stringify(resultsWithStats));
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