var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var common = require("../helpers/common");

var verifySchema = new Schema({
    phone: {
        type: Boolean,
        default: false
    },
    email: {
        type: Boolean,
        default: false
    }
}, {
    _id: false
});

var addressSchema = new Schema({
    street: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    state: {
        type: String,
        trim: true
    },
    pincode: {
        type: Number,
    },
    country: {
        type: String,
        trim: true
    }
}, {
    _id: false
});

var employeeSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    employeeId: {
        type: String
    },
    photo: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ["manager", "leader", "employee"]
    },
    designation: {
        type: String,
        required: true
    },
    active: { // make inactiv if some companies cancels our services, incase if they come back we could have their data back.
        type: Boolean,
        default: false,
        index: true
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true
    },
    address: addressSchema,
    _password: {
        type: String,
        required: true
    },
    _salt: { // encrypt & decrypt using salt
        type: String
    },
    created: {
        type: Date,
        default: Date.now
    },
    modified: {
        type: Date,
        default: Date.now
    },
    accessToken: {
        type: String,
        index: true,
        unique: true,
        sparse: true
    },
    phoneVerificationKey: {
        type: String
    },
    reportingTo: {
        type: Schema.Types.ObjectId
    },
    verify: verifySchema,
    doj: {
        type: Date
    },
    emailOTP: {
        type: String,
        trim: true
    }
});

employeeSchema.virtual('password')
    .get(function () {
        return function (password) {
            return (common.sha512(password + this._salt) === this._password);
        }
    })
    .set(function (value) {
        var salt = common.rand(512);
        this._salt = salt;
        this._password = common.sha512(value + salt);
    });

var userSchema = new Schema({
    username: { // login user name for company head
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    registrationId: {
        type: String,
        required: true,
        index: true
    },
    name: { // Main business name
        type: String,
        required: true,
        trim: true
    },
    photo: {
        type: String,
        trim: true
    },
    active: { // make inactiv if some companies cancels our services, incase if they come back we could have their data back.
        type: Boolean,
        default: false,
        index: true
    },
    landline: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true
    },
    address: addressSchema,
    _password: {
        type: String,
        required: true
    },
    _salt: { // encrypt & decrypt using salt
        type: String
    },
    created: {
        type: Date,
        default: Date.now
    },
    modified: {
        type: Date
    },
    accessToken: {
        type: String,
        index: true,
        unique: true,
        sparse: true
    },
    passwordResetKey: {
        type: String,
        index: true,
        unique: true,
        sparse: true //http://stackoverflow.com/a/21211640/1885921
    },
    passwordKeyValidTill: {
        type: Date
    },
    phoneOTP: {
        type: String,
        trim: true
    },
    emailOTP: {
        type: String,
        trim: true
    },
    verify: verifySchema,
    employees: [employeeSchema]
}, {
    collection: "user"
});

// Virtual Properties
userSchema.virtual('password')
    .get(function () {
        return function (password) {
            return (common.sha512(password + this._salt) === this._password);
        }
    })
    .set(function (value) {
        var salt = common.rand(512);
        this._salt = salt;
        this._password = common.sha512(value + salt);
    });

userSchema.statics.findByAuthKey = function (authKey, callback) {
    this.findOne({
        accessToken: authKey
    }, callback);
};

userSchema.statics.findEmpAuthKey = function (authKey, callback) {
    this.findOne({
        'employees.accessToken': authKey
    }, function (err, user) {
        if (err) {
            callback(err, null);
        } else if (!user) {
            callback(null, null);
        } else {
            var employee = user.toJSON();
            delete employee.employees;
            for (var i = 0; i < user.employees.length; i++) {
                if (authKey === user.employees[i].accessToken) {
                    employee.employee = user.employees[i];
                    break;
                }
            }
            callback(null, employee);
        }
    });
};

userSchema.statics.create = function (obj, callback) {
    new this(obj).save(callback);
};

userSchema.statics.lookUpUser = function (obj, callback) {
    this.findOne({
        $or: [{
            phone: obj.phone
        }, {
            email: obj.email
        }, {
            username: obj.username
        }]
    }, callback)
};

userSchema.statics.lookUpEmployee = function (phone, callback) {
    this.findOne({
        'employees.phone': phone
    }, callback);
};

userSchema.statics.findEmployeeById = function (id, callback) {
    this.findOne({
        'employees._id': id
    }, function (err, user) {
        if (err) {
            callback(err, null);
        } else if (!user) {
            callback(null, null);
        } else {
            var employee = user.toJSON();
            let emp;
            delete employee.employees;
            for (var i = 0; i < user.employees.length; i++) {
                if (user.employees[i]._id.equals(id)) {
                    emp = user.employees[i];
                    break;
                }
            }
            callback(null, emp);
        }
    });
};

userSchema.statics.createEmployeeSession = function (id, phone, token, callback) {
    if (token) {
        this.updateOne({
            _id: id,
            'employees.phone': phone
        }, {
            $set: {
                'employees.$.accessToken': token,
                'employees.$.modified': new Date()
            }
        }, callback);
    } else {
        this.updateOne({
            _id: id,
            'employees.phone': phone
        }, {
            $set: {
                'employees.$.modified': new Date()
            }
        }, callback);
    }
};

userSchema.statics.findByUserId = function (userId, callback) {
    this.findOne({
        _id: userId
    }, callback);
};


userSchema.methods.createSession = function (cb) {
    this.modified = new Date();
    this.accessToken = common.rand();
    this.save(cb);
};

userSchema.methods.toJSON = function () {
    return {
        _id: this.id,
        username: this.username,
        registrationId: this.registrationId,
        name: this.name,
        photo: this.photo,
        active: this.active,
        landline: this.landline,
        phone: this.phone,
        email: this.email,
        address: this.address,
        creadted: this.creadted,
        modified: this.modified,
        employees: this.employees
    }
};

employeeSchema.methods.toJSON = function () {
    return {
        _id: this.id,
        name: this.name,
        employeeId: this.employeeId,
        photo: this.photo,
        type: this.type,
        designation: this.designation,
        active: this.active,
        phone: this.phone,
        email: this.email,
        address: this.address,
        creadted: this.creadted,
        modified: this.modified,
        reportingTo: this.reportingTo,
        doj: this.doj
    }
};

module.exports = User = mongoose.model("User", userSchema);