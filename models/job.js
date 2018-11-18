var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var jobSchema = new Schema({
    employeeId: {
        type: ObjectId,
        required: true
    },
    created: {
        type: Date,
        required: true
    },
    effort: Schema.Types.Mixed
}, {
    strict: false,
    collection: 'job'
});