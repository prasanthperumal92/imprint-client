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

jobSchema.statics.deleteJob = function (id, callback) {
    this.remove({
        _id: id
    }, callback);
}

jobSchema.statics.getJobByEmployeeId = function (ids, start, end, callback) {
    console.log(start, end)
    this.find({
        'employeeId': {
            $in: ids
        },
        'created': {
            $gt: start,
            $lt: end
        }
    }, callback);
}

jobSchema.statics.getFilters = function (callback) {
    this.aggregate([{
        $group: {
            _id: null,
            name: {
                $addToSet: '$name'
            },
            sales: {
                $addToSet: '$effort.sales'
            },
            client: {
                $addToSet: '$effort.client'
            }
        }
    }], callback);
    //this.distinct('effort.sales', 'name', 'effort.client', {}, callback);
}


module.exports = Job = mongoose.model('Job', jobSchema);