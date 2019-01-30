var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var memberSchema = new Schema({
    userId: {
        type: ObjectId
    },
    level: {
        type: String
    }
});

var teamSchema = new Schema({
    companyId: {
        type: ObjectId
    },
    name: {
        type: String
    },
    leaderId: {
        type: ObjectId
    },
    members: [memberSchema],
    created: {
        type: Date
    },
    modified: {
        type: Date
    }
}, {
    collection: 'team'
});

module.exports = Team = mongoose.model('Team', teamSchema);