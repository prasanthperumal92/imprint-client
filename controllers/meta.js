var Meta = require('../models/meta');
var Config = require('../models/config');
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
            Config.findByUserId(user._id, function(err, config){
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
                            break;
                        } 
                        if (meta.fields[i].key === 'sales') {
                            meta.fields[i].value = sales;
                            break;
                        }
                    }
                    data.fields = _.sortBy(meta.fields, 'priority');
                    return res.status(200).send(data);
                }
            });            
        }
    });
}
