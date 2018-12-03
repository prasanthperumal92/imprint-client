var User = require('../models/users');
var Task = require('../models/task');
exports.createTask = function (req, res, next) {
    var user = req.user;
    var taskData = req.body;

    if (Object.keys(taskData).length == 0 || !taskData.title || !taskData.client || !taskData.due || !taskData.assignedTo) {
        return res.status(400).send({
            message: "Invalid Data"
        });
    }

    User.findEmployeeById(taskData.assignedTo, function (err, employee) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "Server is busy, Please try again!"
            })
        } else {
            console.log(employee);
            taskData.created = new Date();
            taskData.modified = new Date();
            taskData.status = "New";
            taskData.due = new Date(taskData.due);
            taskData.assignedTo = {
                id: employee._id,
                name: employee.name,
                photo: employee.photo
            };
            taskData.assignedBy = {
                id: user.employee._id,
                name: user.employee.name,
                photo: user.employee.photo
            };

            var data = new Task(taskData);

            data.save(function (err) {
                if (err) {
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

exports.getTasks = function (req, res, next) {
    var user = req.user;
    let query = {};
    if (user.employee.type == 'manager') {
        query = {
            'assignedBy.id': user.employee._id,
            'status': {
                $ne: 'Removed'
            }
        }
    } else {
        query = {
            'assignedTo.id': user.employee._id,
            'status': {
                $ne: 'Removed'
            }
        }
    }
    console.log(query);
    Task.find(query, function (err, tasks) {
        if (err) {
            return res.status(500).send({
                message: "Server is busy, Please try again!"
            })
        } else {
            return res.status(200).send(tasks);
        }
    })
}

exports.getTask = function(req, res, next) {
    var user = req.user;
    var taskId = req.params.id;
    
    if (!taskId) {
        return res.status(400).send({
            message: "Invalid Data"
        });
    }

    Task.findById(taskId, function (err, tasks) {
        if (err) {
            return res.status(500).send({
                message: "Server is busy, Please try again!"
            })
        } else {
            return res.status(200).send(tasks);
        }
    })
}