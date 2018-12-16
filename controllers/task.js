var User = require('../models/users');
var Task = require('../models/task');
exports.createTask = function (req, res, next) {
    var user = req.user;
    var taskData = req.body;

    if (Object.keys(taskData).length == 0 || !taskData.title || !taskData.client || !taskData.due || !taskData.assignedTo || !taskData.status) {
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
            taskData.modified = new Date();
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

            if (!taskData._id) {
                taskData.created = new Date();
                taskData.status = "New";
                var data = new Task(taskData);
                
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
            } else {
                Task.findByIdAndUpdate(taskData._id, taskData, function(err){
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

exports.getWebTasks = function(req, res, next) {
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
    !input.sort ? input.sort = 'modified' : '';

    let start = new Date(input.fromDate);
    start.setHours(0, 0, 0, 0);
    let end = new Date(input.toDate);
    end.setHours(23, 59, 59, 999);
    if (user.employee.type == 'manager') {
        query = {
            'assignedBy.id': user.employee._id,
            'status': {
                $ne: 'Removed'
            },
            'modified': {
                $gte: start,
                $lte: end
            }
        }
    } else {
        query = {
            'assignedTo.id': user.employee._id,
            'status': {
                $ne: 'Removed'
            },
            'modified': {
                $gte: start,
                $lte: end
            }
        }
    }

    if (input.filter) {
        query[input.filter.key] = input.filter.value
    }

    Task.getTasksDynamic(query, input.sort, input.order, input.skip, input.limit, function (err, data) {
        if (err) {
            return res.status(500).send({
                message: "Error Looking up for Task"
            });
        } else {
            return res.status(200).send(data);
        }
    });
}