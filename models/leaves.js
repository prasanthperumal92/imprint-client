var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var assignSchema = new Schema({
    id: {
        type: Schema.Types.ObjectId
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

var leaveSchema = new Schema({
    title: {
        type: String
    },
    type: {
        type: String,
        enum: ['Sick Leave', 'Casual Leave', 'Privilege leave', 'Other']
    },
    modified: {
        type: Date
    },
    created: {
        type: Date
    },
    start: {
        type: Date
    },
    end: {
        type: Date
    },
    days: {
        type: String
    },
    status: {
        type: String,
        enum: ['Approved', 'Declined']
    },
    comments: {
        type: String
    },
    approvedBy: {
        type: ObjectId
    },
    appliedBy: {
        type: ObjectId
    },
    description: {
        type: String
    }
}, {
    collection: "leave"
});

leaveSchema.statics.checkExistingLeaves = function (id, callback) {
    this.find({
        'appliedBy': id,
        'status': {
            $ne: 'Declined'
        }
    }, callback);
}

leaveSchema.statics.getLeavesDynamic = function (query, sort, order, skip, limit, callback) {
    this.find(query).sort({
        [sort]: order
    }).skip(skip).limit(limit).exec(callback);
}

module.exports = Leave = mongoose.model("Leave", leaveSchema);