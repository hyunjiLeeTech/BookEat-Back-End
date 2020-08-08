const router = require("express").Router();
let Account = require("../models/account.model");
let Restaurant = require("../models/restaurnat.model");
let Manager = require("../models/manager.model");

router.route("/getmanagerinfo").get((req, res) => {
  var _id = req.user._id;

  Manager.findOne({ accountId: _id })
    .populate("accountId")
    .then((result) => {
      res.json(result);
    });
});

router.route("/editmanagerprofile").post((req, res) => {
  var _id = req.user._id;

  var obj = {
    accountId: _id,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phoneNumber: req.body.phonenumber,
  };

  editManagerProfile(obj)
    .then(() => {
      res.json({ errcode: 0, errmsg: "success" });
    })
    .catch((err) => {
      res.json({ errcode: 1, errmsg: err });
    });
});

let editManagerProfile = async (obj) => {
  let firstname = obj.firstName;
  let lastname = obj.lastName;
  let phonenumber = obj.phoneNumber;

  //validation
  const regExpPhone = RegExp(
    /^\(?([0-9]{3})\)?[-.●]?([0-9]{3})[-.●]?([0-9]{4})$/
  );

  let message = "";
  if (!regExpPhone.test(phonenumber)) {
    message = "Incorrect phone number";
    throw message;
  }

  if (firstname.length < 1) {
    message = "Firstname is required";
    throw message;
  }

  if (lastname.length < 1) {
    message = "Lastname is required";
    throw message;
  }

  await Manager.findOne({ accountId: obj.accountId })
    .then((manager) => {
      manager.firstname = firstname;
      manager.lastname = lastname;
      manager.phonenumber = phonenumber;

      manager.save();
    })
    .catch((err) => {
      message = err;
      throw message;
    });
};

router.route("/").get((req, res) => {
  Manager.find()
    .then((manager) => res.json(manager))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/add").post((req, res) => {
  //account info
  const email = req.body.email;
  const password = req.body.password;

  //manager info
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const phonenumber = req.body.phonenumber;

  obj = {
    email,
    password,
    firstname,
    lastname,
    phonenumber,
  };

  addManagerAsync(obj)
    .then(() => {
      res.json({ errorcode: 0, errmsg: "success" });
    })
    .catch((err) => {
      res.json({ errcode: 1, errmsg: err });
    });
});

let addManagerAsync = async function (obj) {
  //account info
  const email = obj.email;
  const password = obj.password;
  const userTypeId = 3; // manager user type: 3

  //manager info
  const firstname = obj.firstname;
  const lastname = obj.lastname;
  const phonenumber = obj.phonenumber;

  const newAccount = new Account({
    email,
    password,
    userTypeId,
  });

  let account = await newAccount.save();
  const newManager = new Manager({
    firstname,
    lastname,
    phonenumber,
    accountId: account._id,
  });

  return await newManager.save();
};

module.exports = router;
