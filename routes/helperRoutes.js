var express = require("express");
var jwt = require('jsonwebtoken');

var helperService = require('../services/helperService');

var config = require('../config');

var secretKey = config.secretKey;

module.exports = (app, express) => {

  var helper = express.Router();

  // helper.post('/helperregister', (req, res) => {
  //   var registrationData = req.body;
  //   console.log("registrationData",registrationData);
  //   helperService.helperregister(registrationData, (response) => {
  //     res.send(response);
  //   });
  // });

  // helper.post('/resendemailOTP', (req, res) => {
  //   var resendOTPData = req.body;
  //   helperService.resendemailOTP(resendOTPData, (response) => {
  //     res.send(response);
  //   });
  // });

  // helper.post('/verifyemail', (req, res) => {
  //   var verifyemailData = req.body;
  //   helperService.verifyemail(verifyemailData, (response) => {
  //     res.send(response);
  //   });
  // });

  helper.post('/login', (req, res) => {
    var loginData = req.body;
    helperService.login(loginData, (response) => {
      res.send(response);
    });
  });

  // FB Login
  helper.post('/fblogin', (req, res) => {
    var loginData = req.body;
    helperService.fblogin(loginData, (response) => {
      res.send(response);
    });
  });

  helper.post('/forgotpassword', (req, res) => {
    var forgotpasswordData = req.body;
    helperService.forgotpassword(forgotpasswordData, (response) => {
      res.send(response);
    });
  });

  helper.get('/getcategorydata', (req, res) => {
    helperService.getcategorydata((response) => {
      res.send(response);
    });
  });

  //=================
  //Middleware to check token
  //=================

  helper.use((req, res, next) => {
    var token = req.body.token || req.param('token') || req.headers['x-access-token'];
    //console.log(token);
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


  helper.get('/getprofileData', (req, res) => {
    var tokendata = req.decoded;
    helperService.getprofileData(tokendata, (response) => {
      res.send(response);
    });
  });

  helper.post('/updateProfile', (req, res) => {
    var updateprofileData = req.body;
    var tokendata = req.decoded;
    helperService.updateProfile(updateprofileData, tokendata, (response) => {
      res.send(response);
    });
  });

  helper.post('/updateSchedule', (req, res) => {
    var updateprofileData = req.body;
    var tokendata = req.decoded;
    helperService.updateSchedule(updateprofileData, tokendata, (response) => {
      res.send(response);
    });
  });
  
  // helper.get('/getScheduleAvailability', (req, res) => {
  //   var tokendata = req.decoded;
  //   helperService.getScheduleAvailability(tokendata, (response) => {
  //     res.send(response);
  //   });
  // });
  helper.post('/getScheduleAvailability', (req, res) => {
   // console.log("getScheduleAvailability");
    var data = req.body;
    var tokendata = req.decoded;
    // console.log("data",data);
    helperService.getScheduleAvailability(data, tokendata, (response) => {
      res.send(response);
    });
  });

  helper.post('/changePassword', (req, res) => {
    var changepasswordData = req.body;
    var tokendata = req.decoded;
    helperService.changePassword(changepasswordData, tokendata, (response) => {
      res.send(response);
    });
  });

  helper.post('/updateProfileImage', (req, res) => {  
    var profileimage = req.files;
    var tokenData = req.decoded;
    helperService.updateProfileImage(profileimage, tokenData, (response) => {
      res.send(response);
    });
  });

   helper.post('/updateVisitImage', (req, res) => {      
    var profileimage = req.files;
    var bookingdata = req.body;
    var tokenData = req.decoded;
    helperService.updateVisitImage(profileimage, tokenData, bookingdata, (response) => {
      res.send(response);
    });
  });

  helper.post('/uploadFile', (req, res) => {   
    var file = req.files;
    var tokenData = req.decoded;
    helperService.uploadFile(file, tokenData, (response) => {
      res.send(response);
    });
  });

  helper.post('/savenotification', (req, res) => {
    var savenotificationData = req.body;   
    var tokendata = req.decoded;
    helperService.savenotification(savenotificationData, (response) => {
      res.send(response);
    });
  });

  helper.get('/getNotificationList', (req, res) => {
    // var pagenum = req.param('page');
     var tokenData = req.decoded;
    helperService.getNotificationList(tokenData, (response) => {
      res.send(response);
    });
  });
  
  helper.get('/gethelperpastbookinglist', (req, res) => {
    // var pagenum = req.param('page');
     var tokenData = req.decoded;
    helperService.gethelperpastbookinglist(tokenData, (response) => {
      res.send(response);
    });
  });
  
  helper.get('/gethelperbookinglist', (req, res) => {
    // var pagenum = req.param('page');
     var tokenData = req.decoded;
    helperService.gethelperbookinglist(tokenData, (response) => {
      res.send(response);
    });
  });
  
  helper.post('/getbookingdetails', (req, res) => {
    var bookingData = req.body;
    // var tokendata = req.decoded;
    helperService.getbookingdetails(bookingData, (response) => {
      res.send(response);
    });
  });
  
  helper.post('/updatebookingstatus', (req, res) => {
    var Data = req.body;   
    var tokendata = req.decoded;
    helperService.updatebookingstatus(Data,tokendata, (response) => {
      res.send(response);
    });
  });

  helper.post('/jobStartedByHelper', (req, res) => {
    var Data = req.body;   
    var tokendata = req.decoded;
    helperService.jobStartedByHelper(Data,tokendata, (response) => {
      res.send(response);
    });
  });
  
  helper.post('/jobCompletedByHelper', (req, res) => {
    var Data = req.body;
    var tokendata = req.decoded;
    helperService.jobCompletedByHelper(Data,tokendata, (response) => {
      res.send(response);
    });
  });

  helper.post('/saveHelperLoc', (req, res) => {  
    var data = req.body;
    var tokenData = req.decoded;
    helperService.saveHelperLoc(data, tokenData, (response) => {
      res.send(response);
    });
  });


  helper.post('/addRequest', (req, res) => {
    var addRequestData = req.body;
    var tokendata = req.decoded;
    helperService.addRequest(addRequestData, tokendata, (response) => {
      res.send(response);
    });
  });
  
  helper.post('/showAdvertisement', (req, res) => {   
    var tokendata = req.decoded;
    helperService.showAdvertisement(tokendata, (response) => {
      res.send(response);
    });
  });

  helper.get('/getallcouponlist', (req, res) => {
    helperService.getallcouponlist((response) => {
      res.send(response);
    });
  });

  helper.post('/getfiltercouponlist', (req, res) => {
    var coupondata = req.body;
    console.log(req.body);
    helperService.getfiltercouponlist(coupondata, (response) => {
      res.send(response);
    });
  });

  helper.post('/getallcouponlistbycatid', (req, res) => {
    var coupondata = req.body;
    console.log(req.body);
    helperService.getallcouponlistByCatId(coupondata, (response) => {
      res.send(response);
    });
  });

  helper.post('/getsearchcoupondata', (req, res) => {
    var coupondata = req.body;
    helperService.getsearchcoupondata(coupondata, (response) => {
      res.send(response);
    });
  });

  helper.post('/postreviewdata', (req, res) => {
    var reviewdata = req.body;
    helperService.savereviewdata(reviewdata, (response) => {
      res.send(response);
    });
  });

  helper.post('/postreviewdata', (req, res) => {
    var reviewdata = req.body;
    helperService.getreviewdata(reviewdata, (response) => {
      res.send(response);
    });
  });

  return helper;
}
