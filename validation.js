const { check } = require('express-validator');
 
exports.signupValidation = [
    check('username', 'Username is requied').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
]

exports.makundiValidation = [
    check('name', 'Category is requied').not().isEmpty(),
]

exports.shirikishoValidation = [
    check('name', 'Shirikisho name is requied').not().isEmpty(),
    check('category_id', 'Category is requied').not().isEmpty(),
]

exports.loginValidation = [
    //  check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
     check('username', 'Username is requied').not().isEmpty(),
     check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
 
]

// exports.memberValidation = [
//     //  check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
//      check('fname', 'first name is requied').not().isEmpty(),
//      check('mname', 'middle name is requied').not().isEmpty(),
//      check('lname', 'last name is requied').not().isEmpty(),
//      check('nidaNo', 'NIDA must be 20 or more characters').isLength({ min: 20 }),
//      check('tinNo', 'TIN Number must be 9 or more characters').isLength({ min: 9 }),
//      check('gender', 'Gender is requied').not().isEmpty(),
//      check('phoneNo', 'Phone Number must be 10 or more characters').isLength({ min: 10 }),
//      check('educationLevel', 'Education Level is requied').not().isEmpty(),
//      check('wardId', 'ward Name is requied').not().isEmpty(),
//      check('dob', 'Date of Birth is requied').not().isEmpty(),
//      check('group', 'Group is requied').not().isEmpty(),
//      check('rank', 'Rank is requied').not().isEmpty(),
//      check('photo', 'Photo is requied').not().isEmpty()
// ]