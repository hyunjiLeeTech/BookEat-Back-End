const router = require("express").Router();
let Review = require("../models/review.model");
let Customer = require("../models/customer.model");
let Restaurant = require("../models/restaurnat.model");

router.route("/").get(async (req, res) => {
    console.log("this is test");
})

router.route("/getreviewscustomerside").get(async (req, res) => {
    console.log("Accessing /review/getreviewscustomerside");
    console.log(req.body);
})

router.route("/getreviewsrestaurantside").get(async (req, res) => {
    console.log("Accessing /review/getreviewsrestaurantside");
    console.log(req.body);
})

router.route("/addreview").post(async (req, res) => {
    console.log("Accessing /review/addreview");
    console.log(req.body);
})

router.route("/editreview").post(async (req, res) => {
    console.log("Accessing /review/editreview");
    console.log(req.body);
})

router.route("/deletereview").post(async (req, res) => {
    console.log("Accessing /review/deletereview");
    console.log(req.body);
})

module.exports = router;