const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
    {
        userFirstName:{
            type:String,
            required:true,
        },
        userLastName:{
            type:String,
            required:true,
        },
        userEmail:{
            type:String,
            required:true,
            unique:true,
        },
        userPassword:{
            type:String,
            required:false,
        },
        OTP:{
            type:String,
        },
        isVerified:{
            type:Boolean,
            default:false,
        },
        platform:{
            type:String,
            default:'web',
        },
        resetToken:{
            type:String,
            default:''
        }

    },

    {
        timestamps:true,
    },
    
);

const userModel=mongoose.model('userModel',userSchema);
module.exports=userModel;