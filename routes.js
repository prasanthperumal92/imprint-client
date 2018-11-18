var express = require('express');
var router = express.Router();

const cookie = require('./services/cookie');
const client = require('./controllers/client');
const meta = require('./controllers/meta');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'Express'
    });
});

// Client API :: Allow to add clients and list
router.post('/clients', cookie.Authenticate, client.addClient);
router.get('/clients', cookie.Authenticate, client.clientList);

// DSR Form Meta Data
router.get('/meta/:name', cookie.Authenticate, meta.getMeta);

module.exports = router;
