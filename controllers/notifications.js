var Notification = require('../models/notifications');

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
        employeeId: user.employee._id
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