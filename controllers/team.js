var Team = require('../models/team');

exports.createTeam = function (req, res, next) {
    var user = req.user;
    var team = req.body;

    if (!team || (team && team.length == 0)) {
        return res.status(400).send({
            message: "No Team Data to save!"
        })
    }

    team.companyId = user._id;
    team.created = team.modified = new Date();

    var teamData = new Team(team);

    teamData.save(function (err, result) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "Server is busy, Please try again!"
            })
        } else {
            return res.status(201).send();
        }
    });

}


exports.getTeams = function (req, res, next) {
    var user = req.user;

    Team.find({
        companyId: user._id
    }, function (err, teams) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "Server is busy, Please try again!"
            })
        } else {
            return res.status(201).send(teams);
        }
    });
}

exports.updateTeam = function (req, res, next) {
    var user = req.user;
    var team = req.body;

    if (!team || (team && team.length == 0) || !team._id || !team.leaderId || team.members.length === 0) {
        return res.status(400).send({
            message: "No Team Data to save!"
        })
    }

    Team.update({
        _id: team._id
    }, {
        $set: {
            name: team.name,
            leaderId: team.leaderId,
            modified: new Date(),
            members: team.members
        }
    }, function (err, updated) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "Server is busy, Please try again!"
            })
        } else {
            return res.status(201).send();
        }
    });
};

exports.deleteTeam = function (req, res, next) {
    var user = req.user;
    var id = req.params.id;

    if (!id) {
        return res.status(400).send({
            message: "Cannot delete Team now!!"
        })
    }

    Team.remove({
        _id: id
    }, function (err, deleted) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "Server is busy, Please try again!"
            })
        } else {
            return res.status(201).send();
        }
    })
}