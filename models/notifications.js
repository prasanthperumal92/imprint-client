var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var notificationSchema = new Schema({
    employeeId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    created: {
        type: Date,
        required: true
    },
    category: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    },
    text: {
        type: String
    }
}, {
    collection: 'notification'
});

module.exports = Job = mongoose.model('Notification', notificationSchema);