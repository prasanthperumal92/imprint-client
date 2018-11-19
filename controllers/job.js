var Job = require('../models/job');
var User = require('../models/users');
var ObjectId = require("mongoose").Schema.Types.ObjectId;

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
    } else if(skip) {       
        skip = parseInt(skip);
        if(user.type === 'employee') {
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
            User.findByUserId(user._id, function(err, userProfile){
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
                    if(team.length === 0){
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