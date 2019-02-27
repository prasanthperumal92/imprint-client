var nodemailer = require("nodemailer");
var Notification = require('../models/notifications');
var common = require("../helpers/common");

var mailCredentials = common.getMailCredentials();

exports.addNotification = function (id, category, text) {
    let obj = new Notification({
        employeeId: id,
        category: category,
        text: text,
        created: new Date
    });

    obj.save(function (err, saved) {
        if (err) {
            console.log(err);
        } else {
            console.log("Notification is created");
        }
    });
}

exports.getUnReads = function (req, res, next) {
    var user = req.user;
    console.log(user);
    Notification.find({
        employeeId: user.employee._id,
        isRead: false
    }, function (err, data) {
        console.log(err, data);
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "Server is busy, Please try again!"
            })
        } else {
            return res.status(200).send(data);
        }
    })
}

exports.updateNotification = function (req, res, next) {
    var user = req.user;
    var id = req.params.id;

    if (!id) {
        return res.status(400).send({
            message: "Invalid Data"
        });
    }

    Notification.findOneAndUpdate({
        _id: id
    }, {
        isRead: true
    }, function (err, doc) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "Server is busy, Please try again!"
            })
        } else {
            return res.status(200).send();
        }
    })

}

function testMail(email, cb) {
    var smtpTransport = nodemailer.createTransport({
        service: "Gmail",
        host: "smtp.gmail.com",
        secure: false,
        auth: {
            type: "OAuth2",
            user: mailCredentials.mail, // Your gmail address.                
            clientId: mailCredentials.clientID,
            clientSecret: mailCredentials.secret,
            refreshToken: mailCredentials.refreshToken,
            accessToken: mailCredentials.accessToken
        }
    });

    var mailOptions = {
        from: mailCredentials.sender,
        to: email,
        subject: "Imprint Test Mail",
        generateTextFromHTML: true,
        html: "<b>Greetings from Imprint..</b><br><p> *** This is an automatically generated email, please do not reply to this message *** </p>"
    };

    smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log(error);
            cb({
                type: "Error",
                message: error
            });
        } else {
            console.log(response);
            cb({
                type: "Success",
                message: response
            });
        }
        smtpTransport.close();
    });
}

function sendMail(data) {
    console.log(data);
    var smtpTransport = nodemailer.createTransport({
        service: "Gmail",
        host: "smtp.gmail.com",
        secure: false,
        auth: {
            type: "OAuth2",
            user: mailCredentials.mail, // Your gmail address.                
            clientId: mailCredentials.clientID,
            clientSecret: mailCredentials.secret,
            refreshToken: mailCredentials.refreshToken,
            accessToken: mailCredentials.accessToken
        }
    });

    var mailOptions = {
        from: mailCredentials.sender,
        to: data.to,
        subject: data.subject,
        generateTextFromHTML: true,
        html: data.body
    };

    smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log(error);
        } else {
            console.log(response);
        }
        smtpTransport.close();
    });
}


exports.testMail = testMail;
exports.sendMail = sendMail;

exports.sendTestMail = function (req, res, next) {
    if (req.params.email) {
        testMail(req.params.email, function (message) {
            return res.send(message);
        });
    } else {
        return res.status(400).send("Add Email address @ the end of the URL to test, Ex: /mail/abc@example.com");
    }
}