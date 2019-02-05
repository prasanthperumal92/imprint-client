var Team = require('../models/team');
var User = require('../models/users');
var Job = require('../models/job');
var Task = require('../models/task');
var Client = require('../models/clients');
var async = require('async');
var _ = require('lodash');

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

    start = new Date(start);
    end = new Date(end);

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
            let teamPeopleIds = team.members.map(e => e.userId.toString());
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
                    console.log(teamPeopleData);
                    async.each(teamPeopleData, function (eachEmp, callback) {
                        Job.getJobByEmployeeId(eachEmp._id, start, end, function (err, jobData) {
                            if (jobData && jobData.length > 0) {
                                let tmp = filterDataCount(jobData, eachEmp.name, 'Aterm', 'effort.sales');
                                result = [...result, ...tmp];
                                callback();
                            }
                        })

                    }, function (err) {
                        console.log(err, result);
                        if (err) {
                            console.log('A file failed to process');
                        } else {
                            console.log('All files have been processed successfully');
                        }
                    });
                }
            });
        }
    });
}

function filterDataCount(arr, name, type, key) {
    var data = [];
    let split = key.split('.');
    for (let j = 0; j < arr.length; j++) {
        data.push({
            name: name,
            type: type,
            key: split.length === 0 ? arr[j][key] : arr[j][split[0]][split[1]],
            value: 1
        });
    }
    return data;
}