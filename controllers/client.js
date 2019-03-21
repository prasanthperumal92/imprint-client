var Client = require('../models/clients');
var common = require('../helpers/common');
var _ = require('lodash');
var Log = require('../models/log');

var CLIENTID = 'CLIENT0005001';

exports.addClient = function (req, res, next) {
    var user = req.user;
    var client = req.body;

    console.log(user);

    if (!client || Object.keys(client).length === 0 || !client.name || !client.address || !client.city || !client.state || !client.contact || !client.person) {
        return res.status(400).send({
            message: "Some Mandatory field is missing"
        });
    }

    if (client.name.length < 8) {
        return res.status(400).send({
            message: "Client name should be minimum * characters length"
        });
    }

    Client.findExistingClient(client.name, client.contact, function (err, clients) {
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

                    var log = {
                        created: new Date(),
                        text: 'Created',
                        type: 'Client',
                        by: user.employee.name
                    };

                    client.createdBy = user.employee._id.toString();
                    client.created = new Date();
                    client.modified = new Date();
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
                            Log.addLog({
                                userId: user.employee._id,
                                clientId: user._id,
                                clientName: client.name,
                                text: 'Created a Client ' + client.name,
                                type: 'Cterm',
                                by: user.employee.name,
                                created: new Date()
                            });
                            return res.status(201).send();
                        }
                    });
                }
            });
        }
    });
}

exports.editClient = function (req, res, next) {
    var user = req.user;
    var client = req.body;

    console.log(user);
    console.log(client);

    if (!client || Object.keys(client).length === 0 || !client.name || !client.address || !client.city || !client.state || !client.contact || !client.person || !client._id) {
        return res.status(400).send({
            message: "Some Mandatory field is missing"
        });
    }

    if (client.name.length < 8) {
        return res.status(400).send({
            message: "Client name should be minimum 8 characters length"
        });
    }

    let original = false;

    Client.findExistingClient(client.name, client.contact, function (err, clients) {
        if (err) {
            return res.status(401).send({
                message: "Error looking up Client Information"
            });
        } else if (clients.length > 0) {
            for (let i = 0; i < clients.length; i++) {
                if (clients[i].clientId === client.clientId) {
                    original = true;
                    break;
                }
            }
        }

        var log = {
            created: new Date(),
            text: 'Updated',
            type: 'Client',
            by: user.employee.name
        };

        let update = {
            $push: {
                logs: log
            },
            address: client.address,
            name: client.name,
            person: client.person,
            contact: client.contact,
            designation: client.designation,
            city: client.city,
            state: client.state,
            assignedTo: client.assignedTo,
            modified: new Date()
        };

        if (client.status) {
            update.status = client.status
        }

        if (client.product) {
            update.product = client.product
        }

        if (client.activity) {
            update.activity = client.activity
        }

        if (client.mail) {
            update.mail = client.mail
        }
        if (client.person2) {
            update.person2 = client.person2
        }
        if (client.contact2) {
            update.contact2 = client.contact2
        }
        if (client.mail2) {
            update.mail2 = client.mail2
        }
        if (client.description) {
            update.description = client.description
        }

        console.log("Update Query", update);

        if (!original) {
            return res.status(409).send({
                message: "Already a Client available with this name or contact number"
            });
        } else {
            Client.updateOne({
                _id: client._id
            }, update, function (err, data) {
                if (err && !err.code === 11000) {
                    return res.status(401).send({
                        message: "Error Saving Client Information"
                    });
                } else {
                    Log.addLog({
                        userId: user.employee._id,
                        clientId: user._id,
                        clientName: client.name,
                        text: 'Updated the Client ' + client.name,
                        type: 'Cterm',
                        by: user.employee.name,
                        created: new Date()
                    });
                    return res.status(201).send();
                }
            });
        }
    });
}

exports.addReference = function (req, res, next) {
    var user = req.user;
    var refer = req.body;

    if (!refer || Object.keys(refer).length === 0 || !refer.reference || !refer._id) {
        return res.status(400).send({
            message: "Some Mandatory field is missing"
        });
    }

    var obj = {
        created: new Date(),
        description: refer.reference,
        type: 'Feedback',
        by: user.employee.name
    };
    Client.update({
        _id: refer._id
    }, {
        $push: {
            reference: obj
        }
    }, {
        new: true
    }, function (err, data) {
        console.log(data);
        if (err && !err.code === 11000) {
            return res.status(401).send({
                message: "Error Adding Client Reference"
            });
        } else {
            Client.findById(refer._id, {
                name: 1,
            }, function (err, client) {
                if (err) {
                    return res.status(401).send({
                        message: "Error looking up Client Information"
                    });
                } else {
                    Log.addLog({
                        userId: user.employee._id,
                        clientId: user._id,
                        clientName: client.name,
                        text: 'Added Reference to the Client ' + client.name,
                        type: 'Cterm',
                        by: user.employee.name,
                        created: new Date()
                    });
                    return res.status(200).send();
                }
            });
        }
    });
}

exports.searchClient = function (req, res, next) {
    var user = req.user;
    var id = req.params.text;


    Client.find({
        "name": {
            '$regex': id,
            '$options': 'si'
        }
    }, {
        _id: 1,
        name: 1,
        createdBy: 1,
        assignedTo: 1,
        clientId: 1,
        modified: 1
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

exports.clientList = function (req, res, next) {
    var user = req.user;
    var id = req.params.id;

    if (!id) {

        if (user.employee.type == 'manager') {
            query = {};
        } else {
            query = {
                $or: [{
                        'createdBy': user.employee._id
                    },
                    {
                        'assignedTo': user.employee._id
                    }
                ]
            }
        }

        Client.find(query, function (err, clients) {
            if (err) {
                return res.status(401).send({
                    message: "Error looking up Client Information"
                });
            } else {
                let tmp = _.sortBy(clients, 'modified') || [];
                return res.status(200).send(tmp.reverse());
            }
        });
    } else {
        let query;
        if (id.indexOf('CLIENT') > -1) {
            query = {
                clientId: id
            }
        } else {
            query = {
                _id: id
            }
        }
        Client.find(query,
            function (err, clients) {
                console.log(err, clients);
                if (err) {
                    return res.status(401).send({
                        message: "Error looking up Client Information"
                    });
                } else {
                    let tmp = _.sortBy(clients, 'modified') || [];
                    return res.status(200).send(tmp.reverse());
                }
            });
    }
}

exports.getLimitedClient = function (req, res, next) {
    var user = req.user;
    var limit = parseInt(req.params.limit) || 10;
    var skip = parseInt(req.params.skip) || 0;

    skip = skip * limit;

    Client.find({}, {
        _id: 1,
        name: 1,
        address: 1,
        contact: 1,
        person: 1,
        clientId: 1
    }).sort({
        'name': -1
    }).skip(skip).limit(limit).exec(function (err, clients) {
        console.log(err, clients);
        if (err) {
            return res.status(401).send({
                message: "Error looking up Client Information"
            });
        } else {
            let tmp = _.sortBy(clients, 'modified') || [];
            return res.status(200).send(tmp.reverse());
        }
    });
}