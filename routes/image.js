var express = require('express');
var router = express.Router();
var image = require('../handlers/image.js');

router.get('/:path', image.read);

module.exports = router;