var Client = require('../models/clients');
var common = require('../helpers/common');
var _ = require('lodash');

var CLIENTID = 'CLIENT0005001';

exports.addClient = function (req, res, next) {
    var user = req.user;
    var client = req.body;

    console.log(user);

    if (!client || Object.keys(client).length === 0 || !client.name || !client.address || !client.contact || !client.person) {
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

    name = result.join(' ');

    Client.findByName(name, function (err, clients) {
        if (err) {
            return res.status(401).send({
                message: "Error looking up Client Information"
            });
        } else if (clients.length > 0) {
            return res.status(409).send({
                message: "Already a Client available with this name"
            });
        } else {
            Client.findLatest(function (err, latest) {
                console.log(err, latest);
                if (err) {
                    return res.status(401).send({
                        message: "Error looking up Client Information"
                    });
                } else {
                    if (latest.length > 0 && latest[0].clientId) {
                        let tmp = latest[0].clientId.split('T');
                        let n = parseInt(tmp[1]);
                        n++;
                        client.clientId = 'CLIENT000' + n;
                    } else {
                        client.clientId = CLIENTID;
                    }

                    var createdBy = {
                        id: user.employee._id.toString(),
                        name: user.employee.name,
                        photo: user.employee.photo,
                    };
                    var log = {
                        created: new Date(),
                        text: 'Created',
                        type: 'client',
                        by: user.employee.name
                    };

                    if (user.employee.type !== 'manager') {
                        client.assignedTo = createdBy;
                    }

                    client.name = name;
                    client.createdBy = createdBy;
                    client.logs = [];
                    client.logs.push(log);

                    console.log(client);

                    var data = new Client(client);
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
            });
        }
    });
}

exports.clientList = function (req, res, next) {
    var user = req.user;
    var id = req.params.id;

    if (!name) {
        Client.find({}, {
            name: 1,
            clientId: 1,
            address: 1,
            contact: 1,
            person: 1,
            createdBy: 1,
            assignedTo: 1
        }, function (err, clients) {
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
            clientId: id
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