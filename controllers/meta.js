var Meta = require('../models/meta');
var _ = require('lodash');

exports.getMeta = function(req, res, next) {
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
            data.fields = _.sortBy(meta.fields, 'priority');
            return res.status(200).send(data);
        }
    });
}
