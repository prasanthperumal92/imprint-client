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

    if (user.employee.type === "manager") {
        getLeadQuery(user, function (err, emps) {
            if (err) {
                console.log(err);
                return res.status(500).send({
                    message: "Server is busy, Please try again!"
                })
            } else {
                query = {
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
                        'employeeId': {
                            $in: emps
                        }
                    },
                    client: {
                        'modified': {
                            $gte: moment(start).startOf('day').toISOString(),
                            $lte: moment(end).endOf('day').toISOString(),
                        },
                        $or: [{
                                'assignedTo': user.employee._id
                            },
                            {
                                'createdBy': user.employee._id
                            }
                        ],
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
        });
    } else {
        query = {
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


exports.getLeadStatus = function (req, res, next) {
    var user = req.user;
    var start = req.params.start;
    var end = req.params.end;
    let query = {};

    if (user.employee.type === "manager") {
        getLeadQuery(user, function (err, emps) {
            if (err) {
                console.log(err);
                return res.status(500).send({
                    message: "Server is busy, Please try again!"
                })
            } else {
                query = {
                    'modified': {
                        $gte: moment(start).startOf('day').toISOString(),
                        $lte: moment(end).endOf('day').toISOString(),
                    },
                    $or: [{
                            'assignedTo': {
                                $in: emps
                            }
                        },
                        {
                            'createdBy': {
                                $in: emps
                            }
                        }
                    ]
                }

                let result = [];
                let data = {};
                console.log(JSON.stringify(query));
                Client.find(query, function (err, clients) {
                    if (err) {
                        console.log(err);
                        return res.status(500).send({
                            message: "Server is busy, Please try again!"
                        })
                    } else {
                        console.log("Clients", clients);
                        for (let i = 0; i < clients.length; i++) {
                            let key = clients[i].status;
                            if (key) {
                                data[key] ? data[key]++ : data[key] = 1;
                            }
                        }
                        if (Object.keys(data).length > 0) {
                            for (let prop in data) {
                                result.push({
                                    key: prop,
                                    value: data[prop]
                                });
                            }
                        }
                        return res.status(200).send(result);
                    }
                });
            }
        });
    } else {
        query = {
            'modified': {
                $gte: moment(start).startOf('day').toISOString(),
                $lte: moment(end).endOf('day').toISOString(),
            },
            $or: [{
                    'assignedTo': user.employee._id
                },
                {
                    'createdBy': user.employee._id
                }
            ]
        }

        let result = [];
        let data = {};
        console.log(query);
        Client.find(query, function (err, clients) {
            if (err) {
                console.log(err);
                return res.status(500).send({
                    message: "Server is busy, Please try again!"
                })
            } else {
                console.log("Clients", clients);
                for (let i = 0; i < clients.length; i++) {
                    let key = clients[i].status;
                    if (key) {
                        data[key] ? data[key]++ : data[key] = 1;
                    }
                }
                if (Object.keys(data).length > 0) {
                    for (let prop in data) {
                        result.push({
                            key: prop,
                            value: data[prop]
                        });
                    }
                }
                return res.status(200).send(result);
            }
        });
    }
}

exports.getLeadData = function (req, res, next) {
    var user = req.user;
    var start = req.params.start;
    var end = req.params.end;
    var status = req.params.term;
    let query = {};

    if (user.employee.type === "manager") {
        getLeadQuery(user, function (err, emps) {
            if (err) {
                console.log(err);
                return res.status(500).send({
                    message: "Server is busy, Please try again!"
                })
            } else {
                let project = {
                    name: true,
                    clientId: true,
                    status: true,
                    address: true,
                    city: true,
                    state: true,
                    person: true,
                    assignedTo: true,
                    createdBy: true
                };
                query = {
                    'modified': {
                        $gte: moment(start).startOf('day').toISOString(),
                        $lte: moment(end).endOf('day').toISOString(),
                    },
                    status: status,
                    $or: [{
                            'assignedTo': {
                                $in: emps
                            }
                        },
                        {
                            'createdBy': {
                                $in: emps
                            }
                        }
                    ]
                }

                console.log(JSON.stringify(query));
                Client.find(query, project, function (err, clients) {
                    if (err) {
                        console.log(err);
                        return res.status(500).send({
                            message: "Server is busy, Please try again!"
                        })
                    } else {
                        return res.status(200).send(clients);
                    }
                });
            }
        });
    } else {
        let project = {
            name: true,
            clientId: true,
            status: true,
            address: true,
            city: true,
            state: true,
            person: true,
            assignedTo: true,
            createdBy: true
        };
        query = {
            'modified': {
                $gte: moment(start).startOf('day').toISOString(),
                $lte: moment(end).endOf('day').toISOString(),
            },
            status: status,
            $or: [{
                    'assignedTo': user.employee._id
                },
                {
                    'createdBy': user.employee._id
                }
            ]
        }

        console.log(query);
        Client.find(query, project, function (err, clients) {
            if (err) {
                console.log(err);
                return res.status(500).send({
                    message: "Server is busy, Please try again!"
                })
            } else {
                return res.status(200).send(clients);
            }
        });
    }
}