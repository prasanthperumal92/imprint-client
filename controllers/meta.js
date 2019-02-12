var Meta = require('../models/meta');
var Config = require('../models/config');
var Leave = require('../models/leaves');
var Task = require('../models/task');
var Job = require('../models/job');
var _ = require('lodash');
var moment = require('moment');

exports.getMeta = function (req, res, next) {
    var user = req.user;
    var name = req.params.name;

    if (!name) {
        return res.status(400).send({
            message: "Meta Name is missing"
        });
    }

    Meta.getMeta(user._id, name, function (err, meta) {
        if (err) {
            return res.status(500).send({
                message: "Error Saving Meta data"
            });
        } else {
            let data = meta.toJSON();
            Config.findByUserId(user._id, function (err, config) {
                if (err) {
                    return res.status(500).send({
                        message: "Error Saving Meta data"
                    });
                } else {
                    console.log(config);
                    let leads = _.map(config.leads, 'value');
                    let sales = _.map(config.sales, 'value');
                    for (let i = 0; i < meta.fields.length; i++) {
                        if (meta.fields[i].key === 'leads') {
                            meta.fields[i].value = leads;
                        } else if (meta.fields[i].key === 'sales') {
                            meta.fields[i].value = sales;
                        }
                    }
                    data.fields = _.sortBy(meta.fields, 'priority');
                    return res.status(200).send(data);
                }
            });
        }
    });
}


exports.getAllDetails = function (req, res, next) {
    var user = req.user;
    var d = new Date();

    var year = req.params.year || d.getFullYear();
    var month = req.params.month || d.getMonth() + 1;
    console.log(year, month);
    var tmp = new Date(year, month - 1, 15);
    var start = moment(tmp).startOf('month').format('YYYY-MM-DD[T]HH:mm:ss');
    var end = moment(tmp).endOf('month').format('YYYY-MM-DD[T]HH:mm:ss');
    console.log(tmp, start, end);

    var query = {
        created: {
            $gte: start,
            $lte: end
        }
    };

    console.log(query);

    Job.find(query, '_id created name effort', function (err, jobs) {
        console.log(err, jobs);
        if (err) {
            return res.status(500).send({
                message: "Error looking up DSR Data!!!"
            });
        } else {
            Task.find(query, function (err, tasks) {
                console.log(err, tasks);
                if (err) {
                    return res.status(500).send({
                        message: "Error looking up Task Data!!!"
                    });
                } else {
                    query.status = {
                        $ne: 'Declined'
                    };
                    console.log(query);
                    Leave.find({
                        start: {
                            $gte: start
                        },
                        end: {
                            $lte: end
                        }
                    }, function (err, leaves) {
                        console.log(err, leaves);
                        if (err) {
                            return res.status(500).send({
                                message: "Error looking up Task Data!!!"
                            });
                        } else {
                            return res.status(200).send({
                                dsr: jobs,
                                task: tasks,
                                leave: leaves
                            });
                        }
                    });
                }
            });
        }
    });



}