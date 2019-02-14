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

function flattenJob(arr) {
    let data = [];
    for (let i = 0; i < arr.length; i++) {
        let item = arr[i];
        let tmp = item.effort;
        for (let key in tmp) {
            item[key] = tmp[key];
        }
        item.effort = undefined;
        data.push(item);
    }
    return data;
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
                    let temp = JSON.parse(JSON.stringify(jobs));
                    jobs = flattenJob(temp);
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
                            let temp = JSON.parse(JSON.stringify(jobData));
                            result.job = flattenJob(temp);
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
                                        data: result,
                                        members: team.members
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

function getLeadQuery(user, start, end, cb) {
    let query = {};
    if (user.employee.type === "manager") {
        User.findById(user._id, function (err, userData) {
            if (err) {
                console.log(err);
                cb(err, null);
            } else {
                let emps = [];
                var employee = userData.toJSON();
                for (var i = 0; i < userData.employees.length; i++) {
                    if (userData.employees[i].reportingTo.equals(user.employee._id)) {
                        emps.push(userData.employees[i]._id);
                    }
                }
                query = {
                    'created': {
                        $gte: moment(start).startOf('day').toISOString(),
                        $lte: moment(end).endOf('day').toISOString(),
                    },
                    'employeeId': {
                        $in: emps
                    }
                }
                cb(null, query);
            }
        });
    } else {
        query = {
            'created': {
                $gte: moment(start).startOf('day').toISOString(),
                $lte: moment(end).endOf('day').toISOString(),
            },
            'employeeId': user.employee._id
        }
        cb(null, query);
    }
}

exports.getLeadStatus = function (req, res, next) {
    var user = req.user;
    var start = req.params.start;
    var end = req.params.end;

    getLeadQuery(user, start, end, function (err, query) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "Server is busy, Please try again!"
            })
        } else {
            let result = [];
            let data = {
                hot: 0,
                warm: 0,
                cold: 0
            };

            Job.find(query, function (err, jobs) {
                if (err) {
                    console.log(err);
                    return res.status(500).send({
                        message: "Server is busy, Please try again!"
                    })
                } else {
                    for (let i = 0; i < jobs.length; i++) {
                        if (jobs[i].effort.sales === "Introduction") {
                            data.cold++;
                        } else if (jobs[i].effort.sales === "Followup" || jobs[i].effort.sales === "Proposal") {
                            data.warm++;
                        } else if (jobs[i].effort.sales === "Demo") {
                            data.hot++;
                        }
                    }
                    result = [{
                            key: "Aterm",
                            value: data.hot
                        },
                        {
                            key: "Bterm",
                            value: data.warm
                        },
                        {
                            key: "Cterm",
                            value: data.cold
                        }
                    ]
                    return res.status(200).send(result);
                }
            })
        }
    });
}