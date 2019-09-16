var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var _ = require('lodash');

var locationSchema = new Schema({
    coordinates: {
        type: [Number],
        index: '2dsphere',
        default: [0, 0]
    },
    address: {
        type: String
    },
    battery: {
        type: String
    },
    datetime: {
        type: Date,
        required: true
    }
});

var trackSchema = new Schema({
    userId: {
        type: ObjectId,
        required: true
    },
    created: {
        type: String
    },
    modified: {
        type: Date,
        default: Date.now
    },
    location: [locationSchema]
}, {
    collection: 'track'
});

locationSchema.path('coordinates').validate(function (value) {
    return (
        Array.isArray(value) &&
        value.length === 2 &&
        'number' === typeof value[0] &&
        'number' === typeof value[1]
    );
}, 'Invalid location. Should be geoJSON');

trackSchema.statics.getTrackByUserId = function (id, created, callback) {
    this.findOne({
        userId: id,
        created: created
    }, callback);
}

trackSchema.statics.updateLocation = function (userId, date, loc, callback) {
    this.update({
        userId: userId,
        created: date
    }, {
        $push: {
            "location": {
                $each: loc
            }
        },
        modified: new Date()
    }, {
        upsert: true,
        new: true
    }, callback);
}

trackSchema.statics.insertOrUpdate = function (userId, date, callback) {
    this.update({
        userId: userId,
        created: date
    }, {
        userId: userId,
        created: date
    }, {
        upsert: true,
        new: true
    }, callback);
}

module.exports = Track = mongoose.model('Track', trackSchema);