const express = require('express');
const { signin,register, siginRegisterWithGoogle, resetPass, matchOTP, findUser, getCurrentUser, sendResetLink, resetPassword } = require('./controllers/userController');
const { validUserToken } = require('./middlware/authorize');

const router = express.Router();


router.post('/signin',signin);
router.post('/register',register);
router.post('/signinupgoogle',siginRegisterWithGoogle);
router.post('/sendReset',sendResetLink);
router.post('/checkotp',matchOTP);
router.get('/currentUser',validUserToken,getCurrentUser);
router.post('/resetPass',resetPassword);

module.exports = router;