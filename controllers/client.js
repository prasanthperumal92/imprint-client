var Client = require('../models/clients');
var common = require('../helpers/common');
var _ = require('lodash');

exports.addClient = function (req, res, next) {
    var user = req.user;
    var client = req.body;

    if (!client || Object.keys(client).length === 0 || !client.name) {
        return res.status(400).send({
            message: "Some Mandatory field is missing"
        });
    }

    if (client.name.length < 8) {
        return res.status(400).send({
            message: "Client name should be minimum * characters length"
        });
    }

    // Make Each word's first letter to UpperCase to regulate the names
    let name = client.name.toLowerCase().split(' ');
    let result = [];
    for (let i = 0; i < name.length; i++) {
        result.push(common.capitalizeFirstLetter(name[i]));
    }

    var data = new Client({
        name: result.join(' ')
    });
    data.save(function (err) {
        // If duplicate error then it is already available so use the same one
        if (err && !err.code === 11000) {
            return res.status(401).send({
                message: "Error Saving Client Information"
            });
        } else {
            return res.status(201).send();
        }
    });

}


exports.clientList = function (req, res, next) {
    var user = req.user;
    var name = req.params.name;

    if (!name) {
        Client.find({}, function (err, clients) {
            if (err) {
                return res.status(401).send({
                    message: "Error looking up Client Information"
                });
            } else {
                return res.status(200).send(_.sortBy(clients, 'name'));
            }
        });
    } else {
        Client.find({
            name: { $regex: name, $options: 'i' }
        }, function (err, clients) {
            if (err) {
                return res.status(401).send({
                    message: "Error looking up Client Information"
                });
            } else {
                return res.status(200).send(_.sortBy(clients, 'name'));
            }
        });
    }
}