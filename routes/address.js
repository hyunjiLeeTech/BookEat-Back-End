const router = require("express").Router();
let Address = require("../models/address.model");

router.route("/").get((req, res) => {
  Address.find()
    .then((account) => res.json(account))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/add").post((req, res) => {
  const city = req.body.city;
  const streetNumber = req.body.streetNumber;
  const streetName = req.body.streetName;
  const postalCode = req.body.postalCode;
  const province = req.body.province;

  const newAddress = new Address({
    city,
    streetNumber,
    streetName,
    postalCode,
    province,
  });

  newAddress
    .save()
    .then(() => {
      res.json("Address Added");
    })
    .catch((err) => res.status(400).json("Error: " + err));
});

module.exports = router;
