/**
 * Created by eunjoo on 2015. 11. 11..
 */


exports.create = function (req, res) {
    var body = req.body;
    _insertMemo(req, body, function (error, results) {
        res.json( {error: error, results: results});
    });
};

exports.read = function (req, res){
    var where = req.query;

    _findMemo(req, where || {}, function (error, results) {
        res.json( {error: error, results : results});
    });
};

exports.update = function(req, res) {
    var where = req.query;
    var body = req.body;

    _updateMemo(req, where, body, function(error, results) {
        res.json( {error: error, results : results});
    });
};


exports.remove = function (req, res) {
    var where = req.query;

    _removeMemo(req, where, function (error, results) {
        res.json({ error : error, results : results});
    });
};

function _insertMemo(req, body, callback) {
    body = typeof body === 'string' ? JSON.parse(body) : body;
    var memo = {
        _id : body._id,
        author : body.author,
        memo : body.memo,
        date : new Date(body.date)
    };

    req.db.collection('test', function(err, collection) {
       collection.insert(memo, {safe:true}, callback);
    });
}

function _findMemo(req, where, callback) {
    where = where || {};

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