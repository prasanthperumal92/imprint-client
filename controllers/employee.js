var User = require('../models/users');
const common = require('../helpers/common');
const _ = require('lodash');

exports.getProfile = function (req, res, next) {
    var user = req.user;

    User.findById(user._id, function (err, data) {
        if (err) {
            return res.status(401).send({
                message: "Error looking up User Information"
            });
        } else {
            for (let i = 0; i < data.employees.length; i++) {
                if (data.employees[i]._id.equals(user.employee.reportingTo)) {
                    user.employee.reportingTo = {};
                    user.employee.reportingTo.name = data.employees[i].name;
                    user.employee.reportingTo.photo = data.employees[i].photo;
                    break;
                }
            }
            delete user.registrationId;
            delete user._id;
            delete user.username;
            delete user.active;
            delete user.modified;
            return res.status(200).send(user);
        }
    });
}

exports.getPhotos = function (req, res, next) {
    var user = req.user;

    User.findById(user._id, function (err, user) {
        if (err) {
            return res.status(401).send({
                message: "Error looking up User Information"
            });
        } else {
            let result = [];
            for (var i = 0; i < user.employees.length; i++) {
                result.push({
                    id: user.employees[i]._id,
                    name: user.employees[i].name,
                    photo: user.employees[i].photo,
                    designation: user.employees[i].designation
                });
            }
            return res.status(200).send(result);
        }
    });
}

exports.updateEmployee = function (req, res, next) {
    var user = req.user;
    var data = req.body;
    console.log(user);
    if (Object.keys(data).length == 0) {
        return res.status(400).send({
            message: "Invalid Data"
        });
    }

    if (data.email) {
        if (!common.validateEmail(data.email)) {
            return res.status(400).send({
                message: "Invalid Email address"
            });
        }
    }

    if (data.phone) {
        if (!common.validatePhone(data.phone)) {
            return res.status(400).send({
                message: "Invalid Phone Number"
            });
        }
    }

    if (data.name) {
        if (!common.validateUsername(data.name)) {
            return res.status(400).send({
                message: "User Name should be between 3 and 64 characters long"
            });
        }
    }

    User.findById(user._id, function (err, employer) {
        if (err) {
            return res.status(401).send({
                message: "Error looking up User Information"
            });
        } else if (employer) {
            console.log(employer.employees);
            let tmp = _.remove(employer.employees, function (e) {
                return e._id.toString() === user.employee._id
            });
            console.log(tmp);
            if (findEmployee(employer.employees, 'phone', data.phone)) {
                return res.status(409).send({
                    message: "A User already availble with this phone number"
                });
            } else if (findEmployee(employer.employees, 'email', data.email)) {
                return res.status(409).send({
                    message: "A User already availble with this email address"
                });
            } else if (findEmployee(user.employees, 'name', data.name)) {
                return res.status(409).send({
                    message: "A User already availble with this name"
                });
            }

            data.modified = new Date();
            let emp = {};
            for (let i in data) {
                if (data.hasOwnProperty(i)) {
                    emp['employees.$.' + i] = data[i];
                }
            }

            console.log(emp);

            User.update({
                _id: user._id,
                'employees._id': user.employee._id
            }, {
                $set: emp
            }, function (err, updated) {
                console.log(err, updated);
                if (err) {
                    return res.status(401).send({
                        message: "Error updating Employee Information"
                    });
                } else {
                    return res.status(200).send();
                }
            });

        } else {
            return res.status(400).send({
                message: "Invalid Employer Information"
            });
        }
    });
}

function findEmployee(arr, key, value) {
    return _.find(arr || [], [key, value]);
}