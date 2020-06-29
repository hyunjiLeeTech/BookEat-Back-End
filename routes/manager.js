const router = require("express").Router();
let Account = require("../models/account.model");
let Restaurant = require("../models/restaurnat.model");
let Manager = require("../models/manager.model");

router.route("/").get((req, res) => {
  console.log("Accessing /manager");
  Manager.find()
    .then((manager) => res.json(manager))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/add").post((req, res) => {
  console.log("Accessing /manager/add");

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
