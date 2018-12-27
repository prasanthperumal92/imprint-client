var User = require('../models/users');

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