var Team = require('../models/team');
var User = require('../models/users');
var Job = require('../models/job');
var Task = require('../models/task');
var Client = require('../models/clients');
var async = require('async');
var _ = require('lodash');
var moment = require('moment');

exports.createTeam = function (req, res, next) {
    var user = req.user;
    var team = req.body;

    if (!team || (team && team.length == 0)) {
        return res.status(400).send({
            message: "No Team Data to save!"
        })
    }

    team.companyId = user._id;
    team.created = team.modified = new Date();

    var teamData = new Team(team);

    teamData.save(function (err, result) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "Server is busy, Please try again!"
            })
        } else {
            return res.status(201).send();
        }
    });

}


exports.getTeams = function (req, res, next) {
    var user = req.user;
    var id = req.params.id;

    var query = {
        companyId: user._id
    };

    if (id) {
        query._id = id;
    }

    Team.find(query, function (err, teams) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "Server is busy, Please try again!"
            })
        } else {
            return res.status(201).send(teams);
        }
    });
}

exports.updateTeam = function (req, res, next) {
    var user = req.user;
    var team = req.body;

    if (!team || (team && team.length == 0) || !team._id || !team.leaderId || team.members.length === 0) {
        return res.status(400).send({
            message: "No Team Data to save!"
        })
    }

    Team.update({
        _id: team._id
    }, {
        $set: {
            name: team.name,
            leaderId: team.leaderId,
            modified: new Date(),
            members: team.members
        }
    }, function (err, updated) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "Server is busy, Please try again!"
            })
        } else {
            return res.status(201).send();
        }
    });
};

exports.deleteTeam = function (req, res, next) {
    var user = req.user;
    var id = req.params.id;

    if (!id) {
        return res.status(400).send({
            message: "Cannot delete Team now!!"
        })
    }

    Team.remove({
        _id: id
    }, function (err, deleted) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "Server is busy, Please try again!"
            })
        } else {
            return res.status(201).send();
        }
    })
}

exports.getTeamCharts = function (req, res, next) {
    var user = req.user;
    var id = req.params.id;
    var start = req.params.start;
    var end = req.params.end;

    start = moment(start).startOf('day').toISOString();
    // end today
    end = moment(end).endOf('day').toISOString();

    console.log(req.params);
    var result = [];

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
                        if (jobData && jobData.length > 0) {
                            let tmp = filterDataCount(jobData, 'Aterm', 'effort.sales');
                            result = [...result, ...tmp];
                        }
                        console.log(result);
                        Task.getTaskByEmployeeId(teamPeopleIds, start, end, function (err, taskData) {
                            if (err) {
                                console.log(err);
                                return res.status(500).send({
                                    message: "Server is busy, Please try again!"
                                })
                            }
                            if (taskData && taskData.length > 0) {
                                let tmp = filterDataCount(taskData, 'Bterm', 'status');
                                result = [...result, ...tmp];
                            }
                            console.log(result);
                            Client.getClientByEmployeeId(teamPeopleIds, start, end, function (err, clientData) {
                                if (err) {
                                    console.log(err);
                                    return res.status(500).send({
                                        message: "Server is busy, Please try again!"
                                    })
                                }
                                if (clientData && clientData.length > 0) {
                                    let tmp = filterDataCount(clientData, 'Cterm', 'name');
                                    result = [...result, ...tmp];
                                }
                                result = addEmptyForNone(result, teamPeopleIds);
                                console.log(result);
                                return res.status(200).send({
                                    id: team._id,
                                    title: team.name,
                                    leaderId: team.leaderId,
                                    data: result,
                                    columns: ["name", "type", "value"]
                                });
                            });
                        });
                    });
                }
            });
        }
    });
}

function addEmptyForNone(arr, ids) {
    for (let i = 0; i < ids.length; i++) {
        let userData = _.filter(arr, {
            name: ids[i]
        });
        console.log(userData)
        if (userData && userData.length > 0) {
            let types = {
                Bterm: 0,
                Aterm: 0,
                Cterm: 0
            };
            for (let j = 0; j < userData.length; j++) {
                types[userData[j].type]++;
            }
            for (let key in types) {
                if (types[key] === 0) {
                    arr.push({
                        name: ids[i],
                        type: key,
                        value: 0
                    });
                }
            }
        } else {
            if (userData) {
                arr.push({
                    name: ids[i],
                    type: "Aterm",
                    value: 0
                })
                arr.push({
                    name: ids[i],
                    type: "Bterm",
                    value: 0
                })
                arr.push({
                    name: ids[i],
                    type: "Cterm",
                    value: 0
                })
            }
        }
    }
    return arr;
}

function filterDataCount(arr, type, key) {
    var data = [];
    let split = key.split('.');
    for (let j = 0; j < arr.length; j++) {
        data.push({
            name: arr[j].employeeId || arr[j].assignedTo,
            type: type,
            value: 1
        });
    }
    return data;
}