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

jobSchema.statics.getJobById = function(id, callback){
    this.findOne({ _id: id}, callback);
}

jobSchema.statics.getJobs = function (ids, skip, callback) {
    this.find({
        employeeId: {
            $in: ids
        }
    }).sort({created: -1}).skip(skip).limit(20).exec(callback);        
}

module.exports = Job = mongoose.model('Job', jobSchema);