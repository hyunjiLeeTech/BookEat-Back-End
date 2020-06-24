const router = require("express").Router();
let Customer = require("../models/customer.model");
let Account = require("../models/account.model");

router.route("/").get((req, res) => {
  Account.find()
    .then((account) => res.json(account))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/add").post((req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userTypeId = req.body.userTypeId;

  const newAccount = new Account({
    _id: email,
    password,
    userTypeId,
  });

  newAccount
    .save()
    .then(() => {
      res.json("Account Added");
    })
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/:id").get((req, res) => {
  Account.findById(req.params.id)
    .then((account) => res.json(account))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/:id").delete((req, res) => {
  Account.findByIdAndDelete(req.params.id)
    .then(() => res.json("account deleted"))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/update/:id").post((req, res) => {
  Account.findById(req.params.id)
    .then((account) => {
      account.userTypeId = req.body.userTypeId;
      account.password = req.body.password;

      account
        .save()
        .then(() => res.json("account updated"))
        .catch((err) => res.status(400).json("Error: " + err));
    })
    .catch((err) => res.status(400).json("error: " + err));
});

module.exports = router;
