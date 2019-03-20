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
    status: {
        type: String
    },
    description: {
        type: String
    },
    address: {
        type: String
    },
    activity: {
        type: String
    },
    product: {
        type: String
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    contact: {
        type: String
    },
    person: {
        type: String
    },
    mail: {
        type: String
    },
    designation: {
        type: String
    },
    contact2: {
        type: String
    },
    person2: {
        type: String
    },
    mail2: {
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

clientSchema.statics.findExistingClient = function (name, contact, callback) {
    this.find({
        $or: [{
            name: name
        }, {
            contact: contact
        }]
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