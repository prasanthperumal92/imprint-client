var Job = require('../models/job');
var User = require('../models/users');
var ObjectId = require("mongoose").Schema.Types.ObjectId;
var moment = require('moment');

exports.createJob = function (req, res, next) {
    var user = req.user;
    var effort = req.body;

    if (!effort || Object.keys(effort).length === 0) {
        return res.status(400).send({
            message: "Some Mandatory field is missing"
        });
    }

    if (!effort.clientId) {
        return res.status(400).send({
            message: "Client Id is missing"
        });
    }

    effort.employeeId = user.employee._id;
    effort.name = user.employee.name;
    effort.created = new Date();
    effort = new Job(effort);
    effort.save(function (err) {
        if (err) {
            return res.status(500).send({
                message: "Error Creating Job"
            });
        } else {
            return res.status(201).send();
        }
    });
}

exports.getJob = function (req, res, next) {
    var user = req.user;
    var id = req.params.id;
    let skip = req.params.skip;

    if (id && (typeof skip === undefined || skip == "" || skip == null)) {
        Job.getJobById(id, function (err, job) {
            if (err) {
                return res.status(500).send({
                    message: "Error Looking up for Job"
                });
            } else {
                return res.status(200).send(job);
            }
        });
    } else if (skip) {
        skip = parseInt(skip);
        if (user.type === 'employee') {
            Job.getJobs([user.employee._id], skip, function (err, jobs) {
                if (err) {
                    return res.status(500).send({
                        message: "Error Looking up for Job"
                    });
                } else {
                    return res.status(200).send(jobs);
                }
            });
        } else {
            User.findByUserId(user._id, function (err, userProfile) {
                if (err) {
                    return res.status(500).send({
                        message: "Error Looking up for Job"
                    });
                } else {
                    let team = [];
                    team.push(user.employee._id);
                    for (let i = 0; i < userProfile.employees.length; i++) {
                        if (userProfile.employees[i].reportingTo.equals(user.employee._id)) {
                            team.indexOf(userProfile.employees[i]._id) === -1 ? team.push(userProfile.employees[i]._id) : '';
                        }
                    }
                    if (team.length === 0) {
                        return res.status(200).send(team);
                    } else {
                        Job.getJobs(team, skip, function (err, jobs) {
                            console.log(err, jobs);
                            if (err) {
                                return res.status(500).send({
                                    message: "Error Looking up for Job"
                                });
                            } else {
                                return res.status(200).send(jobs);
                            }
                        });
                    }
                }
            });
        }
    } else {
        return res.status(400).send({
            message: "Pass Job id and skip with the url"
        });
    }

}

exports.getJobs = function (req, res, next) {
    var user = req.user;
    var input = req.body;
    let teams = [];

    if (!input || Object.keys(input).length === 0) {
        return res.status(400).send({
            message: "Request cannot be null"
        });
    } 

    !input.skip ? input.skip = 0 : '';
    !input.limit ? input.limit = 20 : '';
    !input.sort ? input.sort = 'created' : '';

    getMyTeam(user._id, user.employee._id, function (team) {
        let query;
        teams = team;
        teams.push(user.employee._id);
        let start = new Date(input.startDate);
        start.setHours(0, 0, 0, 0);        
        if (input.startDate && input.endDate) {
            let end = new Date(input.endDate);
            end.setHours(23, 59, 59, 999);
            query = {
                employeeId: {
                    $in: teams
                },
                created: {
                    $gte: start,
                    $lte: end
                }
            };
        } else {
            let end = new Date(input.startDate);
            end.setHours(23, 59, 59, 999);
            query = {
                employeeId: {
                    $in: teams
                },
                created: {
                    $gte: start,
                    $lte: end
                }
            };
        }
        console.log(query);
        Job.getJobsDynamic(query, input.sort, input.skip, input.limit, function(err, data){
            if (err) {
                return res.status(500).send({
                    message: "Error Looking up for Job"
                });
            } else {
                return res.status(200).send(data);
            }
        });
    });
}

function getMyTeam(userId, employeeId, cb) {
    User.findByUserId(userId, function (err, userProfile) {
        let team = [];
        if (err) {
            console.log(err);
            cb(team);
        } else {
            for (let i = 0; i < userProfile.employees.length; i++) {
                if (userProfile.employees[i].reportingTo.equals(employeeId)) {
                    team.indexOf(userProfile.employees[i]._id) === -1 ? team.push(userProfile.employees[i]._id) : '';
                }
            }
            cb(team);
        }
    });
}