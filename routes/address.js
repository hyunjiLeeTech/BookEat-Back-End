const router = require("express").Router();
let Address = require("../models/address.model");

router.route("/").get((req, res) => {
  Address.find()
    .then((account) => res.json(account))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/add").post((req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userTypeId = req.body.userTypeId;

  const newAccount = new Address({
    email,
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
  Address.findByIdAndDelete(req.params.id)
    .then(() => res.json("account deleted"))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/update/:id").post((req, res) => {
  Address.findById(req.params.id)
    .then((account) => {
      account.userTypeId = req.body.userTypeId;
      account.email = req.body.email;
      account.password = req.body.password;

      account
        .save()
        .then(() => res.json("account updated"))
        .catch((err) => res.status(400).json("Error: " + err));
    })
    .catch((err) => res.status(400).json("error: " + err));
});

module.exports = router;
