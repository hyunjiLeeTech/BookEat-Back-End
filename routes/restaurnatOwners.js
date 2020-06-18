const router = require("express").Router();
const RestaurantOwner = require("../models/restaurantOwner.model");
const Account = require("../models/account.model");
const Address = require("../models/address.model");
const Restaurant = require("../models/restaurnat.model");

router.route("/").get((req, res) => {
  RestaurantOwner.find()
    .populate("account")
    .populate("address")
    .populate("restaurant")
    .then((restaurantOwners) => res.json(restaurantOwners))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/add").post((req, res) => {
  const resname = req.body.resname;
  const businessnumber = req.body.businessnumber;
  const streetNumber = req.body.streetNumber;
  const streetName = req.body.streetName;
  const city = req.body.city;
  const province = req.body.province;
  const password = req.body.password;
  const email = req.body.email;

  const newAccount = new Account({
    email,
    password,
    userTypeId,
  });

  const newAddress = new Address({
    streetNumber,
    streetName,
    city,
    province,
  });

  newAccount.save().then((account) => {
    const accountId = account._id.toString();
    let addressId;
    let restaurantOwnerId;

    newAddress.save().then((address) => {
      addressId = address._id.toString();
    });

    const newRestaurnatOwner = new RestaurantOwner({
      accountId,
    });

    //one to one relationship
    const newRestaurant = new Restaurant({
      resname,
      businessnumber,
      addressId,
    });

    newRestaurant.save().then((restaurant) => {
      restaurnatId = restaurnat._id.toString();
    });
  });

  const newRestaurantOwner = new RestaurnatOwner({
    firstName,
  });
});

module.exports = router;
