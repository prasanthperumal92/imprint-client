var Team = require('../models/team');
var User = require('../models/users');
var Job = require('../models/job');
var Task = require('../models/task');
var Client = require('../models/clients');
var async = require('async');
var _ = require('lodash');
var moment = require('moment');

exports.getChartDateCount = function (req, res, next) {
    var user = req.user;
    var type = req.params.type;
    var start = req.params.start;
    var end = req.params.end;

    let query = {
        task: {
            $or: [{
                    'assignedTo': user.employee._id
                },
                {
                    'assignedBy': user.employee._id
                }
            ],
            'modified': {
                $gte: moment(start).startOf('day').toISOString(),
                $lte: moment(end).endOf('day').toISOString(),
            }
        },
        job: {
            'created': {
                $gte: moment(start).startOf('day').toISOString(),
                $lte: moment(end).endOf('day').toISOString(),
            },
            'employeeId': user.employee._id
        },
        client: {
            'modified': {
                $gte: moment(start).startOf('day').toISOString(),
                $lte: moment(end).endOf('day').toISOString(),
            },
            'assignedTo': user.employee._id
        }
    }

    // let todayStart = moment().startOf('day').toDate();
    // let todayEnd = moment().endOf('day').toDate();

    // let weekStart = moment().startOf("isoWeek").toDate();
    // let weekEnd = moment().endOf("isoWeek").toDate();

    // let monthStart = moment().startOf("month").toDate();
    // let monthEnd = moment().endOf("month").toDate();      

    async.parallel({
        job: function (callback) {
            Job.find(query.job, function (err, jobs) {
                if (err) {
                    console.log(err);
                    jobs = [];
                }
                callback(null, jobs);
            });
        },
        task: function (callback) {
            Task.find(query.task, function (err, tasks) {
                if (err) {
                    console.log(err);
                    tasks = [];
                }
                callback(null, tasks);
            });
        },
        client: function (callback) {
            Client.find(query.client, function (err, clients) {
                if (err) {
                    console.log(err);
                    clients = [];
                }
                callback(null, clients);
            });
        }
    }, function (err, results) {
        console.log(query);
        console.log(results);
        return res.status(200).send([{
                key: 'Aterm',
                value: results.job.length
            },
            {
                key: 'Bterm',
                value: results.task.length
            },
            {
                key: 'Cterm',
                value: results.client.length
            }
        ]);
    });

}