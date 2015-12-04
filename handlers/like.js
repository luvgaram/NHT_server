querystring = require('querystring');

exports.update = function (req, res) {
    var putquery = req.params.putquery;
    var _id = querystring.parse(putquery)['_id'];
    var body = req.body;

    if (typeof _id !== 'undefined') {
        var ObjectID = require('mongodb').ObjectID;
        var objid = new ObjectID(_id);

        where = {_id: objid};
    }

    _updateLike(req, where, body, function(error, results) {
        res.json( {error: error, results : results});
    });

};

exports.read = function(req, res) {
    var getquery = req.params.getquery;
    var _id = querystring.parse(getquery)['_id'];
    var where = {};

    if (typeof _id !== 'undefined') {
        var ObjectID = require('mongodb').ObjectID;
        var objid = new ObjectID(_id);
        where = {$and: [{status: "1"}, {_id: objid}]};
    }

    _findLike(req, where, function (err, results) {

        console.log((results[0].like).toString());
        res.json(results[0].like);
        //res.json(results);
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

    _deleteLike(req, where, body, function (error, results) {
        res.json({error : error, results : results});
    });
};

function _findLike(req, where, callback) {
    where = where || {};
    console.log("where: " + JSON.stringify(where));
    req.db.collection('tips', function(err, collection) {
        collection.find(where).toArray(callback);
    });
}

function _updateLike(req, where, body, callback) {
    console.log("where: " + JSON.stringify(where));
    console.log("body: " + JSON.stringify(body));
    req.db.collection('tips', function(err, collection) {
        collection.update(where, {$addToSet : body}, callback);
    });
}

function _deleteLike(req, where, body, callback) {
    console.log("where: " + JSON.stringify(where));
    console.log("body: " + JSON.stringify(body));
    req.db.collection('tips', function(err, collection) {
        collection.update(where, {$pull: body}, callback);
    });
}
