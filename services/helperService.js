var express = require('express');
var async = require("async");
var validator = require("email-validator");
var randomstring = require("randomstring");
var nodemailer = require('nodemailer');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt-nodejs');
var app = express();
var mongoose = require("mongoose");
var asyncLoop = require('node-async-loop');
var path = require('path');
var fs = require('fs');
var forEach = require('async-foreach').forEach;

var User = require('../models/user');
var Request = require('../models/request');
var Helper = require('../models/helper');
var Notification = require('../models/notification');
var Booking = require('../models/booking');
var HelperLocation = require('../models/helperlocation');

var Category = require('../models/category');
var Coupons = require('../models/coupons');
var Reviews = require('../models/reviews');
var Advertisement = require('../models/advertisement');

var config = require("../config");
var NotificationService = require('../notificationservice');

var siteurl = config.__site_url;

var specialchar = /^[a-zA-Z\s]*$/;

var transporter = nodemailer.createTransport('smtps://avijit.team@gmail.com:avijit_team@smtp.gmail.com');

// Create token while sign in
function createToken(user) {
  var tokenData = {
    id: user._id,
    email: user.email.toLowerCase()
  };
  var token = jwt.sign(tokenData, config.secretKey, {
    //expiresIn: '48h'
  });
  return token;
}

function decodeBase64Image(dataString) 
{
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  var response = {};

  if (matches.length !== 3) 
  {
    return new Error('Invalid input string');
  }

  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');

  return response;
}

//==================================================================================================================

var helperService = {

  userregister: (registerData, callback) => {
    console.log("registerData", registerData);
    async.waterfall([
      (nextcb) => {
        if (registerData.firstname == undefined || registerData.firstname.trim() == '') {
          callback({
            success: false,
            message: "Please enter firstname"
          });
        } else if (registerData.firstname.trim() != '' && !specialchar.test(registerData.firstname)) {
          callback({
            success: false,
            message: "Name can not contain any number or special character"
          });
        } else if (registerData.firstname.trim() != '' && registerData.firstname.trim().length > 36) {
          callback({
            success: false,
            message: "Name can not be longer than 36 characters"
          });
        } else if (registerData.lastname == undefined || registerData.lastname.trim() == '') {
          callback({
            success: false,
            message: "Please enter lastname"
          });
        } else if (registerData.lastname.trim() != '' && !specialchar.test(registerData.lastname)) {
          callback({
            success: false,
            message: "Name can not contain any number or special character"
          });
        } else if (registerData.lastname.trim() != '' && registerData.lastname.trim().length > 36) {
          callback({
            success: false,
            message: "Name can not be longer than 36 characters"
          });
        } else if (registerData.location == undefined || registerData.location.trim() == '') {
          callback({
            success: false,
            message: "Please enter address"
          });
        } else if (registerData.contact_no == undefined || registerData.contact_no.trim() == '') {
          callback({
            success: false,
            message: "Please enter contact number"
          });   
        } else if (registerData.email == undefined || registerData.email.trim() == '' || !validator.validate(registerData.email)) {
          callback({
            success: false,
            message: "Please enter a valid email"
          });
        } else if (registerData.password == undefined || registerData.password == '') {
          callback({
            success: false,
            message: "Please enter a password"
          });
        } else if (registerData.password.length < 6) {
          callback({
            success: false,
            message: "Password length must be minimum 6 characters"
          });
        } else if (registerData.password != registerData.confirm_password) {
          callback({
            success: false,
            message: "Password and confirm password must match"
          });
        } else {
          nextcb(null);
        }
      },

      (nextcb) => {
        User.countDocuments({
          email: registerData.email.toLowerCase()
        }, (err, usercount) => {
          if (err) {
            nextcb(err);
          } else {
            if (usercount > 0) {
              callback({
                status: false,
                message: "Email already registered"
              });
            } else {
              nextcb(null);
            }
          }
        });
      },

      (nextcb) => {
        var user = new User(registerData);
        user.save((err) => {
          if (err) {
            nextcb(err);
          } else {
            nextcb(null, user);           
          }
        });

        //start sent mail
        var mailOptions = {
         // from: '"Care Now">', // sender address
          from: '"Care Now" <avijit.team@gmail.com>',
          to: registerData.email.toLowerCase(), // list of receivers
          subject: 'Care Now registration success !!', // Subject line
          html: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /></head><body bgcolor="#ededed"><table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ededed" ><tr><td><table width="60%" border="0" cellspacing="0" cellpadding="0" bgcolor="#FFF" align="center" style="border-radius:10px; border:1px solid #ededed; box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.25); margin: auto;"><tr><td valign="top" align="center" style="padding: 15px"><img src="' + siteurl + 'assets/imgs/logo.png" width="100px" height="120px" alt="Carenow logo" title="Care Now logo" border=0;/></td><tr><td valign="top" style="padding: 40px;" height="200">Hello ' + registerData.firstname + ' ,<br><br>Welcome to Care Now. <br><br>You have successfully registered to this App.<br><br>Your email id is <strong>' + registerData.email + ' </strong> and password is <strong>' + registerData.password + ' </strong><br><br> Thank you<br><br>Team Care Now</td></tr><tr><td style="padding: 15px" align="center" bgcolor="#FFF"><p style="font:normal 12px Arial, Helvetica, sans-serif;"></p></td></tr></table></td></tr></table></body></html>'
        };

        transporter.sendMail(mailOptions, (err, info) => {
          if (error) {
            console.log(err);
          } else {
            console.log('Mail sent: ' + info.response);
          }
        });
        //end of sent mail
       
      }
    ], (err, userdata) => {
      if (err) {
        callback({
          success: false,
          message: "Some internal error has occured",
          err: err
        });
      }
      else {
        callback({
          success: true,
          message: "Registration Successful.",
          data: userdata
        });
      }
    });
  },

  resendemailOTP: (resendOTPData, callback) => {
    async.waterfall([
      (nextcb) => {
        if (resendOTPData.user_id == undefined || resendOTPData.user_id.trim() == '') {
          callback({
            success: false,
            message: "Some internal error has occured"
          });
        } else {
          nextcb(null);
        }
      },

      (nextcb) => {
        User.findOne({
          _id: resendOTPData.user_id
        }, (err, userdetails) => {
          if (err) {
            nextcb(err);
          } else {
            if (userdetails == null) {
              callback({
                success: false,
                message: "Some internal error has occured"
              });
            } else {

              //start sent mail
              var mailOptions = {
               // from: '"Carenow">', // sender address
                from: '"Care Now" <avijit.team@gmail.com>',
                to: userdetails.email, // list of receivers
                subject: 'Carenow email varification', // Subject line
                html: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /></head><body bgcolor="#ededed"><table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ededed" ><tr><td><table width="60%" border="0" cellspacing="0" cellpadding="0" bgcolor="#FFF" align="center" style="border-radius:10px; border:1px solid #ededed; box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.25); margin: auto;"><tr><td valign="top" align="center" style="padding: 15px"><img src="' + siteurl + 'assets/imgs/logo.png" width="100px" height="120px" alt="Carenow logo" title="Carenow logo" border=0;/></td><tr><td valign="top" style="padding: 40px;" height="200">Hello ' + userdetails.firstname + ' ,<br><br>Welcome to Carenow. <br><br> Your email verification OTP is <strong>' + userdetails.emailOTP + '</strong> <br><br> Thank you<br><br>Team Carenow</td></tr><tr><td style="padding: 15px" align="center" bgcolor="#FFF"><p style="font:normal 12px Arial, Helvetica, sans-serif;"></p></td></tr></table></td></tr></table></body></html>'
              };

              transporter.sendMail(mailOptions, (err, info) => {
                if (error) {
                  console.log(err);
                } else {
                  console.log('Mail sent: ' + info.response);
                }
              });
              //end of sent mail
              nextcb(null);
            }
          }
        });
      }
    ], (err) => {
      if (err) {
        callback({
          success: false,
          message: "Some internal error has occurred",
          err: err
        });
      } else {
        callback({
          success: true,
          message: "Email verification OTP has been resent to your email"
        });
      }
    });
  },

  verifyemail: (verifyemailData, callback) => {
    async.waterfall([
      (nextcb) => {
        if (verifyemailData.emailOTP == undefined || verifyemailData.emailOTP.trim() == '') {
          callback({
            success: false,
            message: "Invalid email OTP"
          });
        } else if (verifyemailData.user_id == undefined || verifyemailData.user_id.trim() == '') {
          callback({
            success: false,
            message: "Some internal error has occured"
          });
        } else {
          nextcb(null);
        }
      },

      (nextcb) => {
        User.findOne({
          _id: verifyemailData.user_id
        }, (err, userdetails) => {
          if (err) {
            nextcb(err);
          } else {
            if (userdetails == null) {
              callback({
                success: false,
                message: "Some internal error has occured"
              });
            } else {
              if (userdetails.emailOTP != verifyemailData.emailOTP) {
                callback({
                  success: false,
                  message: "Invalid email OTP"
                });
              } else {
                nextcb(null);
              }
            }
          }
        });
      },
      (nextcb) => {
        User.update({
          _id: verifyemailData.user_id
        }, {
            email_verified: true
          }).exec((err, result) => {
            if (err) {
              nextcb(err);
            } else {
              nextcb(null);
            }
          });
      }
    ], (err) => {
      if (err) {
        callback({
          success: false,
          message: "Some internal error has occurred",
          err: err
        });
      } else {
        callback({
          success: true,
          message: "Email verified successfully"
        });
      }
    });
  },

  fblogin: (loginData, callback) => {
    async.waterfall([
      (nextcb) => {
       if (loginData.id == undefined || loginData.id == '') {
          callback({
            success: false,
            message: "Invalid FB Id"
          });
        } else {
          nextcb(null);
        }
      },
      function (nextcb) {
        User.findOne({
          fbid: loginData.id,
          block: false,
          login_type:'fb'
        }, (err, userdetails) => {
          if (err) {
            nextcb(err);
          } else {
            if (userdetails == null) {
                var emailOTP = randomstring.generate({
                  length: 8,
                  charset: 'numeric'
                });

                var generatedpassword = randomstring.generate({
                  length: 6,
                  charset: 'numeric'
                });
        
               // var usernameArr = loginData.name.split(" ");

                loginData.firstname = loginData.first_name;
                loginData.lastname  = loginData.last_name;
                loginData.emailOTP = emailOTP;
                loginData.password = generatedpassword;
                loginData.fbid = loginData.id;
                loginData.login_type = 'fb';

                //console.log(loginData);
        
                var user = new User(loginData);
                user.save((err) => {
                  console.log(user);
                  if (err) {
                    nextcb(err);
                  } else {
                    console.log(user);
                    var token = createToken(user);
                    nextcb(null, token, user);
                  }
                });
              } else {
                var token = createToken(userdetails);
                nextcb(null, token, userdetails);
            }
          }
        });
      }
    ],
      function (err, data, userdetails) {
        if (err) {
          callback({
            success: false,
            message: "Some internal error has occurred",
            err: err
          });
        } else {
          callback({
            success: true,
            message: "Login successful",
            token: data,
            user_id: userdetails._id
          });
        }
      });
  },

  login: (loginData, callback) => {
    // console.log("1",loginData);
    async.waterfall([
      (nextcb) => {
        if (loginData.email == undefined || loginData.email.trim() == '' || !validator.validate(loginData.email)) {
          callback({
            success: false,
            message: "Invalid email"
          });
        } else if (loginData.password == undefined || loginData.password == '' || loginData.password.length < 6) {
          callback({
            success: false,
            message: "Invalid password"
          });
        } else {
          nextcb(null);
        }
      },

      function (nextcb) {
        Helper.findOne({
          email: loginData.email.toLowerCase()         
        }, (err, userdetails) => {
          // console.log("userdetails",userdetails);
          if (err) {
            nextcb(err);
          } else {
            if (userdetails == null) {
              callback({
                success: false,
                message: "Invalid email or password"
              });
            } else {
              //console.log(userdetails.comparePassword(loginData.password));
              if (!userdetails.comparePassword(loginData.password)) {
                callback({
                  success: false,
                  message: "Invalid email or password"
                });
              } else {                
                  var token = createToken(userdetails);
                  
                     Helper.update({
                      _id: userdetails._id
                    }, {
                        devicetoken: loginData.devicetoken,
                        devicetype: loginData.devicetype, 
                      }).exec((err, data) => {
                        if (err) {
                          nextcb(err);
                        } else {                         
                          nextcb(null, token, userdetails); 
                        }
                      });              
              }
            }
          }
        });
      }
    ],
      function (err, data, userdetails) {
        if (err) {
          callback({
            success: false,
            message: "Some internal error has occurred",
            err: err
          });
        } else {
          callback({
            success: true,
            message: "Login successful",
            token: data,
            user_id: userdetails._id,
            profileImage:userdetails.profile_img
          });
        }
      });
  },

  forgotpassword: (forgotpasswordData, callback) => {
    async.waterfall([
      (nextcb) => {
        if (forgotpasswordData.email == undefined || forgotpasswordData.email.trim() == '' || !validator.validate(forgotpasswordData.email)) {
          callback({
            success: false,
            message: "Invalid email"
          });
        } else {
          nextcb(null);
        }
      },
      (nextcb) => {
        Helper.count({
          email: forgotpasswordData.email.toLowerCase()
        }, (err, usercount) => {
          if (err) {
            callback({
              success: false,
              message: "Some internal error has occurred",
              err: err
            });
          } else {
            if (usercount == 0) {
              callback({
                success: false,
                message: "Invalid email"
              });
            } else {
              nextcb(null);
            }
          }
        });
      },
      (nextcb) => {
        var newpassword = randomstring.generate({
          length: 6,
          charset: 'numeric'
        });
        bcrypt.hash(newpassword, null, null, function (err, hashedpwd) {
          if (err) {
            nextcb(err);
          } else {
            Helper.findOneAndUpdate({
              email: forgotpasswordData.email.toLowerCase()
            }, {
                password: hashedpwd
              }, {
                new: true
              })
              .exec(function (err, userdetails) {
                console.log("userdetails", userdetails);
                if (err) {
                  nextcb(err);
                } else {
                  //start sent mail
                  var mailOptions = {
                  //  from: '"CareNow App">', // sender address
                    from: '"Care Now" <avijit.team@gmail.com>',
                    to: forgotpasswordData.email.toLowerCase(), // list of receivers
                    subject: 'CareNow new password', // Subject line
                    html: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /></head><body bgcolor="#ededed"><table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ededed" ><tr><td><table width="60%" border="0" cellspacing="0" cellpadding="0" bgcolor="#FFF" align="center" style="border-radius:10px; border:1px solid #ededed; box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.25); margin: auto;"><tr><td valign="top" align="center" style="padding: 15px"><img src="' + siteurl + 'assets/imgs/logo.png" width="100px" height="120px" alt="Carenow logo" title="Carenow logo" border=0;/></td><tr><td valign="top" style="padding: 40px;" height="200">Hello ' + userdetails.firstname + ' ,<br><br> We have received your application for new password. <br><br> Your new password is <strong>' + newpassword + '</strong> <br><br> Please change this password ASAP for security purpose. <br><br> Thank you<br><br>Team Carenow</td></tr><tr><td style="padding: 15px" align="center" bgcolor="#FFF"><p style="font:normal 12px Arial, Helvetica, sans-serif;"></p></td></tr></table></td></tr></table></body></html>'
                  };

                  transporter.sendMail(mailOptions, function (err, info) {
                    if (error) {
                      console.log(err);
                    } else {
                      console.log('Mail sent: ' + info.response);
                    }
                  });
                  //end of sent mail
                  nextcb(null);
                }
              });
          }
        });
      }
    ], (err) => {
      if (err) {
        callback({
          success: false,
          message: "Some internal error has occurred",
          err: err
        });
      } else {
        callback({
          success: true,
          message: "Password changed. Please check your email."
        });
      }
    });
  },

  getprofileData: (tokenData, callback) => {
    Helper.findOne({
      _id: tokenData.id
    }, (err, userdetails) => {
      if (err) {
        callback({
          status: false,
          message: "Some internal error has occurred",
          err: err
        });
      } else {
        if (userdetails == null) {
          callback({
            status: false,
            message: "No profile details found"
          });
        } else {
          callback({
            success: true,
            message: "Profile data fetched",
            data: userdetails
          });
        }
      }
    });
  },

  updateProfile: (updateprofileData, tokenData, callback) => {
    async.waterfall([
      (nextcb) => {
        if (updateprofileData.firstname == undefined || updateprofileData.firstname.trim() == '') {
          callback({
            status: false,
            message: "Please enter first name"
          });
        } else if (updateprofileData.firstname.trim() != '' && !specialchar.test(updateprofileData.firstname)) {
          callback({
            status: false,
            message: "First name can not contain any number or special character"
          });
        } else if (updateprofileData.firstname.trim() != '' && updateprofileData.firstname.trim().length > 36) {
          callback({
            status: false,
            message: "First name can not be longer than 36 characters"
          });
        } else if (updateprofileData.lastname == undefined || updateprofileData.lastname.trim() == '') {
          callback({
            status: false,
            message: "Please enter last name"
          });
        } else if (updateprofileData.lastname.trim() != '' && !specialchar.test(updateprofileData.lastname)) {
          callback({
            status: false,
            message: "Last name can not contain any number or special character"
          });
        } else if (updateprofileData.lastname.trim() != '' && updateprofileData.lastname.trim().length > 36) {
          callback({
            status: false,
            message: "Last name can not be longer than 36 characters"
          });
        } else if (updateprofileData.email == undefined || updateprofileData.email.trim() == '' || !validator.validate(updateprofileData.email)) {
          callback({
            status: false,
            message: "Please enter a valid email"
          });
        } else if (updateprofileData.location == undefined || updateprofileData.location.trim() == '') {
          callback({
            success: false,
            message: "Please enter preferred location"
          });
        } else if (updateprofileData.contact_no == undefined || updateprofileData.contact_no.trim() == '') {
          callback({
            success: false,
            message: "Please enter contact number"
          });   
        } else if (updateprofileData.achievements == undefined || updateprofileData.achievements.trim() == '') {
          callback({
            status: false,
            message: "Please enter achievements"
          });
        } else if (updateprofileData.bank_account_no == undefined || updateprofileData.bank_account_no.trim() == '') {
          callback({
            status: false,
            message: "Please enter bank account"
          });
        } else {
          nextcb(null);
        }
      },

      (nextcb) => {
        Helper.update({
          _id: tokenData.id
        }, {
            firstname: updateprofileData.firstname,
            lastname: updateprofileData.lastname,
            email: updateprofileData.email.toLowerCase(),
            location: updateprofileData.location,
            contact_no: updateprofileData.contact_no,
            // schedule_available: updateprofileData.schedule_available,
            bank_account_no: updateprofileData.bank_account_no,
            achievements: updateprofileData.achievements,
          }).exec((err, data) => {
            if (err) {
              nextcb(err);
            } else {
              nextcb(null);
            }
          });
      },
    ], (err) => {
      if (err) {
        callback({
          success: false,
          message: "Some internal error has occurred",
          err: err
        });
      } else {
        callback({
          success: true,
          message: "Profile updated successfully"
        });
      }
    });
  },

  updateSchedule: (updateprofileData, tokenData, callback) => {
    //console.log("updateSchedule",updateprofileData);  
   async.waterfall([
     (nextcb) => {
       if (updateprofileData.schedule_available_start == undefined || updateprofileData.schedule_available_start == '') {
          callback({
            status: false,
            message: "Please provide schedule availability"
          });
        } else if (updateprofileData.schedule_available_end == undefined || updateprofileData.schedule_available_end == '') {
          callback({
            status: false,
            message: "Please provide schedule availability"
          });
        } else {
          nextcb(null);
        }
      },     
      (nextcb) =>{
       
        var startArray;
        var endArray;
        var today = new Date();
        today.setDate(today.getDate() - 1);  //means yesterday
       // console.log("yesterday",today);

        Helper.find({
          _id: tokenData.id
          }, {           
              schedule_available_start: 1,
              schedule_available_end: 1            
            }).exec((err,response) => {              
              if (err) {
                nextcb(err);
              } else {
              
               startArray = response[0].schedule_available_start;
               endArray = response[0].schedule_available_end;
               
             
               var updateStartArray = [];
              // startArray.forEach(function(value,index){   this also works
               forEach(startArray, function(value, index, arr) {  
                if((new Date(value).getTime() > today.getTime()) && (new Date(value).toDateString() != new Date(updateprofileData.schedule_available_start).toDateString())){                
                   //updateStartArray = updateStartArray.splice(index, 1);  //didn't worked out                     
                     updateStartArray.push(value);                                    
                 }             
               });

               var updateEndArray = [];
              // endArray.forEach(function(value,index){   this also works
               forEach(endArray, function(value, index, arr) {
                if((new Date(value).getTime() > today.getTime()) && (new Date(value).toDateString() != new Date(updateprofileData.schedule_available_end).toDateString())){  
                  updateEndArray.push(value);                                    
                 }              
               });                
                nextcb(null,updateStartArray,updateEndArray);   
              }             
            });
        },
     
      (updateStartArray,updateEndArray,nextcb) => {        
         updateStartArray.push(updateprofileData.schedule_available_start); 
         updateEndArray.push(updateprofileData.schedule_available_end); 

        Helper.update({
          _id: tokenData.id
        }, {              
            schedule_available_start: updateStartArray,
            schedule_available_end: updateEndArray                      
          }).exec((err) => {
            if (err) {
              nextcb(err);
            } else {
              nextcb(null);
            }
          });
      },
     // (nextcb) => {   //old one
     //    Helper.update({
     //      _id: tokenData.id
     //    }, {           
     //        schedule_available_start: updateprofileData.schedule_available_start,
     //        schedule_available_end: updateprofileData.schedule_available_end            
     //      }).exec((err) => {
     //        if (err) {
     //          nextcb(err);
     //        } else {
     //          nextcb(null);
     //        }
     //      });
     //  },
    ], (err) => {
        if (err) {
          callback({
            success: false,
            message: "Some internal error has occurred",
            err: err
          });
        } else {
          callback({
            success: true,
            message: "Schedule availability updated successfully"
          });
        }
      });
  },

  getScheduleAvailability: (data,tokenData, callback) =>{
   // console.log(data);
    Helper 
     .find({_id : tokenData.id},{schedule_available_start:1 ,schedule_available_end:1})
     .exec(function (err, scheduledetails) {
       // console.log("scheduledetails",scheduledetails[0]);
      if (err) {
        callback({
          success: false,
          message: "Some internal error has occurred",
          err: err
        });
      } else {
        var showSchedule;
        var userStartData=  scheduledetails[0].schedule_available_start;
        var userEndData= scheduledetails[0].schedule_available_end;
        var start = userStartData.find(isFound);          
        var end = userEndData.find(isFound);
        // console.log("start = ",start);
        // console.log("end = ",end);
         if(start == undefined && end == undefined){            
          showSchedule = "No Time Selected";
         }else{
            start = new Date(start).toTimeString().slice(0, 5);              
            end = new Date(end).toTimeString().slice(0, 5);               
            showSchedule = start + " - " + end;
         }              
         // console.log(showSchedule);

          function isFound(element) {             
            if (new Date(element).toDateString() == new Date(data.selectedDay).toDateString()) {  
             // console.log("found");            
              return element; 
            } else {
              //console.log("not found");   
              return 0;
            }
          }
          callback({
            success: true,
            message: "schedule details fetched",
            data: showSchedule
          });             
      }
    });
  },

  changePassword: (changepasswordData, tokenData, callback) => {
    console.log("tokendata",tokenData);
    async.waterfall([
      (nextcb) => {
        if (changepasswordData.currentpassword == undefined || changepasswordData.currentpassword == '') {
          callback({
            status: false,
            message: "Invalid current password"
          });
        } else if (changepasswordData.currentpassword.length < 6) {
          callback({
            status: false,
            message: "Invalid current password"
          });
        } else if (changepasswordData.newpassword == undefined || changepasswordData.newpassword == '') {
          callback({
            status: false,
            message: "Please enter new password"
          });
        } else if (changepasswordData.newpassword != '' && changepasswordData.newpassword.length < 6) {
          callback({
            status: false,
            message: "Password length must be minimum 6 characters"
          });
        } else if (changepasswordData.currentpassword == changepasswordData.newpassword) {
          callback({
            status: false,
            message: "New password must not be same as current password"
          });
        } else if (changepasswordData.newpassword != changepasswordData.confirmnewpassword) {
          callback({
            status: false,
            message: "New password and confirm new password must match"
          });
        } else {
          nextcb(null);
        }
      },

      (nextcb) => {
        Helper.findOne({
          _id: tokenData.id
        }, (err, userdetails) => {
          if (err) {
            nextcb(err);
          } else {
            if (!userdetails.comparePassword(changepasswordData.currentpassword)) {
              callback({
                status: false,
                message: "Invalid current password"
              });
            } else {
              bcrypt.hash(changepasswordData.newpassword, null, null, (err, hashedpwd) => {
                if (err) {
                  nextcb(err);
                } else {
                  Helper.update({
                    _id: tokenData.id
                  }, {
                      password: hashedpwd
                    })
                    .exec((err, data) => {
                      if (err) {
                        nextcb(err);
                      } else {
                        nextcb(null);
                      }
                    });
                }
              });
            }
          }
        })
      },
    ], (err) => {
      if (err) {
        callback({
          success: false,
          message: "Some internal error has occurred",
          err: err
        });
      } else {
        callback({
          success: true,
          message: "Password changed successfully"
        });
      }
    });
  },


  updateProfileImage: (profileimage,tokenData, callback) => { 
    console.log("profileimage",profileimage);
     console.log("tokenData",tokenData);

    async.waterfall([
      // (nextcb) => {
      //   if (tokenData.id == undefined || tokenData.id== '') {
      //       callback({success: false,message: "Please provide user_id"});        
      //   } else {
      //     nextcb(null);
      //   }
      // },
      (nextcb) => {
         if (profileimage == undefined || profileimage == '') {
          
            profileimage.profile_img = '',
            nextcb(null);
        } else {
          let attachImage = profileimage.profile_img;
          var ext = path.extname(profileimage.profile_img.name);

         if(ext.indexOf("?") >= 0){             
            let extArr = ext.split("?");
            ext = extArr[0];            
          }
          console.log("ext",ext);
          fileNameewithoutext = Date.now();
          fileName = fileNameewithoutext + ext;
         
          var allowedExt = ['.jpeg', '.png', '.JPG', '.jpg', '.JPEG', '.PNG',''];
          if (allowedExt.indexOf(ext) > -1) {
            attachImage.mv('assets/profileImage/' + fileName, (err) => {
              if (err) {
                  callback({ success: false, message: "Error occurred on uploading profile image", err: err });
                } else {
                  profileimage.profile_img = fileName;
                  // console.log("1",profileimage.profile_img);
                  nextcb(null);
                }
            });
          } else {
              callback({ success: false, message: "Only extension with 'jpeg/png' is allowed" });
          }
        }
      },

       (nextcb) =>{
        Helper.findOne({ _id: tokenData.id})
        .exec((err, data) => {         
          if (err) {
            nextcb(err);
          } else {
            if(data.profile_img != null || data.profile_img != ''){
              fs.unlink('assets/profileImage/' + data.profile_img, function(err) {
                 if(!err){
                  console.log("File Deleted Successfully");
                 }else{
                    console.log("error",err);
                 }
              })
              nextcb(null);
            }else{
              nextcb(null);
            }
          }
        });
      },

      (nextcb) => {
        //console.log("2",profileimage.profile_img);
        
        Helper.updateOne({
          _id: tokenData.id
        }, {
            profile_img: profileimage.profile_img
          })
          .exec((err, data) => {
            if (err) {
              nextcb(err);
            } else {
              nextcb(null);
            }
          });             
      }
    ], (err) => {
      if (err) {
        callback({
          success: false,
          message: "Some internal error has occurred",
          err: err
        });
      } else {         
        callback({
          success: true,
          message: "Profile image updated successfully",
          data: profileimage.profile_img,
        });
      }
    });
  },

  updateVisitImage : (profileimage,tokenData,bookingData, callback) => { 
    console.log("profileimage", profileimage);    
    console.log("bookingData", bookingData);    

    async.waterfall([
      // (nextcb) => {
      //   if (tokenData.id == undefined || tokenData.id== '') {
      //       callback({success: false,message: "Please provide user_id"});        
      //   } else {
      //     nextcb(null);
      //   }
      // },
      (nextcb) => {
         if (profileimage == undefined || profileimage == '') {
          
            profileimage.helper_visit_img = '',
            nextcb(null);
        } else {
          
          let attachImage = profileimage.helper_visit_img;
          var ext = path.extname(profileimage.helper_visit_img.name);

         if(ext.indexOf("?") >= 0){             
            let extArr = ext.split("?");
            ext = extArr[0];            
          }
          console.log("ext",ext);
          fileNameewithoutext = Date.now();
          fileName = fileNameewithoutext + ext;
         
          var allowedExt = ['.jpeg', '.png', '.JPG', '.jpg', '.JPEG', '.PNG',''];
          if (allowedExt.indexOf(ext) > -1) {
            attachImage.mv('assets/visitImages/' + fileName, (err) => {
              if (err) {
                  callback({ success: false, message: "Error occurred on uploading image", err: err });
                } else {
                  profileimage.helper_visit_img = fileName;   
                  nextcb(null);
                }
            });
          } else {
              callback({ success: false, message: "Only extension with 'jpeg/png' is allowed" });
          }
        }
      },
      (nextcb) => {
        console.log("2",profileimage.helper_visit_img);
        
        Booking.updateOne({
          _id: bookingData.booking_id
        }, { 
            $push:{
              helper_visit_img: profileimage.helper_visit_img
            }
          })
          .exec((err, data) => {
            if (err) {
              nextcb(err);
            } else {
              nextcb(null);
            }
          });             
      },

       (nextcb) =>{
        Booking.findOne({ _id: bookingData.booking_id})
        .select({ helper_visit_img:1, _id:0 })
        .exec((err, data) => {         
          if (err) {
            nextcb(err);
          } else {
            nextcb(null,data);
          }
        });
      },

    
    ], (err,data) => {
      if (err) {
        callback({
          success: false,
          message: "Some internal error has occurred",
          err: err
        });
      } else {         
        callback({
          success: true,
          message: "Image updated successfully",
          data: data.helper_visit_img,
        });
      }
    });
  },

  uploadFile: (file,tokenData, callback) => { 
    console.log("file",file);
     //console.log("tokenData",tokenData);

    async.waterfall([
    
      (nextcb) => {
         if (file == undefined || file == '') {
          
            file.attachment = '',
            nextcb(null);
        } else {
          let attachFile = file.attachment;
          var ext = path.extname(file.attachment.name);

         if(ext.indexOf("?") >= 0){             
            let extArr = ext.split("?");
            ext = extArr[0];            
          }
          console.log("ext",ext);
          fileNameewithoutext = Date.now();
          fileName = fileNameewithoutext + ext;
         
          // var allowedExt = ['.jpeg', '.png', '.JPG', '.jpg', '.JPEG', '.PNG',''];
         // if (allowedExt.indexOf(ext) > -1) {
            attachFile.mv('assets/attachFile/' + fileName, (err) => {
              if (err) {
                  callback({ success: false, message: "Error occurred on uploading file", err: err });
                } else {
                  file.attachment = fileName;
                  // console.log("1",file.attachment);
                  nextcb(null);
                }
            });
          // } else {
          //     callback({ success: false, message: "Only extension with 'jpeg/png' is allowed" });
          // }
        }
      },

      (nextcb) =>{
        Helper.findOne({ _id: tokenData.id})
        .exec((err, data) => {
          if (err) {
            nextcb(err);
          } else {
            if(data.attachment != null || data.attachment != ''){
              fs.unlink('assets/attachFile/' + data.attachment, function(err) {
                 if(!err){
                  console.log("File Deleted Successfully");
                 }else{
                    console.log("error",err);
                 }
              })
              nextcb(null);
            }else{
              nextcb(null);
            }
          }
        });
      },


      (nextcb) => {
        //console.log("2",file.attachment);
        
        Helper.updateOne({
          _id: tokenData.id
        }, {
            attachment: file.attachment
          })
          .exec((err, data) => {
            if (err) {
              nextcb(err);
            } else {
              nextcb(null);
            }
          });             
      }
    ], (err) => {
      if (err) {
        callback({
          success: false,
          message: "Some internal error has occurred",
          err: err
        });
      } else {         
        callback({
          success: true,
          message: "File uploaded successfully",
          data: file.attachment,
        });
      }
    });
  },

  savenotification: (notifyData,callback) => { 
   // console.log("savenotification",notifyData);
 
      async.waterfall([
          (nextcb) => {
            if(notifyData.action == undefined || notifyData.action == '') {
                callback({success: false,message: "Action required."});
            }else if(notifyData.receiver_id == undefined || notifyData.receiver_id == '') {
                callback({success: false,message: "Receiver Id required."});
            }else if(notifyData.sender_id == undefined || notifyData.sender_id == '') {
                callback({success: false,message: "Sender Id required."});
            }else if(notifyData.title == undefined || notifyData.title == '') {
                callback({success: false,message: "Notification title required."});
            }else if(notifyData.message == undefined || notifyData.message == '') {
                callback({success: false,message: "Notification message required."});
            }else if(notifyData.receiver_type == undefined || notifyData.receiver_type == '') {
                callback({success: false,message: "Receiver type required."});
            }else if(notifyData.sender_type == undefined || notifyData.sender_type == '') {
                callback({success: false,message: "Sender type required."});
            }else if(notifyData.request_id == undefined || notifyData.request_id == '') {
                callback({success: false,message: "Request Id required."});
            }else {              
                nextcb(null);
            }
          },          
          (nextcb) => {
            var notification = new Notification(notifyData);
            notification.save((err) => {
              if (err) {
                  console.log("err", err);
                nextcb(err);
              } else {
                console.log("no err");
                nextcb(null, notification);           
              }
            });
          }
      ],
      (err) => {
          if(err){
            callback({success: false,message: "Some internal error has occurred",err: err});
          } else {
            callback({success: true,message: "Notification inserted"});
          }
      });
  },

  getNotificationList: (tokenData, callback) => {
   console.log("too",tokenData);
    // var page = 1;
    // var limit = 10;
    var sort_field = 'createdAt';
    var order = '-1';

    // page = pagenum;

    Notification
      .find( { $and: [
            {receiver_id: tokenData.id},
            {receiver_type: 'helper'}
        ]})
      .sort([
        [sort_field, order]
      ]) 
       //.paginate(page, limit, (err, notidetails) => {
        .exec(function (err, notidetails) {
        if (err) {
          callback({
            success: false,
            message: "Some internal error has occurred",
            err: err
          });
        } else {
          Notification
            .count({})
            .exec((err, noticount) => {
              if (err) {
                callback({
                  success: false,
                  message: "Some internal error has occurred",
                  err: err
                });
              } else {
                callback({
                  success: true,
                  message: "All notification details fetched",
                  data: notidetails,
                  usercount: noticount
                });
              }
            });
        }
      });
  },

  gethelperpastbookinglist: (tokendata,callback) => {
   //console.log("getuserbookinglist",tokendata);
    var page = 1;   
    var sort_field = 'createdAt';
    var order = '-1';

  //  page = pagenum;

    Booking
     // .find({booking_by_user: tokendata.id}) 
      .find({
          $and : [
            { helper_assign: mongoose.Types.ObjectId(tokendata.id) },
            { booking_status: 5 }
        ]
      })    
      .sort([
        [sort_field, order]
      ])
      .exec(function (err, bookingdetails) {
      //.paginate(page, (err, bookingdetails) => {
        if (err) {
          callback({
            success: false,
            message: "Some internal error has occurred",
            err: err
          });
        } else {         
          Booking
         // .count({booking_by_user: tokendata.id})
         .count({
              $and : [
                { helper_assign: mongoose.Types.ObjectId(tokendata.id) },
                { booking_status: 5 }
            ]
          })
         
            .exec((err, bookingcount) => {
              if (err) {
                callback({
                  success: false,
                  message: "Some internal error has occurred",
                  err: err
                });
              } else {
                callback({
                  success: true,
                  message: "All booking details fetched",
                  data: bookingdetails,
                  usercount: bookingcount
                });
              }
            });
        }
      });
  },

 gethelperbookinglist: (tokendata,callback) => {
  //console.log("gethelperbookinglist",tokendata);
    var page = 1;  
    var sort_field = 'createdAt';
    var order = '-1';

   // page = pagenum;

    Booking
      .find({$and : [
                { helper_assign: mongoose.Types.ObjectId(tokendata.id) },
                { booking_status: { $not: { $eq: 5 } } }
            ]}) 
     //.find({booking_by_user: "5cf51396eb803613086d5e74"})
      .sort([
        [sort_field, order]
      ])
      .populate('booking_by_user')
      //.paginate(page, (err, bookingdetails) => {
      .exec(function (err, bookingdetails) {
       // console.log("bookingdetails",bookingdetails);
        if (err) {
          callback({
            success: false,
            message: "Some internal error has occurred",
            err: err
          });
        } else {         
          Booking
          .count({ $and : [
                { helper_assign: mongoose.Types.ObjectId(tokendata.id) },
                { booking_status: { $not: { $eq: 5 } }  }
            ]})
          //.count({booking_by_user: "5cf51396eb803613086d5e74"})
            .exec((err, bookingcount) => {
              if (err) {
                callback({
                  success: false,
                  message: "Some internal error has occurred",
                  err: err
                });
              } else {
                callback({
                  success: true,
                  message: "All booking details fetched",
                  data: bookingdetails,
                  usercount: bookingcount
                });
              }
            });
        }
      });
  },

 getbookingdetails: (userData, callback) => {
    Booking
      .find({ _id: userData.booking_id})
      .populate('booking_by_user','firstname lastname profile_img')
      // , (err, bookingdetails) => {
      .exec(function (err, bookingdetails) {
        //console.log("requestdetails",requestdetails);
        if (err) {
          callback({
            success: false,
            message: "Some internal error has occurred",
            err: err
          });
        } else {          
          callback({
            success: true,
            message: "Booking details fetched",
            data: bookingdetails            
          });
        }
     });
  },

 updatebookingstatus: (data,tokenData,callback) =>{  
  async.waterfall([
     (nextcb) => {
       if (data.booking_status == undefined || data.booking_status == '') {
          callback({
            status: false,
            message: "Please provide booking status"
          });
        } else if (data.booking_id == undefined || data.booking_id == '') {
          callback({
            status: false,
            message: "Please provide booking id"
          });
        } else {
          nextcb(null);
        }
      },
     (nextcb) => {
        Booking.findOneAndUpdate({
          _id: data.booking_id
        }, {           
            booking_status: data.booking_status                    
          }).populate('booking_by_user', 'devicetoken email firstname')
        .exec((err, bookingData) => {
            if (err) {
              nextcb(err);
            } else {
              nextcb(null,bookingData);
            }
          });
      },
      (bookingData,nextcb) => {
        console.log("bookingData",bookingData);
          console.log("tokenData",tokenData);
        if(data.booking_status == 2){   //accepted

            NotificationService.AcceptBookingByHelper(tokenData,bookingData);  //visit is confirmed

             //start sent mail to customer 
              var mailOptions = {
                //from: '"Care Now">', // sender address
                from: '"Care Now" <avijit.team@gmail.com>',
                to: bookingData.booking_by_user.email.toLowerCase(), // list of receivers            
                subject: 'Helper Assigned !!', // Subject line
                html: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /></head><body bgcolor="#ededed"><table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ededed" ><tr><td><table width="60%" border="0" cellspacing="0" cellpadding="0" bgcolor="#FFF" align="center" style="border-radius:10px; border:1px solid #ededed; box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.25); margin: auto;"><tr><td valign="top" align="center" style="padding: 15px"><img src="' + siteurl + 'assets/imgs/logo.png" width="100px" height="120px" alt="Carenow logo" title="Care Now logo" border=0;/></td><tr><td valign="top" style="padding: 40px;" height="200">Hello ' + bookingData.booking_by_user.firstname + ' ,<br><br>A helper has been successfully assigned by admin for your care request "'+ bookingData.requiredService +'".You may further communicate through chat .<br><br>Thank you<br><br>Team Care Now</td></tr><tr><td style="padding: 15px" align="center" bgcolor="#FFF"><p style="font:normal 12px Arial, Helvetica, sans-serif;"></p></td></tr></table></td></tr></table></body></html>'
              };

              transporter.sendMail(mailOptions, (err, info) => {
                if (error) {
                  console.log(err);
                } else {
                  console.log('Mail sent: ' + info.response);
                }
              });
              //end of sent mail

              //start sent mail to admin that helper accepted the visit
              var mailOptions = {             
                from:'"Carenow Helper" <tokenData.email.toLowerCase()>',
                to:  'hielsservices@gmail.com',// list of receivers
                //to: 'kunal.brainium@gmail.com',            
                subject: 'Booking Accepted By Helper!!', // Subject line
                html: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /></head><body bgcolor="#ededed"><table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ededed" ><tr><td><table width="60%" border="0" cellspacing="0" cellpadding="0" bgcolor="#FFF" align="center" style="border-radius:10px; border:1px solid #ededed; box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.25); margin: auto;"><tr><td valign="top" align="center" style="padding: 15px"><img src="' + siteurl + 'assets/imgs/logo.png" width="100px" height="120px" alt="Carenow logo" title="Care Now logo" border=0;/></td><tr><td valign="top" style="padding: 40px;" height="200">Hello Admin,<br><br>The helper ('+tokenData.email+') has accepted the booking with id : <strong>'+bookingData._id+'</strong> for the care request "'+bookingData.requiredService+'".<br><br>Thank you<br><br>Team Care Now</td></tr><tr><td style="padding: 15px" align="center" bgcolor="#FFF"><p style="font:normal 12px Arial, Helvetica, sans-serif;"></p></td></tr></table></td></tr></table></body></html>'
              };

              transporter.sendMail(mailOptions, (err, info) => {
                if (error) {
                  console.log(err);
                } else {
                  console.log('Mail sent: ' + info.response);
                }
              });
              //end of sent mail    
           
        } else if(data.booking_status == 3){ //rejected
            console.log("enter",tokenData.email.toLowerCase());
                //start sent mail to admin that helper rejected the work
              var mailOptions = {
               // from: '"Carenow Helper">', // sender address
               // from: tokenData.email.toLowerCase(),
                from:'"Carenow Helper" <tokenData.email.toLowerCase()>',
                to:  'hielsservices@gmail.com',// list of receivers
               // to: 'uzra.brainium@gmail.com',            
                subject: 'Booking Rejected By Helper!!', // Subject line
                html: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /></head><body bgcolor="#ededed"><table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ededed" ><tr><td><table width="60%" border="0" cellspacing="0" cellpadding="0" bgcolor="#FFF" align="center" style="border-radius:10px; border:1px solid #ededed; box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.25); margin: auto;"><tr><td valign="top" align="center" style="padding: 15px"><img src="' + siteurl + 'assets/imgs/logo.png" width="100px" height="120px" alt="Carenow logo" title="Care Now logo" border=0;/></td><tr><td valign="top" style="padding: 40px;" height="200">Hello Admin,<br><br>The helper ('+tokenData.email+') has rejected the booking with id : <strong>'+bookingData._id+'</strong> for the care request "'+bookingData.requiredService+'". Please assign another helper for this booking.<br><br>Thank you<br><br>Team Care Now</td></tr><tr><td style="padding: 15px" align="center" bgcolor="#FFF"><p style="font:normal 12px Arial, Helvetica, sans-serif;"></p></td></tr></table></td></tr></table></body></html>'
              };

              transporter.sendMail(mailOptions, (err, info) => {
                if (error) {
                  console.log(err);
                } else {
                  console.log('Mail sent: ' + info.response);
                }
              });
              //end of sent mail       
          }
           nextcb(null);
      },
    ], (err) => {
        if (err) {
          callback({
            success: false,
            message: "Some internal error has occurred",
            err: err
          });
        } else {
          if(data.booking_status == 2){
            callback({
              success: true,
              message: "Booking accepted"
            });
          }else if(data.booking_status == 3){
            callback({
              success: true,
              message: "Booking rejected"
            });
          }else{
            callback({
              success: true,
              message: "Booking status updated"
            });
          }
         
        }
      });
  
  },

 jobStartedByHelper: (data,tokenData,callback) =>{  
   async.waterfall([
     (nextcb) => {
       if (data.booking_status == undefined || data.booking_status == '') {
          callback({
            status: false,
            message: "Please provide booking status"
          });
        } else if (data.booking_id == undefined || data.booking_id == '') {
          callback({
            status: false,
            message: "Please provide booking id"
          });
        } else {
          nextcb(null);
        }
      },
     (nextcb) => {
        Booking.findOneAndUpdate({
          _id: data.booking_id
        }, {           
            booking_status: data.booking_status,
            helper_startTime: new Date().getTime()

          }).populate('booking_by_user', 'devicetoken email firstname')
        .exec((err, bookingData) => {
            if (err) {
              nextcb(err);
            } else {
              nextcb(null,bookingData);
            }
          });
      },     
    ], (err,bookingData) => {
        if (err) {
          callback({
            success: false,
            message: "Some internal error has occurred",
            err: err
          });
        } else {         
          callback({
            success: true,
            message: "Booking status updated",
            data: bookingData.helper_startTime
          });
        }
      });
  
  },

  jobCompletedByHelper: (jobData,tokenData,callback) => {
    console.log("jobData",jobData);
    async.waterfall([
       (nextcb) => {
         if (jobData.booking_status == undefined || jobData.booking_status == '') {
            callback({
              status: false,
              message: "Please provide work status"
            });
          } else if (jobData.helper_summary == undefined || jobData.helper_summary == '') {
            callback({
              status: false,
              message: "Please provide your work summary"
            });
          } else if (jobData.booking_id == undefined || jobData.booking_id == '') {
            callback({
              status: false,
              message: "Please provide booking id"
            });
          } else if (jobData.customer_signature == undefined || jobData.customer_signature == '') {
            callback({
              status: false,
              message: "Please provide customer's signature"
            });
          } else {
            nextcb(null);
          }
        },
        (nextcb) =>{
                var base64Data = jobData.customer_signature;
                // Regular expression for image type:
                // This regular image extracts the "jpeg" from "image/jpeg"
                var imageTypeRegularExpression      = /\/(.*?)$/;
                var imageBuffer                      = decodeBase64Image(base64Data);
                console.log("imageBuffer = ",imageBuffer);
                var userUploadedFeedMessagesLocation = 'assets/signature/';
                var uniqueRandomImageName            = 'sign-' + Date.now();
                var imageTypeDetected                = imageBuffer.type.match(imageTypeRegularExpression); 
                console.log("imageTypeDetected: ",imageTypeDetected); 
                var userUploadedImagePath= userUploadedFeedMessagesLocation + uniqueRandomImageName + '.' + imageTypeDetected[1];
                var imageName =  uniqueRandomImageName + '.' + imageTypeDetected[1];
                jobData.customer_signature = imageName;
                console.log("jobData.customer_signature: ", jobData.customer_signature); 
                   // Save decoded binary image to disk
                  try{
                    fs.writeFile(userUploadedImagePath, imageBuffer.data,function(){
                    console.log('Image saved on path:', userUploadedImagePath);
                    nextcb(null);
                    });
                  }catch(error){
                      console.log('ERROR:', error);
                      nextcb(err);
                  }
        },
        (nextcb) => {
          Booking.updateOne({
             _id: jobData.booking_id
           },{
              booking_status: jobData.booking_status,
              helper_summary: jobData.helper_summary,
              helper_endTime: new Date().getTime(),
              signature: jobData.customer_signature,
           }).exec((err) =>{
              if (err) {
                nextcb(err);
              } else {
                nextcb(null);

              //start sent mail to admin that helper completed the visit
              var mailOptions = {             
                from:'"Carenow Helper" <tokenData.email.toLowerCase()>',
                to:  'hielsservices@gmail.com', // list of receivers  //changes to be made for sub admin email
               // to: 'uzra.brainium@gmail.com',          
                subject: 'Task Completed By Helper!!', // Subject line
                html: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /></head><body bgcolor="#ededed"><table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ededed" ><tr><td><table width="60%" border="0" cellspacing="0" cellpadding="0" bgcolor="#FFF" align="center" style="border-radius:10px; border:1px solid #ededed; box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.25); margin: auto;"><tr><td valign="top" align="center" style="padding: 15px"><img src="' + siteurl + 'assets/imgs/logo.png" width="100px" height="120px" alt="Carenow logo" title="Care Now logo" border=0;/></td><tr><td valign="top" style="padding: 40px;" height="200">Hello Admin,<br><br>The helper ('+tokenData.email+') has completed the task with booking Id : <strong>'+jobData.booking_id+'</strong> for the care request.<br><br>Thank you<br><br>Team Care Now</td></tr><tr><td style="padding: 15px" align="center" bgcolor="#FFF"><p style="font:normal 12px Arial, Helvetica, sans-serif;"></p></td></tr></table></td></tr></table></body></html>'
              };

              transporter.sendMail(mailOptions, (err, info) => {
                if (error) {
                  console.log(err);
                } else {
                  console.log('Mail sent: ' + info.response);
                }
              });
              //end of sent mail      
           
              }
           })
        },
     ], (err) => {
      if (err) {
          callback({
            success: false,
            message: "Some internal error has occurred",
            err: err
          });
      } else {       
          callback({
            success: true,
            message: "Service completed successfully"
          }); 
      }
    });
  },

  saveHelperLoc: (locData,tokenData, callback) => {
    console.log("saveHelperLoc", locData);
   async.waterfall([
     (nextcb) => {
       if (locData.latitude == undefined || locData.latitude == '') {
          callback({
            status: false,
            message: "Please provide latitude"
          });
        } else if (locData.longitude == undefined || locData.longitude == '') {
          callback({
            status: false,
            message: "Please provide longitude"
          });
        } else {
          nextcb(null);
        }
      },      
     (nextcb) => {
      console.log("here");
        HelperLocation.update({
          helper_id: mongoose.Types.ObjectId(tokenData.id)
        }, {           
            latitude: locData.latitude,
            longitude: locData.longitude                    
          },
          {
            upsert:true
          })
        .exec((err) => {
            if (err) {
              nextcb(err);
                 console.log("here2",err);
            } else {
              nextcb(null);
            }
          });
      },
       ], (err) => {
        if (err) {
          callback({
            success: false,
            message: "Some internal error has occurred",
            err: err
          });
        } else {         
            callback({
              success: true,
              message: "Location updated"
            });
          }
      });
   
  },

  addRequest: (addRequestData,tokenData, callback) => {
    async.waterfall([
      (nextcb) => {
        if (addRequestData.salutation == undefined || addRequestData.salutation.trim() == '') {
          callback({
            success: false,
            message: "Please enter salutation"
          });
        } else if (addRequestData.name.trim() != '' && !specialchar.test(addRequestData.name)) {
          callback({
            success: false,
            message: "Name can not contain any number or special character"
          });
        } else if (addRequestData.name.trim() != '' && addRequestData.name.trim().length > 36) {
          callback({
            success: false,
            message: "Name can not be longer than 36 characters"
          });
        } else if (addRequestData.name == undefined || addRequestData.name.trim() == '') {
          callback({
            success: false,
            message: "Please enter name"
          });
        } else if (addRequestData.age == undefined || addRequestData.age.trim() == '') {
          callback({
            success: false,
            message: "Please enter age"
          });
        } else if (addRequestData.height == undefined || addRequestData.height.trim() == '') {
          callback({
            success: false,
            message: "Please enter height"
          });
        } else if (addRequestData.weight == undefined || addRequestData.weight.trim() == '') {
          callback({
            success: false,
            message: "Please enter weight"
          });
        } else if (addRequestData.serviceforwhom == undefined || addRequestData.serviceforwhom.trim() == '') {
          callback({
            success: false,
            message: "Please select for whom you need service"
          });   
        } else if (addRequestData.requiredService == undefined || addRequestData.requiredService.trim() == '') {
          callback({
            success: false,
            message: "Please select a service"
          });
        } else if (addRequestData.requestDetails == undefined || addRequestData.requestDetails == '') {
          callback({
            success: false,
            message: "Please enter request details"
          });
        } else if (addRequestData.hearingProblem == undefined || addRequestData.hearingProblem.trim() == '') {
          callback({
            success: false,
            message: "Please select hearing issue"
          });
        }
        else if (addRequestData.sightProblem == undefined || addRequestData.sightProblem.trim() == '') {
          callback({
            success: false,
            message: "Please enter sight issue"
          });       
        } else {
          nextcb(null);
        }
      },

      (nextcb) => {
        User.findOne({
          _id: tokenData.id
        }, (err, userdata) => {
          if (err) {
            nextcb(err);
          } else {
            if (userdata != null) { 
               nextcb(null,userdata);
            } else {
              // nextcb(null);
               callback({
                success: false,
                message: "Some internal error has occured",
                err: err
             });
            }
          }
        });
      },

      (userdata,nextcb) => {
        addRequestData.user_id = tokenData.id;
        console.log("userdata",userdata);
        var request = new Request(addRequestData);
        request.save((err) => {
          if (err) {
            nextcb(err);
          } else {
            nextcb(null, request);           
          }
        });

        //start sent mail
        var mailOptions = {
          //from: '"Care Now">', // sender address
          from: '"Care Now" <avijit.team@gmail.com>',
          to: userdata.email.toLowerCase(), // list of receivers
          subject: 'Care Now Add Request !!', // Subject line
          html: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /></head><body bgcolor="#ededed"><table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ededed" ><tr><td><table width="60%" border="0" cellspacing="0" cellpadding="0" bgcolor="#FFF" align="center" style="border-radius:10px; border:1px solid #ededed; box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.25); margin: auto;"><tr><td valign="top" align="center" style="padding: 15px"><img src="' + siteurl + 'assets/imgs/logo.png" width="100px" height="120px" alt="Carenow logo" title="Care Now logo" border=0;/></td><tr><td valign="top" style="padding: 40px;" height="200">Hello ' + userdata.firstname + ' ,<br><br>Welcome to Care Now. <br><br>Your request has been successfully send to the admin. This may take maximum 24 hours to get this approved by the App Admin<br><br> Thank you<br><br>Team Care Now</td></tr><tr><td style="padding: 15px" align="center" bgcolor="#FFF"><p style="font:normal 12px Arial, Helvetica, sans-serif;"></p></td></tr></table></td></tr></table></body></html>'
        };

        transporter.sendMail(mailOptions, (err, info) => {
          if (error) {
            console.log(err);
          } else {
            console.log('Mail sent: ' + info.response);
          }
        });
        //end of sent mail
       
      }
    ], (err, requestdata) => {
      if (err) {
        callback({
          success: false,
          message: "Some internal error has occured",
          err: err
        });
      }
      else {
        callback({
          success: true,
          message: "Request send successful.",
          //data: userdata
        });
      }
    });
  },


  showAdvertisement:(tokenData,callback) =>{   

      var query = Advertisement.find({}).select('ad_image');
        query.exec(function (err, adImages) {
        if (err){
          callback({
            status: false,
            message: "Some internal error has occurred",
            err: err
          });
        }else{
          callback({
            success: true,
            message: "Advertisement data fetched",
            data: adImages
          });
        }        
    });
  },

  getcategorydata: (callback) => {
    Category.find({ block: false }, (err, categorydetails) => {
      if (err) {
        callback({
          status: false,
          message: "Some internal error has occurred",
          err: err
        });
      } else {
        callback({
          success: true,
          message: "Category data fetched",
          data: categorydetails
        });
      }
    });
  },

  getallcouponlist: (callback) => {
    var sort_field = 'createdAt';
    var order = '-1';
    console.log('coupon list hittt');
    Coupons
      .find({})
      .lean()
      .sort([
        [sort_field, order]
      ])
      .exec((err, coupondetails) => {
console.log(coupondetails);
        asyncLoop(coupondetails, function (itm, next) {
          if (itm != '' || itm != undefined) {
                  Reviews.aggregate()
                  .match({coupon_id: mongoose.Types.ObjectId(itm._id)})
                  .group({_id: null,"average": { $avg: "$rating" }})
                  .exec((err, avgrate) => {
                    if (err) {
                      callback({
                        success: false,
                        message: "Some internal error has occurred",
                        err: err
                      });
                    } else {
                      
                      if(avgrate==""){
                        //console.log('hiii');
                        itm['avgvalue'] = 0;
                      }
                      else{
                        //console.log('hello');
                        itm['avgvalue'] = avgrate[0].average;
                       
                      }
                      
                      console.log(JSON.stringify(avgrate));
                     // nextcb(null, coupondetails, reviewdetails, avgrate);
                    }
                    next();
                  });

          } else {
              callback({ success: true, err: err,  message: 'item is not available' })
          }
      }, function () {
        callback({
          success: true,
          message: "Coupon data fetched",
          data: coupondetails,
        });
      });


        // if (err) {
        //   callback({
        //     success: false,
        //     message: "Some internal error has occurred",
        //     err: err
        //   });
        // } else {
        //   callback({
        //     success: true,
        //     message: "Coupon data fetched",
        //     data: coupondetails,
        //   });
        // }
      });
  },

  getfiltercouponlist: (coupondata, callback) => {
      async.waterfall([
        (nextcb) => {
          //console.log(coupondata.coupon_id);
          Coupons.findOne({ _id: coupondata.coupon_id })
          .lean()
          .exec((err, coupondetails) => {
            if (err) {
              callback({
                success: false,
                message: "Some internal error has occurred",
                err: err
              });
            } else {
              nextcb(null, coupondetails);
            }
          });
        },
        (coupondetails,nextcb) => {
          //registerData.emailOTP = emailOTP;
          Reviews.find({coupon_id: coupondata.coupon_id})
          .populate('user_id','firstname lastname')
          .lean()
          .exec((err, reviewdetails) => {
            if (err) {
              callback({
                success: false,
                message: "Some internal error has occurred",
                err: err
              });
            } else {
             // console.log(reviewdetails);
              nextcb(null, coupondetails, reviewdetails);
            }
          });
        },
        (coupondetails,reviewdetails,nextcb) => {
          Reviews.aggregate()
          .match({coupon_id: mongoose.Types.ObjectId(coupondata.coupon_id)})
          .group({_id: null,"average": { $avg: "$rating" }})
          .exec((err, avgrate) => {
            if (err) {
              callback({
                success: false,
                message: "Some internal error has occurred",
                err: err
              });
            } else {
              //console.log(JSON.stringify(avgrate));
              nextcb(null, coupondetails, reviewdetails, avgrate);
            }
          });

        },
      ], (nextcb, coupondetails, reviewdetails, avgrate) => {
          callback({
               success: true,
               message: "Filter coupon details fetched",
               data: coupondetails,
               reviewdata:reviewdetails,
               avg:avgrate
          });
      });
  },

  getsearchcoupondata: (searchData, callback) => {
    Coupons.find({
      $or: [{
        'coupon_name': new RegExp(searchData.details, "i")
      }, {
        'coupon_description': new RegExp(searchData.details, "i")
      }]
    })
      .lean()
      .exec((err, coupondetails) => {
        if (err) {
          callback({
            success: false,
            message: "Some internal error has occurred",
            err: err
          });
        } else {
          callback({
            success: true,
            message: "Search coupon details fetched",
            data: coupondetails
          });
        }
      });
  },

  savereviewdata: (reviewdata, callback)=>{
    console.log(reviewdata);
    async.waterfall([
      (nextcb) => {
        if (reviewdata.review_title == undefined || reviewdata.review_title.trim() == '') {
          callback({
            status: false,
            message: "Please enter title!"
          });
        } else if (reviewdata.review_description.trim() == undefined || reviewdata.review_description.trim() == '') {
          callback({
            status: false,
            message: "Please enter Description!"
          });
        } else if (reviewdata.rating == 0) {
          callback({
            status: false,
            message: "Please select rating!"
          });
        } else {
          nextcb(null);
        }
      },
      (nextcb) => {
        //registerData.emailOTP = emailOTP;
//console.log(reviewdata);
        var review = new Reviews(reviewdata);
        review.save((err) => {
          if (err) {
            nextcb(err);
          } else {
            nextcb(null, review);
          }
        });
      },
    ], (err) => {
      if (err) {
        callback({
          success: false,
          message: "Some internal error has occurred",
          err: err
        });
      } else {
        callback({
          success: true,
          message: "Review has submitted successfuly!"
        });
      }
    });
  },

  // get all review data of the coupon

  getAllReviewListByCoupon: (reviewdata, callback) => {
    Reviews.find({coupon_id: reviewdata.coupon_id })
      .lean()
      .exec((err, coupondetails) => {
        if (err) {
          callback({
            success: false,
            message: "Some internal error has occurred",
            err: err
          });
        } else {
          callback({
            success: true,
            message: "Filter coupon details fetched",
            data: coupondetails
          });
        }
      });
  },


  // get all coupon list by category id

  getallcouponlistByCatId: (coupondata, callback) => {
    var sort_field = 'createdAt';
    var order = '-1';
    console.log('coupon list hittt');
    Coupons
      .find({category_id: mongoose.Types.ObjectId(coupondata.catid)})
      .lean()
      .sort([
        [sort_field, order]
      ])
      .exec((err, coupondetails) => {
       console.log(coupondetails);
       if(coupondetails.length>0){
        asyncLoop(coupondetails, function (itm, next) {
          if (itm != '' || itm != undefined) {
                  Reviews.aggregate()
                  .match({coupon_id: mongoose.Types.ObjectId(itm._id)})
                  .group({_id: null,"average": { $avg: "$rating" }})
                  .exec((err, avgrate) => {
                    if (err) {
                      callback({
                        success: false,
                        message: "Some internal error has occurred",
                        err: err
                      });
                    } else {
                      
                      if(avgrate==""){
                        //console.log('hiii');
                        itm['avgvalue'] = 0;
                      }
                      else{
                        //console.log('hello');
                        itm['avgvalue'] = avgrate[0].average;
                       
                      }
                      
                      console.log(JSON.stringify(avgrate));
                     // nextcb(null, coupondetails, reviewdetails, avgrate);
                    }
                    next();
                  });

          } else {
              callback({ success: true, err: err,  message: 'item is not available' })
          }
      }, function () {
        callback({
          success: true,
          message: "Coupon data fetched",
          data: coupondetails,
        });
      });


        // if (err) {
        //   callback({
        //     success: false,
        //     message: "Some internal error has occurred",
        //     err: err
        //   });
        // } else {
        //   callback({
        //     success: true,
        //     message: "Coupon data fetched",
        //     data: coupondetails,
        //   });
        // }
         }
         else{
          callback({
            success: true,
            message: "No coupon data found!",
            data: [],
          });
         }
      });
  },

};
module.exports = helperService;
