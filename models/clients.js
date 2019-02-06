var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var assignSchema = new Schema({
    id: {
        type: ObjectId
    },
    name: {
        type: String
    },
    photo: {
        type: String
    }
}, {
    _id: false
});

var logsSchema = new Schema({
    created: {
        type: Date,
        default: Date.now
    },
    text: {
        type: String
    },
    type: {
        type: String
    },
    by: {
        type: String
    }
}, {
    _id: true
});

var referenceSchema = new Schema({
    created: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String
    },
    type: {
        type: String,
        default: 'Feedback'
    },
    by: {
        type: String
    }
});

var clientSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    clientId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    address: {
        type: String
    },
    contact: {
        type: String
    },
    person: {
        type: String
    },
    assignedTo: {
        type: ObjectId
    },
    createdBy: {
        type: ObjectId
    },
    logs: [logsSchema],
    reference: [referenceSchema],
    created: {
        type: Date
    },
    modified: {
        type: Date
    }
}, {
    collection: 'client'
});

clientSchema.statics.findByName = function (name, callback) {
    this.find({
        name: name
    }, callback);
}

clientSchema.statics.getClientByEmployeeId = function (ids, start, end, callback) {
    console.log(start, end)
    this.find({
        'assignedTo': {
            $in: ids
        },
        'modified': {
            $gt: start,
            $lt: end
        }
    }, callback);
}

clientSchema.statics.findLatest = function (callback) {
    this.find({}).sort({
        '_id': -1
    }).limit(1).exec(callback);
}

module.exports = Client = mongoose.model('Client', clientSchema);