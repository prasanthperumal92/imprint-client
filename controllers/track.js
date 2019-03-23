var moment = require('moment');
var Track = require("../models/track");
var _ = require('lodash');

exports.createTracks = function (req, res, next) {
    var user = req.user;
    var location = req.body;

    if (!location || (location && location.length == 0)) {
        return res.status(400).send({
            message: "No tracks to save"
        })
    }

    var today = moment().startOf('day').format('DD-MM-YYYY');
    let uniq = [];
    let tmp = [];
    for (let i = 0; i < location.length; i++) {
        if (tmp.indexOf(location[i].coordinates.toString()) === -1) {
            tmp.push(location[i].coordinates.toString());
            uniq.push(location[i]);
        }
    }

    console.log(today, uniq);

    Track.updateLocation(user.employee._id, today, uniq, function (err, track) {
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


exports.getTracks = function (req, res, next) {
    var user = req.user;
    var created = moment().startOf('day').format('DD-MM-YYYY');
    var id = req.params.id || user.employee._id;


    let createdOn = moment(new Date(req.params.date)).startOf('day').format('DD-MM-YYYY') || created;
    console.log(id, user, createdOn);

    Track.getTrackByUserId(id, createdOn, function (err, list) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "Server is busy, Please try again!"
            })
        } else {
            console.log(list);
            return res.status(200).send(list || {});
        }
    })
}

exports.getLiveTracks = function (req, res, next) {
    var user = req.user;
    var created = moment().startOf('day').format('DD-MM-YYYY');

    User.findByUserId(user._id, function (err, userProfile) {
        if (err) {
            return res.status(500).send({
                message: "Error Looking up for Tracking"
            });
        } else {
            let team = [];
            team.push(user.employee);
            for (let i = 0; i < userProfile.employees.length; i++) {
                if (userProfile.employees[i].reportingTo.equals(user.employee._id)) {
                    team.indexOf(userProfile.employees[i]._id) === -1 ? team.push(userProfile.employees[i]) : '';
                }
            }
            console.log(team);
            Track.find({
                userId: {
                    $in: team
                },
                created: created
            }, {
                userId: 1,
                modified: 1,
                location: 1
            }, function (err, tracks) {
                if (err) {
                    return res.status(500).send({
                        message: "Error Looking up for Tracking"
                    });
                } else if (tracks && tracks.length > 0) {
                    console.log(tracks.length, team.length);
                    let data = [];
                    for (let i = 0; i < team.length; i++) {
                        for (let j = 0; j < tracks.length; j++) {
                            if (tracks[j].userId.equals(team[i]._id)) {
                                let last = tracks[j].location.pop();
                                data.push({
                                    id: team[i]._id,
                                    location: last,
                                    modified: tracks[j].modified
                                });
                            }
                        }
                    }
                    return res.status(200).send(data);
                } else {
                    return res.send([]);
                }
            });

        }
    });
}