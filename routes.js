var express = require('express');
var router = express.Router();

const cookie = require('./services/cookie');
const client = require('./controllers/client');
const meta = require('./controllers/meta');
const job = require('./controllers/job');
const task = require('./controllers/task');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'Express'
    });
});

// Client API :: Allow to add clients and list
router.post('/clients', cookie.Authenticate, client.addClient);
router.get('/clients/:name?', cookie.Authenticate, client.clientList);

// DSR Form Meta Data - APP
router.get('/meta/:name', cookie.Authenticate, meta.getMeta);
router.get('/job/dsr/:id?/:skip?', cookie.Authenticate, job.getJob);
router.post('/job/dsr', cookie.Authenticate, job.createJob);

 // Web 
router.post('/job/dsr/get', cookie.Authenticate, job.getJobs);
router.get('/job/filters/dsr', cookie.Authenticate, job.getFilters);
router.get('/job/get/dsr/:id', job.getJobForShare);
router.delete('/job/dsr/:id', cookie.Authenticate, job.deleteJob);


// TASK : API
router.post('/task', cookie.Authenticate, task.createTask);
router.get('/task', cookie.Authenticate, task.getTasks);
router.get('/task/:id', cookie.Authenticate, task.getTask);

module.exports = router;
