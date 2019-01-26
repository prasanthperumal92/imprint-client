var moment = require('moment');
var Track = require("../models/track");

exports.createTracks = function (req, res, next) {
    var user = req.user;
    var location = req.body;

    console.log(location)

    if (!location || (location && location.length == 0)) {
        return res.status(400).send({
            message: "No tracks to save"
        })
    }

    var today = moment().startOf('day');


    Track.updateLocation(user.employee._id, today, location, function (err, track) {
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
    var created = moment().startOf('day').toDate();
    var id = req.params.id || user.employee._id;


    let createdOn = moment(new Date(req.params.date)).startOf('day').toDate() || created;
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