var User = require('../models/users');

exports.getProfile = function(req, res, next) {
    var user = req.user;

    return res.status(200).send(user);
}

exports.getPhotos = function (req, res, next) {
    var user = req.user;

    User.findById(user._id, function(err, user){
        if (err) {
            return res.status(401).send({
                message: "Error looking up Client Information"
            });
        } else {
            let result = [];            
            for(var i=0; i<user.employees.length; i++) {
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