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

var taskSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    due: {
        type: Date
    },
    assignedTo: {
        type: ObjectId
    },
    assignedBy: {
        type: ObjectId
    },
    created: {
        type: Date,
        required: true
    },
    modified: {
        type: Date
    },
    status: {
        type: String,
        enum: ['New', 'In-Progress', 'Postponed', 'Closed-Success', 'Closed-Rejected']
    },
    comments: [{
        comment: String,
        name: String,
        id: ObjectId,
        created: Date
    }]
}, {
    collection: 'task'
});

taskSchema.statics.getTaskByEmployeeId = function (ids, start, end, callback) {
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

taskSchema.statics.getTasksDynamic = function (query, sort, order, skip, limit, callback) {
    this.find(query).sort({
        [sort]: order
    }).skip(skip).limit(limit).exec(callback);
}

module.exports = Task = mongoose.model("Task", taskSchema);