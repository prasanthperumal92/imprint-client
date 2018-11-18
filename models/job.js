var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var jobSchema = new Schema({
    employeeId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    created: {
        type: Date,
        required: true
    },
    clientId: {
        type: Schema.Types.ObjectId
    },   
    effort: Schema.Types.Mixed
}, {
    strict: false,
    collection: 'job'
});

module.exports = Job = mongoose.model('Job', jobSchema);