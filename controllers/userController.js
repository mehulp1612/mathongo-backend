const USER = require('../models/userModel');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const base_URL=`http://localhost:5000`;

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAILER_USER,
      pass: process.env.MAILER_PASS,
    }
  });


const returnWithDataField = (status, code, message, data, token) => {
    let obj = {};
    obj['success'] = status;
    obj['code'] = code;
    obj['message'] = message;
    obj['user'] = data;
    obj['token'] = token;
    return obj;
}

const signin = async (req, res) => {
    // console.log(req.body);
    const { userEmail, userPassword } = await req.body;

    if (!userEmail || !userPassword) {
        res.send(returnWithDataField(false, 200, "Incomplete Data", null, null));
    }
    else {
        const userFound = await USER.findOne({ userEmail });
        // console.log(userFound);
        if (!userFound) {
            res.send(returnWithDataField(false, 200, "User not Found", null, null));
        }
        else {
            if(!userFound.isVerified){
                res.send(returnWithDataField(false,200,"Account not verified",null,null));
            }
            const pass = userFound.userPassword;
            const validPassword = await bcrypt.compare(userPassword, pass);
            if (validPassword) {
                const token = jwt.sign({ _id: userFound._id }, process.env.SALT);
                res.send(returnWithDataField(true, 200, "Sign in Successful", userFound, token));
            }
            else {
                res.send(returnWithDataField(false, 200, "Incorrect Password", null, null));
            }
        }
    }
}

const register = async (req, res) => {
    const { userEmail, userPassword, userFirstName, userLastName } = await req.body;

    if (!userPassword || !userEmail || !userFirstName || !userLastName) {
        res.send(returnWithDataField(false, 200, "Data Incomplete", null, null));
    }
    else {
        const checkDuplicate = await USER.findOne({ userEmail });
        if (checkDuplicate) {
            res.send(returnWithDataField(false, 200, "User already Exists", null, null));
        }
        else {
            const OTP = Math.random().toString().substring(2,8);
            const newUser = new USER({
                userEmail,
                userPassword: await bcrypt.hash(userPassword, 8),
                userFirstName,
                userLastName,
                platform:'',
                isVerified: false,
                OTP:await bcrypt.hash(OTP, 8),
            });

            const sent = await sendOtp(userEmail,"OTP for verification", `Your OTP is ${OTP}.`);
            // console.log("yaha",sent);
            if(!sent){
                res.send(returnWithDataField( false,200,"Mail not sent, retry again",null,null));
            }

            let resp="khali";
            newUser.save()
                .then(() => res.send(returnWithDataField(true, 200, "User Created, OTP sent on mail", null, null)))
                .catch((err) => res.send(returnWithDataField(false, 200, err, null, null)));
        }
    }
}


const matchOTP = async(req,res) => {

    const{userEmail,OTP} = req.body;
    if(!userEmail || !OTP){
        res.send(returnWithDataField(false,200,"data incomplete",null,null));
    }
    const user = await USER.findOne({userEmail});

    const match = await bcrypt.compare(OTP,user.OTP);


    if(match){
        user.isVerified = true;
        user.OTP = '';
        await user.save();
        res.send(returnWithDataField(true,200,"OTP Matched",null,null));
    }
    else{
        res.send(returnWithDataField(false,200,"OTP mismatch",null,null));
    }
}

const siginRegisterWithGoogle = async (req, res) => {


    const { userEmail,userFirstName,userLastName } = req.body;

    if (!userEmail) {
        res.send(returnWithDataField(false, 200, "Incomplete Data", null, null));
    }
    else {
        const userAlreadyRegisteredWithoutGoogle = await USER.findOne({userEmail});
        if(userAlreadyRegisteredWithoutGoogle){
            res.send(returnWithDataField(false,200,"User Already Created without google signin",null,null));
        }
        let userFound = await USER.findOne({ userEmail, platform: 'google' });
        if (!userFound) {
            if(!userFirstName || !userLastName){
                res.send(returnWithDataField(false,200,"User Not existing. Need Complete Data for Registration",null,null));
            }
            const newUser = new USER({
                userEmail,
                userFirstName,
                userLastName,
                platform: 'google',
                isVerified:'true',
            });

            
            await newUser.save();
            userFound = await USER.findOne({ userEmail, platform: 'google' });
        }

        const token = jwt.sign({ _id: userFound._id }, process.env.SALT);
        res.send(returnWithDataField(true, 200, "user created and signed in", userFound, token));
    }
}

const getCurrentUser = async(req,res) => {

    const userFound=req.user;

    res.send(returnWithDataField(true,200,"Current User",userFound,null));
}


// incomplete
const sendResetLink = async(req,res) => {

    const {userEmail} = req.body;

    if(!userEmail){
        res.send(returnWithDataField(false,200,"Data Incomplete",null,null));
    }

    const user = await USER.findOne({userEmail});
    if(!user){
        res.send(returnWithDataField(false,200,"User not found",null,null));
    }


    const resettoken = jwt.sign({_id:user._id},'mathongo_reset');
    const resetLink = `${base_URL}/resetPass/?resetKey=${resettoken}`;

    const sent = await sendOtp(user.userEmail,`Link for resetting password`,`Link to reset is : ${resetLink}`);

    if(sent){
        user.resetToken = resettoken;
        await user.save();
        res.send(returnWithDataField(true,200,"Reset Link sent on users mail",null,null));
    }
    else{
        res.send(returnWithDataField(false,500,"Internal Error. Try again later",null,null));
    }
     
}

const resetPassword = async(req,res) => {
    const resetToken = req.query.resetKey;
    const {userEmail,newPassword} = req.body;

    if(!userEmail || !newPassword ||!resetToken){
        res.send(returnWithDataField(false,200,"Incomplete Data",null,null));
        return;
    }
    const user = await USER.findOne({userEmail});
    if(!user){
        res.send(returnWithDataField(false,200,"User not found",null,null));
    }

    else if(!user.resetToken){
        res.send(returnWithDataField(false,200,"Invalid Link, Generate again",null,null));
    }

    else{
    const match = user.resetToken == resetToken;
    if(match){
        user.userPassword = await bcrypt.hash(newPassword,8)
        user.resetToken = ''

        await user.save();

        res.send(returnWithDataField(true,200,"Password updated successfully",null,null));
    }
    else{
        res.send(returnWithDataField(false,200,"Invalid Link",null,null));
    }
}
}

    const sendOtp = async (receiver,subject,message) => {
        var mailOptions = {
            from: 'mehulp1612@gmail.com',
            to: receiver,
            subject: subject,
            text: message,
          };
    
          let ret=true;
          transporter.sendMail(mailOptions, async function(error, info){
            if (error) {
              console.log("Error in sending mail");
                ret=false;
              return false;
            }
            return true;
          }
          );

          return ret;

    }


module.exports = { signin, register,siginRegisterWithGoogle,sendResetLink,matchOTP,getCurrentUser,resetPassword };