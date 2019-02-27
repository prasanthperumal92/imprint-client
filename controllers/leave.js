var Leave = require('../models/leaves');
var moment = require('moment');
var _ = require('lodash');
var Log = require('../models/log');
var Notification = require('./notifications');
var common = require("../helpers/common");

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
            leaveData.approvedBy = employee._id;
            leaveData.appliedBy = user.employee._id;

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
                    Log.addLog({
                        userId: user.employee._id,
                        clientId: user._id,
                        text: 'Applied ' + leaveData.type + ' on ' + leaveData.start + ' for ' + leaveData.days,
                        type: 'leave',
                        by: user.employee.name,
                        created: new Date()
                    });
                    let text = user.employee.name + " has Applied " + leaveData.type;
                    Notification.addNotification(user.employee.reportingTo, 'attendance', text);
                    let obj = {
                        to: employee.email,
                        subject: "Leave Applied - " + user.employee.name,
                        body: `<p>Hi ${employee.name}, </p>
                            <p>${user.employee.name} has Applied ${leaveData.type} from ${moment(leaveData.start).format('YYYY-MM-DD')} to 
                            ${moment(leaveData.end).format('YYYY-MM-DD')}. Click <a href="${common.getLeavePage()}">here</a> to know more..</p>
                            <div>Regards</div>
                            <div>Imprint</div>
                            <br>
                            <p>*** This is an automatically generated email, please do not reply to this message ***</p>`
                    };
                    Notification.sendMail(obj);
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

    Leave.findByIdAndUpdate(leaveData._id, leaveData, {
        new: true
    }, function (err, newLeaveData) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "Server is busy, Please try again!"
            });
        } else {
            Log.addLog({
                userId: user.employee._id,
                clientId: user._id,
                text: leaveData.status + ' ' + leaveData.type + ' on ' + leaveData.start + ' for ' + leaveData.days,
                type: 'leave',
                by: user.employee.name,
                created: new Date()
            });
            let text = user.employee.name + " has " + leaveData.status + " Your Leave Request";
            Notification.addNotification(newLeaveData.appliedBy, 'attendance', text);
            res.status(200).send();
            User.findEmployeeById(newLeaveData.appliedBy, function (err, employee) {
                if (err || !employee) {
                    console.log("Cannot trigger email", err, employee);
                } else {
                    let obj = {
                        to: employee.email,
                        subject: "Leave " + leaveData.status,
                        body: `<p>Hi ${employee.name}, </p>
                        <p>${user.employee.name} has ${newLeaveData.status} Your  ${newLeaveData.type} from ${moment(newLeaveData.start).format('YYYY-MM-DD')} to 
                        ${moment(newLeaveData.end).format('YYYY-MM-DD')}. Click <a href="${common.getLeavePage()}">here</a> to know more..</p>
                        <div>Regards</div>
                        <div>Imprint</div>
                        <br>
                        <p>*** This is an automatically generated email, please do not reply to this message ***</p>`
                    };
                    Notification.sendMail(obj);
                }
            });
        }
    });
}

exports.getLeaves = function (req, res, next) {
    var user = req.user;
    let query = {};
    let status = req.params.status;

    if (user.employee.type == 'manager') {
        query = {
            'approvedBy': user.employee._id
        }
    } else {
        query = {
            'appliedBy': user.employee._id
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

exports.getWebLeaves = function (req, res, next) {
    var user = req.user;
    var input = req.body;
    let query = {};

    if (!input || Object.keys(input).length === 0) {
        return res.status(400).send({
            message: "Request cannot be null"
        });
    }

    !input.skip ? input.skip = 0 : '';
    !input.limit ? input.limit = 20 : '';
    !input.sort ? input.sort = 'created' : '';

    let start = new Date(input.fromDate);
    start.setHours(0, 0, 0, 0);
    let end = new Date(input.toDate);
    end.setHours(23, 59, 59, 999);
    if (user.employee.type == 'manager') {
        query = {
            'approvedBy': user.employee._id,
            'created': {
                $gte: start,
                $lte: end
            }
        }
    } else {
        query = {
            'appliedBy': user.employee._id,
            'created': {
                $gte: start,
                $lte: end
            }
        }
    }

    if (input.filter) {
        query[input.filter.key] = input.filter.value
    }

    Leave.getLeavesDynamic(query, input.sort, input.order, input.skip, input.limit, function (err, data) {
        if (err) {
            return res.status(500).send({
                message: "Error Looking up for Task"
            });
        } else {
            return res.status(200).send(data);
        }
    });
}