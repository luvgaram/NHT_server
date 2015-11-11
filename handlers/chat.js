// set timezone
process.env.TZ = 'Asia/Seoul';

exports.create = function (req, res) {
    var body = req.body;
    _insertChat(req, body, function (error, results) {
        res.json( {error: error, results: results});
    });
};

exports.read = function (req, res){
    var getquery = req.params.getquery;
    var ObjectID = require('mongodb').ObjectID;
    var objid = new ObjectID(getquery);
    var where = {articleid: objid};

    _findChat(req, where, function (error, results) {
        res.json( {error: error, results : results});
    });
};

function _insertChat(req, body, callback) {
    body = typeof body === 'string' ? JSON.parse(body) : body;
    console.log("body.nickname: " + JSON.stringify(body.nickname));
    var chat = {
        articleid : body.articleid,
        nickname : body.nickname,
        userid : body.userid,
        icon : body.icon,
        content : body.content,
        time : new Date().toLocaleString()
    };

    req.db.collection('chats', function(err, collection) {
       collection.insert(chat, {safe:true}, callback);
    });
}

function _findChat(req, where, callback) {
    where = where || {};

    req.db.collection('chats', function(err, collection) {
       collection.find(where).toArray(callback);
    });
}
