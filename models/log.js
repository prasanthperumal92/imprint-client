var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var logSchema = new Schema({
    userId: {
        type: ObjectId,
        required: true,
        index: true
    },
    clientId: {
        type: ObjectId
    },
    clientName: {
        type: String
    },
    text: {
        type: String
    },
    type: {
        type: String
    },
    by: {
        type: String
    },
    created: {
        type: Date
    }
}, {
    collection: 'log'
});

logSchema.statics.addLog = function (obj) {
    new this(obj).save(function (err, result) {
        console.log(err, result);
        if (err) {
            console.error("Error creating log");
        } else {
            console.log("Logged the Activity Successfully");
        }
    });
}

logSchema.statics.getFewLogs = function (id, callback) {
    this.find({
        userId: id
    }).sort({
        _id: -1
    }).skip(0).limit(20).exec(callback);
}
module.exports = Log = mongoose.model('Log', logSchema);