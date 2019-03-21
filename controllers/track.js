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