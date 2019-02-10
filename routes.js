var express = require('express');
var router = express.Router();

const cookie = require('./services/cookie');
const client = require('./controllers/client');
const meta = require('./controllers/meta');
const job = require('./controllers/job');
const task = require('./controllers/task');
const employee = require('./controllers/employee');
const leave = require('./controllers/leave');
const track = require('./controllers/track');
const team = require('./controllers/team');
const chart = require('./controllers/chart');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'Express'
    });
});

// Common API
router.get('/calendar/:year/:month', cookie.Authenticate, meta.getAllDetails);

// Profile API
router.get('/employee', cookie.Authenticate, employee.getProfile);
router.get('/employee/photos', cookie.Authenticate, employee.getPhotos);
router.post('/employee', cookie.Authenticate, employee.updateEmployee);
router.put('/employee', cookie.Authenticate, employee.changePassword);
router.delete('/employee', cookie.Authenticate, employee.logout);

// Client API :: Allow to add clients and list
router.post('/clients', cookie.Authenticate, client.addClient);
router.put('/clients', cookie.Authenticate, client.editClient);
router.get('/clients/:id?', cookie.Authenticate, client.clientList);
router.post('/clients/reference', cookie.Authenticate, client.addReference);
router.get('/search/clients/:text', cookie.Authenticate, client.searchClient);
router.get('/all/clients/:limit/:skip', cookie.Authenticate, client.getLimitedClient);

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
// Web
router.post('/task/get', cookie.Authenticate, task.getWebTasks);

// LEAVE : API
router.post('/leave', cookie.Authenticate, leave.createLeave);
router.put('/leave', cookie.Authenticate, leave.updateLeave);
router.get('/leave/:status?', cookie.Authenticate, leave.getLeaves);
router.post('/leaves', cookie.Authenticate, leave.getWebLeaves);

// TRACK : API
router.post('/track', cookie.Authenticate, track.createTracks);
router.get('/track/:id?/:date?', cookie.Authenticate, track.getTracks);

// Team : API
router.post('/team', cookie.Authenticate, team.createTeam);
router.get('/team/:id?', cookie.Authenticate, team.getTeams);
router.put('/team', cookie.Authenticate, team.updateTeam);
router.delete('/team/:id', cookie.Authenticate, team.deleteTeam);
router.get('/team/chart/:id/:start/:end', cookie.Authenticate, team.getTeamCharts);

router.get('/chart/:type/:start/:end', cookie.Authenticate, chart.getChartDateCount);

module.exports = router;