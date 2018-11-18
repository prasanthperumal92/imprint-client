var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var appSchema = new Schema({
    id: {
        type: String
    },
    name: {
        type: String
    },
    api: {
        type: String
    },
    image: {
        type: String
    }
}, {
    _id: false
});

var orderSchema = new Schema({
    key: {
        type: String
    },
    value: {
        type: String
    }    
}, {
    _id: false
});

var configSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId        
    },
    appList: [appSchema],
    leads: [orderSchema, ],
    sales: [orderSchema],
    products: [orderSchema],
    modified: {
        type: Date,
        default: new Date()
    },
    created: {
        type: Date,
        default: new Date()
    }
}, {
    collection: "config"
});

configSchema.statics.findByUserId = function (id, callback) {
    this.findOne({
        userId: id
    }, callback);
};

configSchema.statics.addConfig = function (id, key, obj, callback) {
    this.findByUserId(id, function(err, config) {
        if (err) {
            callback(err, null);
        } else {            
            config[key] = obj;
            config.modified = new Date();
            config.save(callback);
        }
    });
};

configSchema.methods.toJSON = function () {
    return {        
        appList: this.appList,
        leads: this.leads,
        sales: this.sales,
        products: this.products,
        modified: this.modified
    }
};

module.exports = Config = mongoose.model("Config", configSchema);