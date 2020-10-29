var express = require("express");
var jwt = require('jsonwebtoken');

var userService = require('../services/userService');
var adminService = require('../services/adminService');

var config = require('../config');

var secretKey = config.secretKey;

module.exports = (app, express) => {

  var user = express.Router();

  user.post('/userregister', (req, res) => {
    var registrationData = req.body;
    console.log("registrationData",registrationData);
    userService.userregister(registrationData, (response) => {
      res.send(response);
    });
  });

  user.post('/resendemailOTP', (req, res) => {
    var resendOTPData = req.body;
    userService.resendemailOTP(resendOTPData, (response) => {
      res.send(response);
    });
  });

  user.post('/verifyemail', (req, res) => {
    var verifyemailData = req.body;
    userService.verifyemail(verifyemailData, (response) => {
      res.send(response);
    });
  });

  user.post('/login', (req, res) => {
    var loginData = req.body;
    userService.login(loginData, (response) => {
      res.send(response);
    });
  });

  // FB Login
  user.post('/fblogin', (req, res) => {
    var loginData = req.body;
    userService.fblogin(loginData, (response) => {
      res.send(response);
    });
  });

  user.post('/forgotpassword', (req, res) => {
    var forgotpasswordData = req.body;
    userService.forgotpassword(forgotpasswordData, (response) => {
      res.send(response);
    });
  });

  user.get('/getcategorydata', (req, res) => {
    userService.getcategorydata((response) => {
      res.send(response);
    });
  });

  user.get('/cronJobForAppointment', (req, res) => {   //not reqd anymore as cronjob implemented
    userService.cronJobForAppointment((response) => {
      res.send(response);
    });
  });

  //=================
  //Middleware to check token
  //=================

  user.use((req, res, next) => {
    var token = req.body.token || req.param('token') || req.headers['x-access-token'];
    console.log("x-access-token",token);
    if (token) {
      jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
          res.status(403).send({
            success: false,
            message: "Authentication failed"
          });
        } else {
          req.decoded = decoded;
          next();
        }
      });
    } else {
      res.status(403).send({
        success: false,
        message: "Authentication token required"
      });
    }
  });

  //=================
  //  Middleware end
  //=================

  user.get('/getprofileData', (req, res) => {
    var tokendata = req.decoded;
    userService.getprofileData(tokendata, (response) => {
      res.send(response);
    });
  });

  user.post('/updateProfile', (req, res) => {
    var updateprofileData = req.body;
    var tokendata = req.decoded;
    userService.updateProfile(updateprofileData, tokendata, (response) => {
      res.send(response);
    });
  });

  user.post('/changePassword', (req, res) => {
    var changepasswordData = req.body;
    var tokendata = req.decoded;
    userService.changePassword(changepasswordData, tokendata, (response) => {
      res.send(response);
    });
  });

  user.post('/updateProfileImage', (req, res) => {
  console.log("updateProfileImage");   
    var profileimage = req.files;
    var tokenData = req.decoded;
    userService.updateProfileImage(profileimage, tokenData, (response) => {
      res.send(response);
    });
  });
  
  user.post('/addRequest', (req, res) => {
    var addRequestData = req.body;
    var tokendata = req.decoded;
    userService.addRequest(addRequestData, tokendata, (response) => {
      res.send(response);
    });
  });  

  user.post('/savenotification', (req, res) => {
    var savenotificationData = req.body;   
    var tokendata = req.decoded;
    userService.savenotification(savenotificationData, (response) => {
      res.send(response);
    });
  });

  user.get('/getallnotification', (req, res) => {
    var tokendata = req.decoded;
    userService.getallnotification(tokendata, (response) => {
      res.send(response);
    });
  });

  user.get('/getMedinotification', (req, res) => {
    var tokendata = req.decoded;
    userService.getMedinotification(tokendata, (response) => {
      res.send(response);
    });
  });

  user.get('/getAppointnotification', (req, res) => {
    var tokendata = req.decoded;
    userService.getAppointnotification(tokendata, (response) => {
      res.send(response);
    });
  });

   user.get('/getuserrequestlist', (req, res) => {
     var pagenum = req.param('page');
     var tokendata = req.decoded;
    userService.getuserrequestlist(pagenum,tokendata, (response) => {
      res.send(response);
    });
  });

  user.post('/bookAssessment', (req, res) => {
    var bookAssessmentData = req.body;  
    var tokendata = req.decoded;
    bookAssessmentData.booking_by_user = tokendata.id    
    userService.bookAssessment(bookAssessmentData, (response) => {
      res.send(response);
    });
  });

  user.get('/getuserbookinglist', (req, res) => {
     var pagenum = req.param('page');
     var tokendata = req.decoded;
    userService.getuserbookinglist(pagenum,tokendata, (response) => {
      res.send(response);
    });
  });

  user.post('/getbookingdetails', (req, res) => {
    var bookingData = req.body;
    userService.getbookingdetails(bookingData, (response) => {
      res.send(response);
    });
  }); 

  user.post('/getHelperDetails', (req, res) => {
    var userData = req.body;
    userService.getHelperDetails(userData, (response) => {
      res.send(response);
    });
  }); 

  user.get('/getuserpastbookinglist', (req, res) => {
     var pagenum = req.param('page');
     var tokendata = req.decoded;
    userService.getuserpastbookinglist(pagenum,tokendata, (response) => {
      res.send(response);
    });
  });

  user.post('/saveReview', (req, res) => {
    var reviewData = req.body;
    var tokendata = req.decoded;
    reviewData.rating_from = tokendata.id;
    console.log("reviewdata",reviewData);
    userService.saveReview(reviewData, (response) => {
      res.send(response);
    });
  });

  user.post('/stopMedicationReminder', (req, res) => {
    var bookingData = req.body;    
    userService.stopMedicationReminder(bookingData, (response) => {
      res.send(response);
    });
  });

  user.post('/getPersonDetails', (req, res) => {

    var personData = req.body;
    var tokendata = req.decoded;
     console.log("personData",personData);
    userService.getPersonDetails(personData, tokendata, (response) => {
      res.send(response);
    });
  });


  // user.post('/saveChatImages', (req, res) => {
  // console.log("saveChatImages");   
  //   var chatimage = req.files;
  //   var tokenData = req.decoded;
  //   userService.saveChatImages(chatimage, tokenData, (response) => {
  //     res.send(response);
  //   });
  // });
  

  user.post('/fetchMessages', (req, res) => {   
    var data = req.body;
    userService.fetchMessages(data, (response) => {
      res.send(response);
    });
  });

  user.post('/fetchMessagesOfAdminAndHelper', (req, res) => {   
    var data = req.body;
    console.log("data111",data);
    adminService.fetchMessagesOfAdminAndHelper(data, (response) => {
      res.send(response);
    });
  });

  user.get('/getallcouponlist', (req, res) => {
    userService.getallcouponlist((response) => {
      res.send(response);
    });
  });

  user.post('/getfiltercouponlist', (req, res) => {
    var coupondata = req.body;
    console.log(req.body);
    userService.getfiltercouponlist(coupondata, (response) => {
      res.send(response);
    });
  });

  user.post('/getallcouponlistbycatid', (req, res) => {
    var coupondata = req.body;
    console.log(req.body);
    userService.getallcouponlistByCatId(coupondata, (response) => {
      res.send(response);
    });
  });

  user.post('/getsearchcoupondata', (req, res) => {
    var coupondata = req.body;
    userService.getsearchcoupondata(coupondata, (response) => {
      res.send(response);
    });
  });

  user.post('/postreviewdata', (req, res) => {
    var reviewdata = req.body;
    userService.savereviewdata(reviewdata, (response) => {
      res.send(response);
    });
  });

  user.post('/postreviewdata', (req, res) => {
    var reviewdata = req.body;
    userService.getreviewdata(reviewdata, (response) => {
      res.send(response);
    });
  });

  return user;
}
