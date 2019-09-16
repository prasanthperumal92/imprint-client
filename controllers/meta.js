var Meta = require('../models/meta');
var Config = require('../models/config');
var Leave = require('../models/leaves');
var Task = require('../models/task');
var Job = require('../models/job');
var _ = require('lodash');
var moment = require('moment');

exports.getMeta = function (req, res, next) {
    var user = req.user;
    var name = req.params.name;

    if (!name) {
        return res.status(400).send({
            message: "Meta Name is missing"
        });
    }

    Meta.getMeta(user._id, name, function (err, meta) {
        if (err) {
            return res.status(500).send({
                message: "Error Saving Meta data"
            });
        } else {
            let data = meta.toJSON();
            data.fields = _.sortBy(meta.fields, 'priority');
            return res.status(200).send(data);
        }
    });
}


exports.getAllDetails = function (req, res, next) {
    var user = req.user;
    var d = new Date();

    var year = req.params.year || d.getFullYear();
    var month = req.params.month || d.getMonth() + 1;
    console.log(year, month);
    var tmp = new Date(year, month - 1, 15);
    var start = moment(tmp).subtract(3, "month").startOf('month').format('YYYY-MM-DD[T]HH:mm:ss');
    var end = moment(tmp).add(3, "month").endOf('month').format('YYYY-MM-DD[T]HH:mm:ss');

    var jobQuery = {},
        taskQuery = {},
        leaveQuery = {};
    if (user.employee.type === "manager") {
        jobQuery = {
            created: {
                $gte: start,
                $lte: end
            }
        };
        taskQuery = {
            modified: {
                $gte: start,
                $lte: end
            }
        };
        leaveQuery = {
            start: {
                $gte: start
            },
            end: {
                $lte: end
            },
            status: {
                $ne: 'Declined'
            }
        };
    } else {
        jobQuery = {
            employeeId: user.employee._id,
            created: {
                $gte: start,
                $lte: end
            }
        };

        taskQuery = {
            $or: [{
                'assignedBy': user.employee._id
            }, {
                'assignedTo': user.employee._id
            }],
            modified: {
                $gte: start,
                $lte: end
            }
        };

        leaveQuery = {
            appliedBy: user.employee._id,
            start: {
                $gte: start
            },
            end: {
                $lte: end
            },
            status: {
                $ne: 'Declined'
            }
        };
    }

    Job.find(jobQuery, '_id created name effort', function (err, jobs) {
        console.log(err, jobs);
        if (err) {
            return res.status(500).send({
                message: "Error looking up DSR Data!!!"
            });
        } else {
            Task.find(taskQuery, function (err, tasks) {
                console.log(err, tasks);
                if (err) {
                    return res.status(500).send({
                        message: "Error looking up Task Data!!!"
                    });
                } else {
                    Leave.find(leaveQuery, function (err, leaves) {
                        console.log(err, leaves);
                        console.log(tmp, start, end);
                        if (err) {
                            return res.status(500).send({
                                message: "Error looking up Task Data!!!"
                            });
                        } else {
                            return res.status(200).send({
                                dsr: jobs,
                                task: tasks,
                                leave: leaves
                            });
                        }
                    });
                }
            });
        }
    });

}

exports.getCloudinary = function (req, res, next) {
    let enVariable = process.env.CLOUDINARY_URL || "cloudinary://645321174173731:4cgwvap60ESunffKBcaRH5YxyvE@hlmzh75cl"
    let tmp = enVariable.split('//')[1];

    let cloudName = tmp.split('@')[1];
    let key = tmp.split('@')[0].split(':')[0];
    let secret = tmp.split('@')[0].split(':')[1];
    const details = {
        cloudName: cloudName,
        apiKey: key,
        apiSecret: secret,
        httpUrl: `http://res.cloudinary.com/${cloudName}/image/upload`,
        httpsUrl: `http://res.cloudinary.com/${cloudName}/image/upload`,
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        tags: 'imprint_album',
        folder: 'imprint',
        preset: "ij5cs5za"
    }
    return res.status(200).send(details);
}