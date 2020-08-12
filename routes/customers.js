const router = require("express").Router();
let Customer = require("../models/customer.model");
let Account = require("../models/account.model");
const Reservation = require("../models/reservation.model");
const moment = require('moment')
const cache = require('memory-cache');
const { json } = require("express");
const Restaurant = require("../models/restaurnat.model");
const nodemailer = require('nodemailer');
const Table = require("../models/table.model");
const FoodOrder = require("../models/foodOrder.model");
const Menu = require("../models/menu.model");
const frontEndUrl = 'https://bookeatfront.herokuapp.com' 
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'a745874355@gmail.com',
    pass: 'Aa7758521.'
  }
});

function isRestaurantAvailableAtDateTime(restaurant, dateTime) {
  var times = cache.get('storeTimes');
  if (times === null){
    console.log('No Times in memory!!')
    return false;
  }
    
  var weekDay = new Date(dateTime).getDay();
  var openId = '', closeId = '';
  var getTimeString = function(id){
    if(id === '') return null;
    for(var t of times){
      if(t._id.toString() === id.toString()){
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
  if(openTime === null || closeTime === null) return false;
  openTime = new Date(moment(new Date(dateTime)).format('YYYY-MM-DD') + ' ' +openTime)
  closeTime = new Date(moment(new Date(dateTime)).format('YYYY-MM-DD') + ' '+ closeTime)
  if(new Date(dateTime) > openTime && new Date(dateTime) < closeTime) return true
  else return false;
}


let findAccountByEmailAsyc = async function (email) {
  return await Account.find({ email: email });
};

let findCustomerByPhoneNumberAsync = async function (phonenumber) {
  return await Customer.find({ phoneNumber: phonenumber });
};

let findCustomerByAccount = async function (acc) {
  return await Customer.findOne({ account: acc })
}

async function updateInMemoryReservationsAysnc(id, reservation) {
  var reservations = cache.get('reservations')
  if (reservations === null) return;
  if (id === null) reservations.push(reservation);
  console.log("Updating reservations in memory cache of" + id)
  for (var index in reservations) {
    if (reservations[index]._id.toString() === id.toString()) {
      reservations[index] = reservation;
      return;
    }
  }
}

let addCustomerAsync = async function (obj) {
  const regExpEmail = RegExp(/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/);

  const regExpPhone = RegExp(
    /^\(?([0-9]{3})\)?[-.●]?([0-9]{3})[-.●]?([0-9]{4})$/
  );

  const firstName = obj.firstName;
  const lastName = obj.lastName;
  const email = obj.email;
  const phoneNumber = obj.phoneNumber;
  const password = obj.password;
  const userTypeId = obj.userTypeId;

  const newAccount = new Account({
    email,
    password,
    userTypeId,
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

async function getAccountByIdAsync(id) {
  return await Account.findOne({ _id: id });
}

async function getReservationByIdWithCustomerAsync(id) {
  return await Reservation.findOne({ _id: id }).populate('customer');
}
let editCustomerAsync = async function (obj) {
  const firstName = obj.firstName;
  const lastName = obj.lastName;
  const phoneNumber = obj.phoneNumber;

  const regExpPhone = RegExp(
    /^\(?([0-9]{3})\)?[-.●]?([0-9]{3})[-.●]?([0-9]{4})$/
  );

  let message = "";

  if (firstName.length < 1) {
    message = "First name should have at least one char";
    throw message;
  }

  if (lastName.length < 1) {
    message = "First name should have at least one char";
    throw message;
  }

  if (!regExpPhone.test(phoneNumber)) {
    message = "Incorrect phone number";
    throw message;
  }

  return await Customer.findOne({ account: obj.accountId }).then((customer) => {
    customer.firstName = firstName;
    customer.lastName = lastName;
    customer.phoneNumber = phoneNumber;
    customer.save();
  });
};

router.post('/updatereservation', async (req, res) => {
  var reservationId = req.body.reservationId;
  var reservation = await Reservation.findById(reservationId).populate('customer').populate('restaurant');
  if(!isRestaurantAvailableAtDateTime(reservation.restaurant, req.body.dateTime)) return res.json({ errcode: 6, errmsg: "Restaurant is not open at the time you selected" })
  if (reservation.customer.account.toString() !== req.user._id.toString()) return res.status(401).send('permisson denied')
  if (new Date() > new Date(req.body.dateTime)) return res.json({ errcode: 5, errmsg: "reserve history date is not allowed" })
  if (reservation) {
    reservation.numOfPeople = req.body.numOfPeople;
    reservation.dateTime = req.body.dateTime;
    reservation.comments = req.body.comments;
    var table = await Table.findById(req.body.tableId);
    console.log(req.body.tableId);
    if (table === null) return res.json({ errcode: 2, errmsg: 'table not found' })
    reservation.table = table;
    if (!reservation.FoodOrder) {
      var menuItems = await Menu.find({ _id: { $in: req.body.menuItems } });
      var fo = null;
      if (menuItems.length > 0) {
        fo = await new FoodOrder({
          menuItems: menuItems,
        }).save()
      }
      reservation.FoodOrder = fo;
      var revs = await reservation.save();
      var popedRevs = await revs.populate("customer").populate("restaurant").execPopulate();

      updateInMemoryReservationsAysnc(revs._id, revs)
      var timers = cache.get('emailConfirmationTimers');
      timers.forEach(function (v, v2, set) {
        console.log(v.reservationId.toString())
        console.log(v.revs._id.toString())
        if (v.reservationId.toString() === revs._id.toString()) {
          clearTimeout(v.timer);
          set.delete(v);
          console.log('reminder email cancelled')
        }
      })

      var popedRevs = await revs.populate("customer").populate("restaurant").execPopulate();
      var htmlMessage = '<h1>Reservation Update</h1>' +
        '<h3>Here is your updated booking information:</h3>' +
        '<p>Customer name: ' + popedRevs.customer.firstName + ' ' + popedRevs.customer.lastName + '</p>' +
        '<p>Customer phone number: ' + popedRevs.customer.phoneNumber + '</p>' +
        '<p>Restaurant name: ' + popedRevs.restaurant.resName + '</p>' +
        '<p>Restaurant phone number: ' + popedRevs.restaurant.phoneNumber + '</p>' +
        '<p>Date Time: ' + moment(new Date(popedRevs.dateTime)).format('YYYY-MM-DD HH:mm') + '</p>' +
        '<p>We will send you a reminder before your reservation time. Thanks</p>';
      var emailaddress = (await Account.findById(popedRevs.customer.account)).email;
      if (!emailaddress || emailaddress === null) console.log('email address is null in restaurant reserve')
      if (emailaddress !== null) {
        var mailOptions = {
          from: 'a745874355@gmail.com',
          to: emailaddress,
          subject: 'Booking Update',
          html: htmlMessage
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) console.log(err);
        })
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
        if (moment(new Date(popedRevs.dateTime)).diff(moment(new Date()), 'minutes') <= 120) {
          transporter.sendMail(mailOptionsConfirm, (error, info) => {
            if (error) console.log(error)
          })
        } else {
          var timevalue = moment(new Date(popedRevs.dateTime)).diff(moment(new Date()), 'milliseconds') - 7200000;
          var timers = cache.get('emailConfirmationTimers');
          if (timers === null) {
            timers = cache.put('emailConfirmationTimers', new Set());
          }
          console.log('Reservation added, reminder remail will be send in(ms) ' + timevalue)
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
        }
      }





      return res.json({ errcode: 0, reservation: popedRevs })
    } else {
      console.log('modify food order')
      console.log(req.body.menuItems)
      var fo = await FoodOrder.findById(reservation.FoodOrder)
      var menuItems = await Menu.find({ _id: { $in: req.body.menuItems } });
      if (menuItems.length > 0) {
        fo.menuItems = menuItems;
        await fo.save();
      } else {
        reservation.FoodOrder = null;
      }
      var revs = await reservation.save();
      var popedRevs = await revs.populate("customer").populate("restaurant").execPopulate();


      updateInMemoryReservationsAysnc(revs._id, revs)
      var timers = cache.get('emailConfirmationTimers');
      timers.forEach(function (v, v2, set) {
        if (v.reservationId === revs._id) {
          clearTimeout(v.timer);
          set.delete(v);
          console.log('reminder email cancelled')
        }
      })

      var popedRevs = await revs.populate("customer").populate("restaurant").execPopulate();
      var htmlMessage = '<h1>Reservation Update</h1>' +
        '<h3>Here is your updated booking information:</h3>' +
        '<p>Customer name: ' + popedRevs.customer.firstName + ' ' + popedRevs.customer.lastName + '</p>' +
        '<p>Customer phone number: ' + popedRevs.customer.phoneNumber + '</p>' +
        '<p>Restaurant name: ' + popedRevs.restaurant.resName + '</p>' +
        '<p>Restaurant phone number: ' + popedRevs.restaurant.phoneNumber + '</p>' +
        '<p>Date Time: ' + moment(new Date(popedRevs.dateTime)).format('YYYY-MM-DD HH:mm') + '</p>' +
        '<p>We will send you a reminder before your reservation time. Thanks</p>';
      var emailaddress = (await Account.findById(popedRevs.customer.account)).email;
      if (!emailaddress || emailaddress === null) console.log('email address is null in restaurant reserve')
      if (emailaddress !== null) {
        var mailOptions = {
          from: 'a745874355@gmail.com',
          to: emailaddress,
          subject: 'Booking Update',
          html: htmlMessage
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) console.log(err);
        })
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
        if (moment(new Date(popedRevs.dateTime)).diff(moment(new Date()), 'minutes') <= 120) {
          transporter.sendMail(mailOptionsConfirm, (error, info) => {
            if (error) console.log(error)
          })
        } else {
          var timevalue = moment(new Date(popedRevs.dateTime)).diff(moment(new Date()), 'milliseconds') - 7200000;
          var timers = cache.get('emailConfirmationTimers');
          if (timers === null) {
            timers = cache.put('emailConfirmationTimers', new Set());
          }
          console.log('Reservation added, reminder remail will be send in(ms) ' + timevalue)
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
        }
      }










      return res.json({ errcode: 0, reservation: popedRevs })
    }
  } else {
    return res.json({ errcode: 1, errmsg: 'reservation not found' })
  }
})

router.route("/editcustomerprofile").post(async (req, res) => {
  try {
    var obj = {
      accountId: req.user._id,
      firstName: req.body.firstname,
      lastName: req.body.lastname,
      phoneNumber: req.body.phonenumber,
    };

    editCustomerAsync(obj)
      .then(() => {
        res.json({ errcode: 0, errmsg: "success" });
      })
      .catch((err) => {
        res.json({ errcode: 1, errmsg: err });
      });
  } catch (err) {
    console.log(err);
    res.status(500).send("internal error");
  }
});

router.get('/gerreservationbyid/:id', async (req, res) => {
  var id = req.params.id;
  try {
    var resv = await Reservation.findById(id);
    if (resv) return res.json({ errcode: 0, reservation: resv })
    else return res.json({ errcode: 1, errmsg: 'reservation not found' })
  } catch (err) {
    console.log(err)
    res.status(500).send('internal error')
  }

})


router.route("/cancelreservation").post(async (req, res) => {
  try {
    var reservation = await getReservationByIdWithCustomerAsync(req.body.reservationId);
    if (reservation.customer.account.toString() !== req.user._id.toString()) {
      res.status(401).send('access denied');
      return;
    }
    reservation.status = 3;
    reservation.save().then(async (revs) => {
      updateInMemoryReservationsAysnc(revs._id, revs)
      var timers = cache.get('emailConfirmationTimers');
      timers.forEach(function (v, v2, set) {
        if (v.reservationId.toString() === revs._id.toString()) {
          clearTimeout(v.timer);
          set.delete(v);
          console.log('reminder email cancelled')
        }
      })
      var rest = await Restaurant.findOne({ _id: reservation.restaurant });
      var cus = await Customer.findOne({ _id: reservation.customer }).populate('account');
      var htmlMessage = '<h1>Your Reservation has been cancelled by restaurant.</h1>' +
        '<h3>Here is your booking information:</h3>' +
        '<p>Customer name: ' + cus.firstName + ' ' + cus.lastName + '</p>' +
        '<p>Customer phone number: ' + cus.phoneNumber + '</p>' +
        '<p>Restaurant name: ' + rest.resName + '</p>' +
        '<p>Restaurant phone number: ' + rest.phoneNumber + '</p>' +
        '<p>Date Time: ' + moment(new Date(reservation.dateTime)).format('YYYY-MM-DD HH:mm') + '</p>' +
        '<p>If you have any questions or concerns, please directly contact restaurant</p>';
      var mailOptions = {
        from: 'a745874355@gmail.com',
        to: cus.account.email,
        subject: 'Booking Cancelled by Restaurant',
        html: htmlMessage
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.log(error);
      })
      res.json({ errcode: 0, errmsg: "success" })
    }).catch(err => {
      console.log(err)
      res.json({ errcode: 1, errmsg: err })
    })
  } catch (err) {
    console.log(err);
    res.status(500).send("internal error")
  }
})



router.route("/reservationsofpast60days").get(async (req, res) => {
  var u = req.user;
  //console.log(u);
  try {
    var reservations = await Reservation.find({ customer: await findCustomerByAccount(u) }).populate('restaurant');
    res.json({ errcode: 0, reservations: reservations })
  } catch (err) {
    console.error(err);
    res.json({ errcode: 1, errmsg: "internal error" })
  }
})

//
//get request (/customers)
router.route("/").get((req, res) => {
  console.log("Accessing /customers/, user:");
  console.log(req.user);
  Customer.find()
    .populate("account")
    .then((customers) => res.json(customers))
    .catch((err) => res.status(400).json("Error: " + err));
  console.log("test");
});

router.route("/getcustomerinfo").get((req, res) => {
  var _id = req.user._id;
  //query from db
  Customer.findOne({ account: _id })
    .populate("account")
    .then((result) => {
      res.json(result);
    });
});

// post request (/customers/add)
router.route("/add").post((req, res) => {
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
    .then(() => {
      res.json({ errcode: 0, errmsg: "success" });
    })
    .catch((err) => {
      res.json({ errcode: 1, errmsg: err });
    });
});

router.get('/delete', async (req, res) => {
  console.log('deleting account')
  var u = req.user;
  u = await Account.findById(u._id)
  var customer = await Customer.findOne({ account: u._id })
  var reservations = await Reservation.find({ customer: customer._id, status: 2 });
  if (reservations.length > 0) {
    return res.json({ errcode: 1, errmsg: 'Please finish all reservations before delete your account' })
  } else {
    u.isActive = false;
    u.token = '';
    await u.save();
    return res.json({ errcode: 0, errmsg: 'success' })
  }
})

router.route("/:id").get((req, res) => {
  Customer.findById(req.params.id)
    .then((customer) => res.json(customer))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/:id").delete((req, res) => {
  Customer.findByIdAndDelete(req.params.id)
    .then(() => res.json("Customer deleted"))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/update/:id").post((req, res) => {
  Customer.findById(req.params.id)
    .then((customer) => {
      customer.firstName = req.body.firstname;
      customer.lastName = req.body.lastname;
      customer.email = req.body.email;
      customer.phoneNumber = req.body.phonenumber;
      customer.password = req.body.password;
      customer.noShowCount = req.body.noShowCount;

      customer
        .save()
        .then(() => res.json("Customer updated"))
        .catch((err) => res.status(400).json("Error: " + err));
    })
    .catch((err) => res.status(400).json("error: " + err));
});

module.exports = router;
