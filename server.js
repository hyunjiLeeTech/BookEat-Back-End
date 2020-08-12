const express = require("express");

const cors = require("cors");
const mongoose = require("mongoose");
const secret = require("./auth/secret");
require("dotenv").config();

const expressSession = require("express-session");
const passport = require("./auth/passport-config");
const jwt = require("jsonwebtoken");

const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require('gridfs-stream');
const methodOverride = require("method-override");

const app = express();
const port = process.env.PORT || 5000;
const cache = require('memory-cache') //in-memory cache
const moment = require('moment')
const nodemailer = require('nodemailer')
const frontEndUrl = 'https://bookeatfront.herokuapp.com' 
const Axios = require('axios')
var gfs;


var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'a745874355@gmail.com',
    pass: 'Aa7758521.'
  }
});


//database models
let Customer = require("./models/customer.model");
let Account = require("./models/account.model");
let RestaurantOwner = require("./models/restaurantOwner.model");
let Restaurant = require("./models/restaurnat.model");
let Address = require("./models/address.model");
let Manager = require("./models/manager.model");
let Review = require("./models/review.model");





app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(
  expressSession({
    secret: "BookEatAwesome",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

mongoose.set("useUnifiedTopology", true);

const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });

const connection = mongoose.connection;



//create storage engine
var storage = new GridFsStorage({
  url: uri,
  file: (req, file) => {
    return new Promise((res, ref) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return rejects(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        res(fileInfo);
      })
    })
  }
})

const upload = multer({ storage });

// routers
const customersRouter = require("./routes/customers");
const restaurantOwnerRouter = require("./routes/restaurnatOwners");
const cuisineStyleRouter = require("./routes/cuisineStyle");
const priceRangeRouter = require("./routes/priceRange");
const categoryRouter = require("./routes/category");
const accountRouter = require("./routes/account");
const restaurantRouter = require("./routes/restaurant");
const addressRouter = require("./routes/address");
const managerRouter = require("./routes/manager");
const storeTimeRouter = require("./routes/storeTime");
const menuRouter = require("./routes/menu");
//const { load } = require("dotenv/types");
const Reservation = require("./models/reservation.model");
const Table = require("./models/table.model");
const { filter } = require("methods");
const Menu = require("./models/menu.model");
const discountRouter = require("./routes/discount");
const reviewRouter = require("./routes/review");
const { update, replaceOne } = require("./models/customer.model");
const Discount = require("./models/discount.model");
const StoreTime = require("./models/storeTime.model");
const ExternalLogin = require("./models/externalLogin.model");

// app.use
app.use(
  "/customers",
  passport.authenticate("jwt", { session: false }),
  customersRouter
);
app.use(
  "/restaurant",
  passport.authenticate("jwt", { session: false }), 
  restaurantRouter
);
app.use(
  "/restaurantOwners",
  passport.authenticate("jwt", { session: false }),
  restaurantOwnerRouter
);
app.use("/cuisineStyle", cuisineStyleRouter);
app.use("/category", categoryRouter);
app.use("/priceRange", priceRangeRouter);

app.use("/account", accountRouter);
app.use("/address", addressRouter);
app.use(
  "/manager",
  passport.authenticate("jwt", { session: false }),
  managerRouter
);
app.use(
  "/menu",
  passport.authenticate("jwt", { session: false }),
  menuRouter
);
app.use(
  "/discount",
  passport.authenticate("jwt", { session: false }),
  discountRouter
);
app.use("/storeTime", storeTimeRouter);
app.use(
  "/review",
  passport.authenticate("jwt", { session: false }),
  reviewRouter
)

app.post("/addPictures", upload.array('pictures[]', 10), (req, res) => {
  try {
    var pictures = req.files;
    res.json({ errcode: 0, pictures: pictures });

  } catch (err) {
    res.json({ ercode: 1, errmsg: err });
  }
})

app.post("/addMenuImage", upload.single('menuImage'), (req, res) => {
  menuImage = req.file;
  res.json({ errcode: 0, menuImage: req.file.filename });
});

app.get("/getReviewsWithoutSignUp", async (req, res) => {
  console.log("Accessing /getReviewsWithoutSignUp");
  var restaurantId = req.query.resId;

  try {
    var reviews = await Review.find({
      restaurantId: restaurantId,
      isActive: true
    })
      .sort({ "updatedAt": -1 })
      .populate("customerId");
    console.log(reviews);
    res.json({ errcode: 0, reviews: reviews });

  } catch (err) {
    res.json({ errcode: 1, errmsg: "internal error" });
  }
})

app.post("/editMenuImage", upload.single('menuImage'), (req, res) => {
  menuImage = req.file;
  res.json({ errcode: 0, menuImage: req.file.filename });
})

app.delete("/deleteImage/:id", (req, res) => {
  gfs.remove({ filename: req.params.id, root: 'uploads' }, (err, gridStore) => {
    if (err) {
      return res.json({ errcode: 1, errmsg: "Image not found" });
    } else {
      return res.json({ errcode: 0, errmsg: "Image delete success" });
    }
  })
})

app.delete("/deleteImages", (req, res) => {
  var images = req.query.pictures;
  for (var i = 0; i < images.length; i++) {
    gfs.remove({ filename: images[i], root: 'uploads' }, (err, gridStore) => {
      if (err) {
        return res.json({ errcode: 1, errmsg: "Image not found" });
      }
    })
  }

  res.json({ errcode: 0, errmsg: "Images delete success" });
})

app.get("/getimage/:id", (req, res) => {
  var imageId = req.params.id.trim();
  gfs.files.findOne({ filename: imageId }, (err, file) => {
    if (!file) {
      file = { isImage: false, file: 'File not found' };
      return res.json({ errcode: 1, image: file })
    }

    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      file.isImage = true;
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      file.isImage = false;
      return res.json({ errcode: 1, file: 'Not an image file' });
    }
  })
})

app.get(
  "/logout",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    var u = req.user;
    if (u) {
      console.log("logging out user: " + u.email);
      u.token = "";
      u.save()
        .then(() => {
          res.json({ errcode: 0, errmsg: "You have been logged out" });
        })
        .catch((err) => {
          res.json({ errcode: 1, errmsg: err });
        });
    }
  }
);



app.post('/loginExternal', async function (req, res) {
  var token = req.body.token;
  var externalType = req.body.externalType
  if (Number.parseInt(externalType) === 1) {
    Axios({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo',
      method: 'get',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then(async resp => {
      var external = await ExternalLogin.findOne({ externalId: resp.data.id })
      if (!external) return res.json({ errcode: 2, profile: resp.data, errmsg: 'sign up needed' })
      var user = await Account.findById(external.account);
      user.token = "";
      const token = jwt.sign(user.toJSON(), secret.secret, {
        expiresIn: "30 days",
      });
      user.token = token;
      user.save().then((user) => {
        user.token = '';
        user.password = '';
        res.json({ errcode: 0, user: user, jwt: token })
      })
    }).catch(err => {
      console.log(err)
      return res.json({ errcode: 1, errmsg: 'failed to valided google account' })
    })
  } else if (Number.parseInt(externalType) === 2) {
    Axios({
      url: 'https://graph.facebook.com/me',
      method: 'get',
      params: {
        fields: ['id', 'email', 'first_name', 'last_name'].join(','),
        access_token: token,
      },
    }).then(async resp => {
      var external = await ExternalLogin.findOne({ externalId: resp.data.id })
      if (!external) return res.json({ errcode: 2, profile: resp.data, errmsg: 'sign up needed' })
      var user = await Account.findById(external.account);
      user.token = "";
      const token = jwt.sign(user.toJSON(), secret.secret, {
        expiresIn: "30 days",
      });
      user.token = token;
      user.save().then((user) => {
        user.token = '';
        user.password = '';
        res.json({ errcode: 0, user: user, jwt: token })
      })
    }).catch(err => {
      console.log(err)
      return res.json({ errcode: 1, errmsg: 'failed to valided google account' })
    });
  }

  // Axios({
  //   url: 'https://graph.facebook.com/me',
  //   method: 'get',
  //   params: {
  //     fields: ['id', 'email', 'first_name', 'last_name'].join(','),
  //     access_token: accesstoken,
  //   },
  // });
})

//login
app.post("/login", function (req, res, next) {
  passport.authenticate("local", { session: false }, function (
    err,
    user,
    info
  ) {
    if (err) {
      return next(err);
    }
    if (!user) {
      // *** Display message without using flash option
      // re-render the login form with a message
      return res.json({ errcode: 1, errmsg: info.message });
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      console.log("-------req.user-----------");
      console.log(user);
      console.log("-------req.user-----------");
      user.token = "";
      const token = jwt.sign(user.toJSON(), secret.secret, {
        expiresIn: "30 days",
      });
      user.token = token;
      user
        .save()
        .then(() => {
          console.log("User: " + user.email + " access token updated");
          user.password = "";
          user.token = "";
          let returnData = {
            errcode: 0,
            user: user,
            jwt: token,
          };
          res.json(returnData);
        })
        .catch((err) => {
          console.log(err);
          next();
        });
    });
  })(req, res, next);
});

// for user signup
let findAccountByEmailAsyc = async function (email) {
  return await Account.find({ email: email });
};

// for customer signup
let addCustomerAsync = async function (obj) {
  const regExpEmail = RegExp(
    /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/
  );
  const regExpPhone = RegExp(
    /^\(?([0-9]{3})\)?[-.●]?([0-9]{3})[-.●]?([0-9]{4})$/
  );

  const firstName = obj.firstName;
  const lastName = obj.lastName;
  const email = obj.email;
  const phoneNumber = obj.phoneNumber;
  const password = obj.password;
  const userTypeId = obj.userTypeId;
  const emailVerified = obj.emailVerified ? true : false

  const newAccount = new Account({
    email,
    password,
    userTypeId,
    isActive: true,
    emailVerified: emailVerified
  });

  let message = "";
  if ((await findAccountByEmailAsyc(email)).length > 0) {
    message = "This email is already registered";
    throw message;
  }

  if (firstName.length < 1) {
    message = "First name should have at least one char";
    throw message;
  }
  if (lastName.length < 1) {
    message = "First name should have at least one char";
    throw message;
  }
  if (!regExpEmail.test(email)) {
    message = "Incorrect email format";
    throw message;
  }

  if (!regExpPhone.test(phoneNumber)) {
    message = "Incorrect phone number";
    throw message;
  }
  let account = await newAccount.save();
  const newCustomer = new Customer({
    firstName,
    lastName,
    phoneNumber,
    noShowCount: 0,
    account: account._id,
  });

  return await newCustomer.save();
};

app.get('/verifyEmail/:id', async (req, res) => {
  var aid = req.params.id;
  var acc = await Account.findOne({ _id: aid })
  if (acc.emailVerified === false) {
    acc.emailVerified = true;
    acc.save().then(() => {
      res.json({ errcode: 0, errmsg: 'email verified' })
    })
  } else {
    res.json({ errcode: 1, errmsg: 'email is already verified' })
  }
})



/**
 * @param {String} destination email send to
 * @param {String} htmlMessage a HTML message in String format
 * @param {(error, info) => void} callback call back
 */
async function sendActiveEmail(destination, htmlMessage, callback) {
  var mailOptions = {
    from: 'a745874355@gmail.com',
    to: destination,
    subject: 'Active your BookEat Account',
    html: htmlMessage
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (typeof callback === 'function')
      callback(error, info);
  });
}
/** 
* @param {(error, info) => void} callback call back
*/
function sendEmail(options, callback) {
  transporter.sendMail(options, function (error, info) {
    if (typeof callback === 'function') callback(error, info)
  })
}

app.post('/signupExternal', async function (req, res) {
  var token = req.body.token;
  var externalType = req.body.externalType
  if (Number.parseInt(externalType) === 1) {
    Axios({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo',
      method: 'get',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then(async resp => {
      var external = await ExternalLogin.findOne({ externalId: resp.data.id })
      var account = await Account.findOne({ email: resp.data.email })
      if (external) return res.json({ errcode: 2, errmsg: 'This email is already used.' })
      if (account) return res.json({ errcode: 3, errmsg: 'This email is already used.' })
      var obj = {
        firstName: req.body.firstname,
        lastName: req.body.lastname,
        email: resp.data.email,
        phoneNumber: req.body.phonenumber,
        password: new Date().getTime().toString(),
        userTypeId: 1,
        emailVerified: true,
      };
      addCustomerAsync(obj).then(async (cus) => {
        var acc = await Account.findById(cus.account);
        var e = new ExternalLogin({
          account: acc,
          externalId: resp.data.id,
          externalType: 1,
        })
        await e.save();
        return res.json({ errcode: 0, errmsg: 'success' })
      }).catch(err => {
        console.log(err)
        return res.json({ errcode: 4, errmsg: 'error' })
      })
    }).catch(err => {
      console.log(token)
      return res.json({ errcode: 1, errmsg: 'failed to valided google account' })
    })
  }
  else if (Number.parseInt(externalType) === 2) {
    Axios({
      url: 'https://graph.facebook.com/me',
      method: 'get',
      params: {
        fields: ['id', 'email', 'first_name', 'last_name'].join(','),
        access_token: token,
      },
    }).then(async resp => {
      var external = await ExternalLogin.findOne({ externalId: resp.data.id })
      var account = await Account.findOne({ email: resp.data.email })
      if (external) return res.json({ errcode: 2, errmsg: 'This email is already used.' })
      if (account) return res.json({ errcode: 3, errmsg: 'This email is already used.' })
      var obj = {
        firstName: req.body.firstname,
        lastName: req.body.lastname,
        email: resp.data.email,
        phoneNumber: req.body.phonenumber,
        password: new Date().getTime().toString(),
        userTypeId: 1,
        emailVerified: true,
      };
      addCustomerAsync(obj).then(async (cus) => {
        var acc = await Account.findById(cus.account);
        var e = new ExternalLogin({
          account: acc,
          externalId: resp.data.id,
          externalType: 2,
        })
        await e.save();
        return res.json({ errcode: 0, errmsg: 'success' })
      }).catch(err => {
        console.log(err)
        return res.json({ errcode: 4, errmsg: 'error' })
      })
    }).catch(err => {
      console.log(err)
      return res.json({ errcode: 1, errmsg: 'failed to valided facebook account' })
    });
  }


})

// post request (/customers/add)
app.post("/customersignup", (req, res) => {
  const firstName = req.body.firstname;
  const lastName = req.body.lastname;
  const email = req.body.email;
  const phoneNumber = req.body.phonenumber;
  const password = req.body.password;
  const userTypeId = 1; //customer
  var obj = {
    firstName,
    lastName,
    email,
    phoneNumber,
    password,
    userTypeId,
  };
  addCustomerAsync(obj)
    .then((acc) => {

      var msg = '<h1>Welcome ' + obj.firstName + ' ' + obj.lastName + '</h1><p>' + frontEndUrl + '/EmailConfirmation/' + acc.account + '</p>'
      sendActiveEmail(obj.email, msg, function (error, info) {
        if (error) console.log(error)
        else console.log(info.response)
      })
      res.json({ errcode: 0, errmsg: "success" });
    })
    .catch((err) => {
      res.json({ errcode: 1, errmsg: err });
    });
});
// app.post('/login', passport.authenticate('local', {session: false}), function (req, res) {
//   console.log("-------req.user-----------");
//   console.log(req.user);
//   console.log("-------req.user-----------");
//   var user = req.user;

//   const token = jwt.sign(user.toJSON(), secret.secret, {expiresIn: 50000000});
//   let returnData = {
//     errcode: 0,
//     user: req.user,
//     jwt: token,
//   };
//   res.json(returnData);
// });

//restaurant signup
let addRestaurantOwnerAsync = async function (obj) {
  const regExpEmail = RegExp(/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/);

  const regExpPhone = RegExp(
    /^\(?([0-9]{3})\)?[-.●]?([0-9]{3})[-.●]?([0-9]{4})$/
  );

  const regExpPostalCode = RegExp(/^(?!.*[DFIOQU])[A-VXY][0-9][A-Z] ?[0-9][A-Z][0-9]$/);

  const regExpBusinessNum = RegExp(/^[0-9]{9}$/);

  //account
  const userTypeId = 2; // restaurant owner
  const password = obj.password;
  const email = obj.email;

  //restaurantOwner
  // this is for restaurant

  //address
  const province = obj.province;
  const streetNum = obj.streetNumber;
  const streetName = obj.streetName;
  const postalCode = obj.postalCode;
  const city = obj.city;

  //restaurant
  const resName = obj.resName;
  const businessNum = obj.businessNum;
  const phoneNumber = obj.phoneNumber;
  const status = obj.status;

  const newAccount = new Account({
    email,
    password,
    userTypeId,
    isActive: true,
  });

  const newAddress = new Address({
    province,
    streetName,
    streetNum,
    postalCode,
    city,
  });

  let message = "";
  if ((await findAccountByEmailAsyc(email)).length > 0) {
    message = "This email is already registered";
    throw message;
  }

  if (!regExpEmail.test(email)) {
    message = "Incorrect email format";
    throw message;
  }

  if (!regExpPhone.test(phoneNumber)) {
    message = "Incorrect phone number";
    throw message;
  }

  if (!regExpBusinessNum.test(businessNum)) {
    message = "Incorrect business number";
    throw message;
  }

  if (!regExpPostalCode.test(postalCode)) {
    message = "Incorrect postal code";
    throw message;
  }

  if (resName.length < 1) {
    message = "Restaurant name should have at least one char";
    throw message;
  }

  if (streetName.length < 1) {
    message = "Street name should have at least one char";
    throw message;
  }

  if (city.length < 1) {
    message = "City should have at least one char";
    throw message;
  }

  // if (!regExpPassword.test(password)) {
  //   message = "Incorrect password";
  //   throw message;
  // }

  let acnt = await newAccount.save();
  let address = await newAddress.save();

  const newRestaurantOwner = new RestaurantOwner({
    account: acnt._id,
  });

  let restOwner = await newRestaurantOwner.save();

  const newRestaurant = new Restaurant({
    resName,
    phoneNumber,
    businessNum,
    status,
    restaurantOwnerId: restOwner._id,
    addressId: address._id,
  });
  await newRestaurant.save()
  return restOwner;
};

app.post("/restaurantownersignup", (req, res) => {
  //account
  const userTypeId = 2; // restaurant owner
  const password = req.body.password;
  const email = req.body.email;

  //restaurantOwner
  // this is for restaurant

  //address
  const province = req.body.province;
  const streetNumber = req.body.streetnumber;
  const streetName = req.body.streetname;
  const postalCode = req.body.postalcode;
  const city = req.body.city;

  //restaurant
  const resName = req.body.resname;
  const businessNum = req.body.businessnumber;
  const phoneNumber = req.body.phonenumber;
  const status = 3; // sign up. not completed the profile

  var obj = {
    userTypeId,
    password,
    email,
    province,
    streetNumber,
    streetName,
    postalCode,
    city,
    resName,
    businessNum,
    phoneNumber,
    status,
  };
  addRestaurantOwnerAsync(obj)
    .then((acc) => {
      var msg = '<h1>Welcome  </h1><p>' + frontEndUrl + '/EmailConfirmation/' + acc.account + '</p>'
      sendActiveEmail(obj.email, msg);
      res.json({ errcode: 0, errmsg: "success" });
    })
    .catch((err) => {
      console.log('error adding restaurant owner account')
      console.log(err)
      res.json({ errcode: 1, errmsg: err });
    });
});

//manager sign up
let addManagerAsync = async function (obj) {
  //account info
  const email = obj.email;
  const password = obj.password;
  const userTypeId = 3; // manager user type: 3

  //manager info
  const firstname = obj.firstname;
  const lastname = obj.lastname;
  const phonenumber = obj.phonenumber;

  //manager and account info (status)
  const isActive = true; // maanager account activated

  const newAccount = new Account({
    email,
    password,
    userTypeId,
    isActive,
  });

  //Validation
  let message = "";
  const regExpEmail = RegExp(/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/);

  const regExpPhone = RegExp(
    /^\(?([0-9]{3})\)?[-.●]?([0-9]{3})[-.●]?([0-9]{4})$/
  );

  if ((await findAccountByEmailAsyc(email)).length > 0) {
    message = "This email is already registered";
    throw message;
  }

  if (!regExpEmail.test(email)) {
    message = "Incorrect email format";
    throw message;
  }

  if (!regExpPhone.test(phonenumber)) {
    message = "Incorrect phone number";
    throw message;
  }

  if (lastname.length < 1) {
    message = "Lastname should have at least one char";
    throw message;
  }

  if (firstname.length < 1) {
    message = "Firstname should have at least one char";
    throw message;
  }

  let account = await newAccount.save();

  let restaurantId = await findRestaurantIdAsync(obj.resOwnerAccountId);

  const newManager = new Manager({
    firstname,
    lastname,
    phonenumber,
    isActive,
    accountId: account._id,
    restaurantId,
  });

  return await newManager.save();
};

app.post("/managersignup", (req, res) => {
  const resOwnerAccountId = req.body.resOwnerAccountId;

  //account info
  const email = req.body.email;
  const password = req.body.passwordMan;

  //manager info
  const firstname = req.body.firstName;
  const lastname = req.body.lastName;
  const phonenumber = req.body.phonenumber;

  obj = {
    email,
    password,
    firstname,
    lastname,
    phonenumber,
    resOwnerAccountId,
  };

  addManagerAsync(obj)
    .then(() => {
      var msg = '<h1>Welcome  </h1><p>' + frontEndUrl + '/EmailConfirmation/' + obj.email + '</p>'
      sendActiveEmail(obj.email, msg);
      res.json({ errcode: 0, errmsg: "success" });
    })
    .catch((err) => {
      res.json({ errcode: 1, errmsg: err });
    });
});

let findRestaurantIdAsync = async (accountId) => {
  let resOwnerId, resId;
  await RestaurantOwner.findOne({ account: accountId }).then((restOwner) => {
    resOwnerId = restOwner._id;
  });

  await Restaurant.findOne({ restaurantOwnerId: resOwnerId }).then(
    (restaurant) => {
      resId = restaurant._id;
    }
  );

  return resId;
};

app.get(
  "/testAuth",
  passport.authenticate("jwt", { session: false }),
  function (req, res) {
    var u = req.user; //u is this user that in database - always up to date
    res.json({ message: "Logged in" });
    console.log(req.user);
  }
);

app.get("/restaurants/:id", async function (req, res) {
  try {
    var rest = await Restaurant.findOne({ _id: req.params.id })
      .populate('addressId').populate('categoryId').populate('cuisineStyleId').populate('priceRangeId')
      .populate('monOpenTimeId')
      .populate('tueOpenTimeId')
      .populate('wedOpenTimeId')
      .populate('thuOpenTimeId')
      .populate('friOpenTimeId')
      .populate('satOpenTimeId')
      .populate('sunOpenTimeId')
      .populate('monCloseTimeId')
      .populate('tueCloseTimeId')
      .populate('wedCloseTimeId')
      .populate('thuCloseTimeId')
      .populate('friCloseTimeId')
      .populate('satCloseTimeId')
      .populate('sunCloseTimeId')

    var discount = await Discount.find({ restaurantId: rest._id });
    res.json({ errcode: 0, restaurant: rest, discount: discount });
  } catch (err) {
    console.log(err);
    res.json({ errcode: 1, err: err });
  }
});

app.get('/menus/restaurants/:id', async (req, res) => {
  var restaurant = await Restaurant.findOne({ _id: req.params.id })
  var menus = await Menu.find({
    restaurantId: restaurant._id,
    isActive: true
  });
  res.json({ errcode: 0, menus: menus });
})


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function loadReservationsToCacheIfNotloadedAsync() {
  if (cache.get('reservations') !== null) return cache.get('reservations');
  if (cache.get('loadingReservationsToMemory') !== null) {
    while (cache.get('loadingReservationsToMemory') !== null) await sleep(100);
    return (cache.get('reservations'))
  };

  cache.put('loadingReservationsToMemory', true);
  console.log("Loading reservations into memory")
  var reservations = await Reservation.find({
    status: 2, dateTime: { //get reservations in db since now
      $gte: moment(new Date()).toDate(),
    }
  });
  var tr = cache.put('reservations', reservations, 86400000, (key, value) => { //Reload reservations every day
    //The reservation is already deleted from cache when this callback fired.
    console.log("Reloading reservations into memory")
    loadReservationsToCacheIfNotloadedAsync();
  })
  console.log("Reservations loaded into memory")
  cache.del('loadingReservationsToMemory');
  return tr;
}

//May not be used
async function loadTablesToCacheIfNotloadedAsync() {
  if (cache.get('tables') !== null) return cache.get('tables');
  if (cache.get('loadingTablesToMemory') !== null) {
    while (cache.get('loadingTablesToMemory') !== null) await sleep(100);
    return cache.get('tables');
  };

  cache.put('loadingTablesToMemory', true);
  var tables = await Table.find({
    status: true
  });
  cache.put('tables', tables, 86400000, (key, value) => { //Reload reservations every day
    //The reservation is already deleted from cache when this callback fired.
    loadTablesToCacheIfNotloadedAsync();
  })
  cache.del('loadingTablesToMemory');
}


async function getReservationsByTableIdInMemoryAsync(id) {
  var reservations = cache.get('reservations');
  if (reservations === null) {
    reservations = await loadReservationsToCacheIfNotloadedAsync();
  }
  var tr = [];
  for (var r of reservations) {
    if (r.table.toString() === id.toString()) {
      tr.push(r);
    }
  }
  return tr;
}

async function isTableAvailableAtDateTimeInMemory(id, dateTime, eatingTime) {
  if (!eatingTime) eatingTime = 2;
  var reservations = await getReservationsByTableIdInMemoryAsync(id)
  var conflicts = [];
  for (var r of reservations) { //checking confliects
    if (r.dateTime.getTime() == dateTime.getTime()) {
      conflicts.push(r);
      console.log(dateTime + '\n')
    }

    if (r.dateTime.getTime() < dateTime.getTime()) {
      var b = moment(r.dateTime).add(eatingTime, 'h').toDate() > dateTime
      if (b) {
        conflicts.push(b);
      }
    }
    if (r.dateTime.getTime() > dateTime.getTime()) {
      var b = moment(r.dateTime).add(0 - eatingTime, 'h').toDate() < dateTime
      if (b) {
        conflicts.push(b);
      }
    }
  }
  return conflicts.length === 0;
}

async function getTablesWithRestaurantsUsingPersionAndDateTimeAsync(persons, dateTime) {
  var reservations = cache.get('reservations');
  if (reservations === null) {
    reservations = await loadReservationsToCacheIfNotloadedAsync();
  }

  var tables = await Table.find({
    status: true,
  }).populate('restaurant');

  var promises = [];


  for (var t of tables) {
    var eatingTime = t.restaurant.eatingTime ? t.restaurant.eatingTime : 2;
    promises.push(isTableAvailableAtDateTimeInMemory(t._id, dateTime, eatingTime))
  }
  var tableResults = await Promise.all(promises); //an array of boolean value


  for (var index in tables) {
    if (persons <= 2 && tables[index].size <= 2) {
    } else if (persons <= 4 && tables[index].size <= 4) {
    } else if (
      tables[index].size - persons >= 0 &&
      tables[index].size - persons < 3
    ) {
    } else {
      tableResults[index] = false;
    }
  }
  console.log(tableResults)

  //...

  // table results
  var tr = [];
  for (var index in tables) {
    if (tableResults[index]) tr.push(tables[index])
  }
  return tr;
}


function filterPriceRange(fitlers, set) {
  if (fitlers.length === 0) return set;
  var tr = new Set();
  for (var item of set) {
    for (var f of fitlers) {
      if (f.toString() === item.priceRangeId.toString()) {
        console.log('price range add')
        tr.add(item);
      }

    }
  }
  return tr;
}

function filterCuisine(fitlers, set) {
  if (fitlers.length === 0) return set;
  var tr = new Set();
  for (var item of set) {
    for (var f of fitlers) {
      console.log(item.cuisineStyleId);
      console.log(f.toString());
      if (f.toString() === item.cuisineStyleId.toString()) {
        tr.add(item);
      }

    }
  }

  return tr;
}



function filterCategory(fitlers, set) {
  if (fitlers.length === 0) return set;
  var tr = new Set();
  for (var item of set) {
    for (var f of fitlers) {
      if (f.toString() === item.categoryId.toString()) {
        tr.add(item);
      }
    }
  }
  return tr;
}

function filterRestaurantsByKeyword(keyword, restaurants) {
  if (!keyword || keyword === '' || keyword === ' ') return restaurants;
  var tr = new Set();
  for (var restaurant of restaurants) {
    if(!restaurant.restaurantDescription) restaurant.restaurantDescription = '';
    if (restaurant.resName.toLowerCase().includes(keyword) || (restaurant.restaurantDescription.toLowerCase().includes(keyword))) {
      tr.add(restaurant)
    }
  }
  return tr;
}

function filterRestaurantsByMenusUsingKeyword(keyword, menus) {
  if (!keyword || keyword === '' || keyword === ' ') return null;
  var tr = new Set();
  for (var menuItem of menus) {
    if (menuItem.menuName.toLowerCase().includes(keyword) || (menuItem.menuDescript.toLowerCase().includes(keyword))) {
      tr.add(menuItem.restaurantId);
    }
  }
  return tr;
}



function isRestaurantAvailableAtDateTime(restaurant, dateTime) {
  var times = cache.get('storeTimes');
  if (times === null) {
    console.log('No Times in memory!!')
    return false;
  }

  var weekDay = new Date(dateTime).getDay();
  var openId = '', closeId = '';
  var getTimeString = function (id) {
    if (id === '') return null;
    for (var t of times) {
      if (t._id.toString() === id.toString()) {
        return t.storeTimeName;
      }
    }
    return null;
  }
  switch (weekDay) {
    case 1:
      if (!restaurant.monIsClose) {
        openId = restaurant.monOpenTimeId;
        closeId = restaurant.monCloseTimeId;
      }
      break;
    case 2:
      if (!restaurant.tueIsClose) {
        openId = restaurant.tueOpenTimeId;
        closeId = restaurant.tueCloseTimeId;
      }
      break;
    case 3:
      if (!restaurant.wedIsClose) {
        openId = restaurant.wedOpenTimeId;
        closeId = restaurant.wedCloseTimeId;
      }
      break;
    case 4:
      if (!restaurant.thuIsClose) {
        openId = restaurant.thuOpenTimeId;
        closeId = restaurant.thuCloseTimeId;
      }
      break;
    case 5:
      if (!restaurant.friIsClose) {
        openId = restaurant.friOpenTimeId;
        closeId = restaurant.friCloseTimeId;
      }
      break;
    case 6:
      if (!restaurant.satIsClose) {
        openId = restaurant.satOpenTimeId;
        closeId = restaurant.satCloseTimeId;
      }
      break;
    case 0:
      if (!restaurant.sunIsClose) {
        openId = restaurant.sunOpenTimeId;
        closeId = restaurant.sunCloseTimeId;
      }
      break;
  }
  var openTime = getTimeString(openId)
  var closeTime = getTimeString(closeId);
  if (openTime === null || closeTime === null) return false;
  openTime = new Date(moment(new Date(dateTime)).format('YYYY-MM-DD') + ' ' + openTime)
  closeTime = new Date(moment(new Date(dateTime)).format('YYYY-MM-DD') + ' ' + closeTime)
  if (new Date(dateTime) > openTime && new Date(dateTime) < closeTime) return true
  else return false;
}


app.post('/search', async (req, res) => {
  if (new Date() > new Date(req.body.dateTime)) return res.json({ errcode: 0, restaruant: [] })
  try {
    var keyword = req.body.keyword;
    if (!keyword || keyword.length < 1 || keyword === 'null' || keyword === 'undefined') keyword = '';
    if (keyword) keyword = keyword.toLowerCase();
    console.log(keyword);
    var availableTables = await getTablesWithRestaurantsUsingPersionAndDateTimeAsync(req.body.numberOfPeople, new Date(req.body.dateTime));
    //console.log(availableTables)
    var restaurants = new Set();

    for (var t of availableTables) {
      restaurants.add(t.restaurant)
    }
    var priceRanges = req.body.filters.priceRanges;
    var cuisines = req.body.filters.cuisines;
    var categories = req.body.filters.categories;
    var tr = filterPriceRange(priceRanges, restaurants);
    tr = filterCuisine(cuisines, tr);
    tr = filterCategory(categories, tr);


    var menus = await Menu.find({ restaurantId: { $in: Array.from(tr) } });
    var menusfiltered = filterRestaurantsByMenusUsingKeyword(keyword, menus, tr) //a list of ID
    if (menusfiltered === null) { // a list of restaurants 
      menusfiltered = tr;
    } else { //a list of ID
      var t = [];
      for (var id of menusfiltered) {
        tr.forEach(v => {
          console.log(v);
          if (id.toString() === v._id.toString()) {
            t.push(v);
          }
        })
      }
      menusfiltered = new Set(t);
    }

    tr = filterRestaurantsByKeyword(keyword, tr);

    //get unionSet of menus filtered restaurant by keywords and menu keywords
    //menusfiltered is a list of restaurant ID

    //console.log(tr);
    //console.log(menusfiltered);

    tr = new Set([...tr, ...menusfiltered]);
    tr.forEach((v1, v2, set) => {
      if (!isRestaurantAvailableAtDateTime(v1, req.body.dateTime)) set.delete(v1)
      if (v1.status !== 1) set.delete(v1);
    })


    res.json({ errcode: 0, restaurants: Array.from(tr) });
  } catch (err) {
    console.log(err);
    res.json({ errcode: 1, errmsg: err })
  }





  // Restaurant.find()
  // .populate('addressId').populate('categoryId').populate('cuisineStyleId').populate('priceRangeId')
  // .then((results)=>{
  //   res.json({errcode: 0, restaurants: results})
  // }).catch(err=>{
  //   console.log(err);
  //   res.json({errcode: 1, errmsg: err})
  // })
})
// router.route('/search').post((req,res)=>{
//   var numOfPeople = req.body.numOfPeople;
//   var dateTime = req.body.dateTime;

// })

//test funciton 
async function t() {
  console.log("updating db")
  var ts = await Table.find()
  var p = [];
  for (var t of ts) {
    t.isDeleted = false
    p.push(t.save())
  }
  Promise.all(p).then(() => {
    console.log('updated')
  }).catch(err => console.log(err))
}

app.post('/validateResetPasswrodTimestamp', async (req, res) => {
  var id = req.body.accountId;
  var timestamp = req.body.timestamp;
  await sleep(1000);
  Account.findById(id).then((acc) => {
    if (acc.resetTimeStamp !== 0 && acc.resetTimeStamp.toString() === timestamp.toString()) {
      if (acc.resetTimeStamp === 0) return res.json({ errcode: 3, errmsg: 'This link is not avaiable anymore' })
      if (new Date.getTime() - acc.resetTimeStamp > 86400000) return res.json({ errcode: 4, errmsg: 'This link has expired' })
      return res.json({ errcode: 0, errmsg: 'success' })
    } else {
      return res.json({ errcode: 2, errmsg: 'incorrect timestamp' })
    }
  }).catch(err => {
    console.log(err)
    return res.json({ errcode: 1, errmsg: 'something wrong' })
  })
})

app.post('/resetPasswordWithTimestamp', async (req, res) => {
  var id = req.body.accountId;
  var timestamp = req.body.timestamp;
  var newPassword = req.body.newPassword;
  await sleep(2000); //avoid hacking, reply the client with a 2s delay 
  Account.findById(id).then((acc) => {
    if (acc.resetTimeStamp !== 0 && acc.resetTimeStamp.toString() === timestamp.toString()) {
      acc.password = newPassword;
      acc.resetTimeStamp = 0;
      acc.token = '';
      acc.save().then(() => {
        return res.json({ errcode: 0, errmsg: 'success' })
      }).catch(err => {
        console.log(err)
        return res.json({ errcode: 1, errmsg: 'something wrong' })
      })
    } else {
      return res.json({ errcode: 2, errmsg: 'incorrect timestamp' })
    }
  }).catch(err => {
    console.log(err)
    return res.json({ errcode: 1, errmsg: 'something wrong' })
  })
})


app.post('/requestResetPasswordEmail', (req, res) => {
  var email = req.body.email;
  console.log(email);
  var timestamp = new Date().getTime();
  Account.findOne({ email: email, isActive: true }).then(acc => {
    if (acc !== null) {
      acc.resetTimeStamp = timestamp;
      acc.save().then(acc => {
        var htmlMessage = '<h1>Use the link below to reset your password</h1>'
          + '<p>' + frontEndUrl + '/resetpassword/' + acc._id + '/' + timestamp + '</p>'
        var mailOptions = {
          from: 'a745874355@gmail.com',
          to: acc.email,
          subject: 'Reset password',
          html: htmlMessage
        };
        sendEmail(mailOptions, (error, info) => {
          if (error) res.json({ errcode: 4, errmsg: 'failed to send email' })
          else res.json({ errcode: 0, errmsg: 'email sent' })
        })
      }).catch(err => {
        return res.json({ errcode: 3, errmsg: 'error on setting timestamp' })
      })
    } else {
      return res.json({ errcode: 2, errmsg: 'account not found' })
    }
  }).catch((err) => {
    console.log(err)
    return res.json({ errcode: 1, errmsg: 'account error' })
  })
})

async function getRandomRestaurant(num) {
  if (!num) num = 5
  var restaurants = await Restaurant.find({ status: 1 });
  if (!restaurants || restaurants.length === 0) return [];
  var tr = new Set();
  for (var i = 0; i < num; i++) {
    tr.add(restaurants[Math.floor(Math.random() * restaurants.length)])
  }
  tr = Array.from(tr);
  return tr;
}

app.get('/daily', async (req, res) => {
  var restaurants = await getRandomRestaurant();
  return res.json({ errcode: 0, restaruants: restaurants })
})

app.get('/featured', async (req, res) => {
  var restaurants = await getRandomRestaurant();
  return res.json({ errcode: 0, restaruants: restaurants })
})

app.get('/favorite', async (req, res) => {
  var restaurants = await getRandomRestaurant();
  return res.json({ errcode: 0, restaruants: restaurants })
})


async function initRemindEmailTimers() {
  console.log('Reload Reminds for reservations')
  var timers = cache.get('emailConfirmationTimers')
  if (timers === null) {
    timers = cache.put('emailConfirmationTimers', new Set());
  }
  var reservations = await Reservation.find({ status: 2 }).populate('customer').populate("restaurant");
  for (var popedRevs of reservations) {
    var emailaddress;
    try {
      emailaddress = (await Account.findById(popedRevs.customer.account)).email;
    } catch (err) {
      console.log(err)
      continue;
    }

    if (!emailaddress || emailaddress === null) {
      console.log('email address is null in restaurant reserve')
      continue;
    }
    var htmlMessageConfirm = '<h1>Thans for using BookEat. Your reservation is coming soon</h1>' +
      '<p>Restaurant name: ' + popedRevs.restaurant.resName + '</p>' +
      '<p>Restaurant phone number: ' + popedRevs.restaurant.phoneNumber + '</p>' +
      '<p>Date Time: ' + moment(new Date(popedRevs.dateTime)).format('YYYY-MM-DD HH:mm') + '</p>';
    var mailOptionsConfirm = {
      from: 'a745874355@gmail.com',
      to: emailaddress,
      subject: 'Your reservation comes soon',
      html: htmlMessageConfirm
    };
    if (moment(new Date(popedRevs.dateTime)).diff(moment(new Date()), 'minutes') <= 30) {
      console.log('reservation ' + popedRevs._id + ' Reminder Sent')
      transporter.sendMail(mailOptionsConfirm, (error, info) => {
        if (error) console.log(error)
      })
      if (moment(new Date(popedRevs.dateTime)).diff(moment(new Date()), 'minutes') <= 0) {
        popedRevs.status = 0;
        popedRevs.save();
      }
    } else {
      var timevalue = moment(new Date(popedRevs.dateTime)).diff(moment(new Date()), 'milliseconds') - 1800000;
      var timers = cache.get('emailConfirmationTimers');
      if (timers === null) {
        timers = cache.put('emailConfirmationTimers', new Set());
      }
      var timerObject = {
        reservationId: popedRevs._id, timer: setTimeout(() => {
          console.log('Reminder Email sent')
          transporter.sendMail(mailOptionsConfirm, (error, info) => {
            if (error) console.log(error)
            timers.delete(timerObject);
          })
        }, timevalue)
      }
      timers.add(timerObject);
      console.log('reservation ' + popedRevs._id + ' Reminder schedule in(ms) ' + timevalue)
    }
  }
}


app.listen(port, () => {
  initRemindEmailTimers();
  //t();
  connection.once("open", async () => {
    cache.put('storeTimes', await StoreTime.find())
    //init stream
    gfs = Grid(connection.db, mongoose.mongo);
    gfs.collection('uploads');
    console.log("MongoDB database connection established successfully");
    await loadReservationsToCacheIfNotloadedAsync();
    console.log(cache.get('reservations'))
    console.log(`Server is running on port: ${port}`);
  });
});