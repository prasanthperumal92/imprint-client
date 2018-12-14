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
    title : {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    client: {
        type: String
    },
    location: {
        type: String
    },
    contact: {
        type: String
    },
    person: {
        type: String
    },
    due: {
        type: Date
    },
    assignedTo: assignSchema,
    assignedBy: assignSchema,
    created: {
        type: Date,
        required: true
    },
    modified: {
        type: Date        
    },
    status: {
        type: String,
        enum: ['New', 'Progress', 'Done', 'Completed', 'Removed']
    },
    sales: {
        type: String        
    },
    lead: {
        type: String
    }    
}, {
    collection: 'task'
});

taskSchema.statics.getTasksDynamic = function (query, sort, order, skip, limit, callback) {
    this.find(query).sort({
        [sort]: order
    }).skip(skip).limit(limit).exec(callback);
}

module.exports = Task = mongoose.model("Task", taskSchema);