var Leave = require('../models/leaves');
var moment = require('moment');
var _ = require('lodash');

exports.createLeave = function (req, res, next) {
    var user = req.user;
    var leaveData = req.body;

    if (Object.keys(leaveData).length == 0 || !leaveData.type || !leaveData.start || !leaveData.end || !leaveData.title) {
        return res.status(400).send({
            message: "Invalid Data"
        });
    }

    Leave.checkExistingLeaves(user.employee._id, function (err, data) {
        console.log('Data', data);
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "Server is busy, Please try again!"
            })
        } else if (data) {
            let days = [];
            for (let i = 0; i < data.length; i++) {
                let tmp = getDates(data[i].start, data[i].end);
                for (let i in tmp) {
                    days.push(tmp[i]);
                }
            }
            console.log('Days', days);
            let currentLeaves = getDates(leaveData.start, leaveData.end);
            console.log('Current Leaves', currentLeaves);
            let isApplied = _.intersection(days, currentLeaves);
            if (isApplied.length > 0) {
                return res.status(500).send({
                    message: "You have already applied leave on this date"
                });
            } else {
                saveUpdateData(user, leaveData, res);
            }
        } else {
            saveUpdateData(user, leaveData, res);
        }
    });
}

function saveUpdateData(user, leaveData, res) {
    User.findEmployeeById(user.employee.reportingTo, function (err, employee) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "Server is busy, Please try again!"
            })
        } else {
            leaveData.approvedBy = {
                id: employee._id,
                name: employee.name,
                photo: employee.photo
            };
            leaveData.appliedBy = {
                id: user.employee._id,
                name: user.employee.name,
                photo: user.employee.photo
            };

            leaveData.days = getDates(leaveData.start, leaveData.end).length;

            leaveData.created = new Date();
            leaveData.modified = new Date();
            var data = new Leave(leaveData);

            data.save(function (err) {
                if (err) {
                    console.log(err);
                    return res.status(500).send({
                        message: "Server is busy, Please try again!"
                    });
                } else {
                    res.status(200).send();
                }
            })

        }
    });
}

exports.updateLeave = function (req, res, next) {
    var user = req.user;
    var leaveData = req.body;

    if (Object.keys(leaveData).length == 0 || !leaveData.status || !leaveData._id) {
        return res.status(400).send({
            message: "Invalid Data"
        });
    }

    leaveData.modified = new Date();

    Leave.findByIdAndUpdate(leaveData._id, leaveData, function (err) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "Server is busy, Please try again!"
            });
        } else {
            res.status(200).send();
        }
    });
}

exports.getLeaves = function (req, res, next) {
    var user = req.user;
    let query = {};
    let status = req.params.status;

    if (user.employee.type == 'manager') {
        query = {
            'approvedBy.id': user.employee._id
        }
    } else {
        query = {
            'appliedBy.id': user.employee._id
        }
    }
    if (status && (status === 'Approved' || status === 'Declined')) {
        query.status = status;
    }
    console.log(query);
    Leave.find(query, function (err, tasks) {
        if (err) {
            return res.status(500).send({
                message: "Server is busy, Please try again!"
            })
        } else {
            return res.status(200).send(tasks);
        }
    });
}

function getDates(startDate, stopDate) {
    var dateArray = [];
    var currentDate = moment(startDate);
    var stopDate = moment(stopDate);
    while (currentDate <= stopDate) {
        dateArray.push(moment(currentDate).format('YYYY-MM-DD'))
        currentDate = moment(currentDate).add(1, 'days');
    }
    return dateArray;
}