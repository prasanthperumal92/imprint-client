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
    name: {
        type: String
    },
    effort: Schema.Types.Mixed
}, {
    strict: false,
    collection: 'job'
});

jobSchema.statics.getJobById = function (id, callback) {
    this.findOne({
        _id: id
    }, callback);
}

jobSchema.statics.getJobs = function (ids, skip, callback) {
    this.find({
        employeeId: {
            $in: ids
        }
    }).sort({
        created: -1
    }).skip(skip).limit(20).exec(callback);
}

jobSchema.statics.getJobsDynamic = function (query, sort, order, skip, limit, callback) {
    this.find(query).sort({
        [sort]: order
    }).skip(skip).limit(limit).exec(callback);
}


module.exports = Job = mongoose.model('Job', jobSchema);