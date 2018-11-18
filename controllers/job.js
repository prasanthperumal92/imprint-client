var Job = require('../models/job');

exports.createEffort = function (req, res, next) {
    var user = req.user;
    var effort = req.body;
    
    if (!effort || Object.keys(effort).length === 0 ) {
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
    effort.save(function(err){
        if (err) {
            return res.status(500).send({
                message: "Error Creating Job"
            });
        } else {            
            return res.status(201).send();
        }
    });
    
}