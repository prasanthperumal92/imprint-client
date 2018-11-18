var crypto = require('crypto');
var validator = require("validator");

function md5(str) {
    return crypto.createHash('md5').update(str).digest('hex').toString();
};
exports.md5 = md5;

function sha512(str) {
    return crypto.createHash('sha512').update(str).digest('hex').toString();
};
exports.sha512 = sha512;

function rand(length) {
    if ('undefined' === typeof length) {
        length = 512;
    }
    length = parseInt(length, 10);
    return sha512(crypto.randomBytes(length).toString());
};
exports.rand = rand;

function generateOTPKey() {
    return Math.floor(100000 + Math.random() * 900000);
}
exports.generateOTPKey = generateOTPKey;

function registration() {
    return "IM2018PRINT100" + Math.floor(100000 + Math.random() * 900000);
};
exports.registration = registration;

function validatePhone(phone) {
    return phone.substr(0, 3) === '+91' && phone.split(phone.substr(0, 3))[1].length === 10;
}
exports.validatePhone = validatePhone;

function validateEmail(email){
    return validator.isEmail(email);
}
exports.validateEmail = validateEmail;

function validateUsername(name){
    return name && (name.length >= 3 && name.length <= 64);
}
exports.validateUsername = validateUsername;

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
exports.capitalizeFirstLetter = capitalizeFirstLetter;