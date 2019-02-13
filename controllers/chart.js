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

exports.getDataDownload = function (req, res, next) {
    var user = req.user;
    var type = req.params.type;
    var start = req.params.start;
    var end = req.params.end;
    var id = req.params.id;

    if (type !== 'team') {
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
            console.log(results);
            return res.status(200).send(results);
        });
    } else if (type === 'team') {
        start = moment(start).startOf('day').toISOString();
        // end today
        end = moment(end).endOf('day').toISOString();

        var result = {};

        Team.findById(id, function (err, team) {
            if (err) {
                console.log(err);
                return res.status(500).send({
                    message: "Server is busy, Please try again!"
                })
            } else {
                console.log(team);
                let teamPeopleIds = team.members.map(e => e.userId);
                teamPeopleIds.push(team.leaderId);
                let teamPeopleData = [];
                User.findById({
                    _id: user._id
                }, function (err, employees) {
                    if (err) {
                        console.log(err);
                        return res.status(500).send({
                            message: "Server is busy, Please try again!"
                        })
                    } else {
                        let emps = employees.employees;
                        for (let j = 0; j < emps.length; j++) {
                            let _id = emps[j]._id.toString();
                            if (teamPeopleIds.indexOf(_id) > -1) {
                                teamPeopleData.push({
                                    _id: emps[j]._id,
                                    name: emps[j].name
                                });
                            }
                        }
                        console.log(teamPeopleIds, start, end);
                        Job.getJobByEmployeeId(teamPeopleIds, start, end, function (err, jobData) {
                            if (err) {
                                console.log(err);
                                return res.status(500).send({
                                    message: "Server is busy, Please try again!"
                                })
                            }
                            result.job = jobData;
                            console.log(result);
                            Task.getTaskByEmployeeId(teamPeopleIds, start, end, function (err, taskData) {
                                if (err) {
                                    console.log(err);
                                    return res.status(500).send({
                                        message: "Server is busy, Please try again!"
                                    })
                                }
                                result.task = taskData;
                                console.log(result);
                                Client.getClientByEmployeeId(teamPeopleIds, start, end, function (err, clientData) {
                                    if (err) {
                                        console.log(err);
                                        return res.status(500).send({
                                            message: "Server is busy, Please try again!"
                                        })
                                    }
                                    result.client = clientData;
                                    console.log(result);
                                    return res.status(200).send({
                                        title: team.name,
                                        leaderId: team.leaderId,
                                        data: result
                                    });
                                });
                            });
                        });
                    }
                });
            }
        });
    }
}