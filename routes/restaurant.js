const router = require("express").Router();
const Restaurant = require("../models/restaurnat.model");
const RestaurantOwner = require("../models/restaurantOwner.model");
const Address = require("../models/address.model");

router.route("/").get((req, res) => {
  Restaurant.find()
    .populate("address")
    .populate("restaurantOwner")
    .then((restaurant) => res.json(restaurant))
    .catch((err) => res.status(400).json("Error: " + err));
});



module.exports = router;
