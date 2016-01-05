querystring = require('querystring');
async = require('async');
dateformat = require('dateformat');

exports.create = function (req, res) {
    var body = req.body;

    _insertReply(req, body, function (error, results) {
        res.json({error : error, results : results});
    });
};

exports.read = function(req, res) {
    var getquery = req.params.getquery;
    var _id = querystring.parse(getquery)['_id'];
    var rid = querystring.parse(getquery)['rid'];

    var where = {};

    if (typeof _id !== 'undefined') {
        var ObjectID = require('mongodb').ObjectID;
        var objid = new ObjectID(_id);

        console.log("where: " + JSON.stringify(where));
        where = {$and: [{status: "1"}, {_id: objid}]};

        _findReply(req, where, function (err, results) {
            console.log(results[0].reply);
            var reply = results[0].reply;
            var resultReply = [];
            var replyUser = [];
            var userInfo = {};

            console.log(JSON.stringify(results[0].reply));
            if (JSON.stringify(results[0].reply) == "[]") res.json(resultReply);

            for (var i = 0; i < reply.length; i++) {
                var curReply = reply[i];

                async.waterfall([
                    function(callback) {
                        callback(null, curReply);
                    },
                    function(curReply, callback) {
                        where = {$and: [{status: "1"}, {_id: new ObjectID(curReply)}]};
                        console.log("where:" + JSON.stringify(where));
                        req.db.collection('replies', function(err, collection) {
                            collection.find(where).toArray(callback);
                        });
                    }], function(err, result) {
                        console.log("reply results:" + JSON.stringify(result));
                        resultReply.push(result[0]);
                        var curUid = result[0].uid;
                        console.log("curUid: " + curUid);

                        async.waterfall([
                            function(callback) {
                                callback(null, curUid);
                            },
                            function(curUid, callback) {
                                where = {$and: [{status: "1"}, {_id: curUid}]};
                                console.log("where:" + JSON.stringify(where));
                                req.db.collection('user', function(err, collection) {
                                    collection.find(where).toArray(callback);
                                });
                            }
                        ], function(err, userresult) {

                            if (JSON.stringify(userresult) == "[]") {
                                var deletedUser = {
                                    "_id": "deleted-user",
                                    "nickname": "익명의 허니팁퍼",
                                    "profilephoto": "icon/icon1.png"
                                };
                                replyUser.push(deletedUser);
                                userresult[0] = deletedUser;
                            } else {
                                replyUser.push(userresult[0]);
                            }

                            var userid = userresult[0]._id;
                            userInfo[userid] = {"nickname" : userresult[0].nickname, "profilephoto" : userresult[0].profilephoto};

                            if (resultReply.length == reply.length && resultReply.length == replyUser.length) {
                                for (var index = 0; index < replyUser.length; index++) {
                                    var targetReply = resultReply[index];
                                    var targetUser;

                                    if (typeof userInfo[targetReply.uid] == 'undefined')
                                        targetUser= userInfo["deleted-user"];
                                    else
                                        targetUser = userInfo[targetReply.uid];

                                    console.log("targetUID: " + targetReply.uid + "targetUser: " + JSON.stringify(targetUser));

                                    targetReply.nickname = targetUser.nickname;
                                    targetReply.profilephoto = targetUser.profilephoto;
                                }

                                // sort by time
                                function sortResults(prop, asc) {
                                    resultReply = resultReply.sort(function(a, b) {
                                        if (asc) return (a[prop] > b[prop]) ? -1 : ((a[prop] < b[prop]) ? 1 : 0);
                                        else return (b[prop] > a[prop]) ? -1 : ((b[prop] < a[prop]) ? 1 : 0);
                                    });
                                }

                                sortResults('time', true);

                                if (index == resultReply.length) res.json(resultReply);
                            }
                        });
                    }
                )
            }
        });
    }

    if (typeof rid !== 'undefined') {
        var ObjectID = require('mongodb').ObjectID;
        var objid = new ObjectID(rid);

        console.log("where: " + JSON.stringify(where));
        where = {$and: [{status: "1"}, {_id: objid}]};

        _findOriginReply(req, where, function (err, results) {

            console.log(results);
            res.json(results);
        });
    }
};

exports.update = function (req, res) {
    var putquery = req.params.putquery;
    var _id = querystring.parse(putquery)['_id'];
    var where = {};
    var body = req.body;

    if (typeof _id !== 'undefined') {
        var ObjectID = require('mongodb').ObjectID;
        var objid = new ObjectID(_id);
        where = {_id: objid};
    }

    _updateReply(req, where, body, function (error, results) {
        res.json({error : error, results : results});
    });
};

exports.remove = function (req, res) {
    var delquery = req.params.delquery;
    var _id = querystring.parse(delquery)['_id'];
    var where = {};
    var body = req.body;

    if (typeof _id !== 'undefined') {
        var ObjectID = require('mongodb').ObjectID;
        var objid = new ObjectID(_id);
        where = {_id: objid};
    }

    _deleteReply(req, where, body, function (error, results) {
        res.json({error : error, results : results});
    });
};

function _insertReply(req, body, callback) {
    var stringId = null;
    body = typeof body === 'string' ? JSON.parse(body) : body;

    var where = {};

    console.log("body.nickname: " + JSON.stringify(body.nickname));

    var reply = {
        tid : body.tid,
        uid : body.uid,
        detail : body.detail,
        time : dateformat(new Date(), 'yy-mm-dd HH:MM:ss'),
        status : "1"
    };

    req.db.collection('replies', function(err, collection) {
        collection.insert(reply, {safe:true}, function (err, docsInserted) {

            var ops = docsInserted.ops[0];
            var tipid = reply.tid;

            console.log("tid: " + tipid);

            var ObjectID = require('mongodb').ObjectID;
            var objid = new ObjectID(tipid);
            where = {_id: objid};

            stringId = ops._id;

            var replyInTip = {"reply" : stringId.toString()};

            req.db.collection('tips', function(err, collection) {

                console.log("where: " + JSON.stringify(where));
                console.log("replyInTop: " + JSON.stringify(replyInTip));
                collection.update(where, {$addToSet : replyInTip}, callback);
            });
        });
    });
}

function _findReply(req, where, callback) {
    where = where || {};
    console.log("where: " + JSON.stringify(where));
    req.db.collection('tips', function(err, collection) {
        collection.find(where).toArray(callback);
    });
}

function _findOriginReply(req, where, callback) {
    where = where || {};
    console.log("where: " + JSON.stringify(where));
    req.db.collection('replies', function(err, collection) {
        collection.find(where).toArray(callback);
    });
}

function _updateReply(req, where, body, callback) {
    console.log("where: " + JSON.stringify(where));
    console.log("body: " + JSON.stringify(body));

    req.db.collection('tips', function(err, collection) {
        collection.update(where, {$pull: body});

        var ObjectID = require('mongodb').ObjectID;
        var objid = new ObjectID(body.reply);
        where = {_id: objid};

        req.db.collection('replies', function(err, collection) {

            console.log("reply where: " + JSON.stringify(where));
            body = {"status" : "0"};
            collection.update(where, {$set : body}, callback);
        });
    });
}

function _deleteReply(req, where, body, callback) {
    console.log("where: " + JSON.stringify(where));
    console.log("body: " + JSON.stringify(body));

    req.db.collection('tips', function(err, collection) {
        collection.update(where, {$pull: body});

        var ObjectID = require('mongodb').ObjectID;
        var objid = new ObjectID(body.reply);
        where = {_id: objid};

        req.db.collection('replies', function(err, collection) {

            console.log("reply where: " + JSON.stringify(where));
            body = {"status" : "0"};
            collection.update(where, {$set : body}, callback);
        });
    });
}
