var fs = require('fs'),
	querystring = require('querystring');
var UPLOAD_FOLDER = "./data";

exports.read = function(req, res) {

    var path = req.params.path;

    var photo = querystring.parse(path)['photo'];
    var icon = querystring.parse(path)['icon'];

    console.log("path: " + path);

    if (typeof photo !== 'undefined') {
    	console.log(photo);
        res.sendfile(photo,
	        { root: './data'},
	        function(err) {
	            if (err) res.json(err);
	        });
    } else if (typeof icon !== 'undefined') {
        res.sendfile(icon,
	        { root: './icon'},
	        function(err) {
	            if (err) res.json(err);
	        });
    }
};