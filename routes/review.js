const router = require("express").Router();
let Review = require("../models/review.model");
let Customer = require("../models/customer.model");
let Restaurant = require("../models/restaurnat.model");
let RestaurantOwner = require("../models/restaurantOwner.model");
let Manager = require("../models/manager.model");

router.route("/").get(async (req, res) => {
    console.log("this is test");
})

router.route("/getreviewscustomerside").get(async (req, res) => {
    var userType = req.user.userTypeId;

    if (userType == 1) {
        var accountId = req.user._id;
        var customerId = await findCustomerByAccount(accountId);

        var reviews = await Review.find({
            customerId: customerId,
            isActive: true
        }).sort({ "updatedAt": -1 })
            .populate("restaurantId");
        res.json({ errcode: 0, reviews: reviews });
    } else {
        res.json({ errcode: 1, errmsg: "This is customer page" });
    }
})

router.route("/getreviewsrestaurantside").get(async (req, res) => {
    var restaurantId = req.query[0];

    try {
        var reviews = await Review.find({
            restaurantId: restaurantId,
            isActive: true
        })
            .sort({ "updatedAt": -1 })
            .populate("customerId");
        res.json({ errcode: 0, reviews: reviews });

    } catch (err) {
        res.json({ errcode: 1, errmsg: "internal error" });
    }
})

router.route("/getreviewsresownermanager").get(async (req, res) => {
    var userType = req.user.userTypeId;
    var accountId = req.user._id;

    try {
        var restaurant;
        if (userType == 2) { // restaurant owner
            restaurant = await findRestaurantByIdAsync(accountId);
        } else if (userType == 3) { // manager
            restaurant = await findRestaurantByManagerIdAsync(accountId);
        }

        var reviews = await Review.find({
            restaurantId: restaurant._id,
            isActive: true
        })
            .sort({ "updatedAt": -1 })
            .populate("customerId");
        res.json({ errcode: 0, reviews: reviews });
    } catch (err) {
        res.json({ errcode: 1, errmsg: "internal error" });
    }
})

router.route("/addreview").post(async (req, res) => {
    var userType = req.user.userTypeId;

    if (userType == 1) { // customer
        var accountId = req.user._id;
        var customerId = await findCustomerByAccount(accountId);

        var comment = req.body.comment;
        var food = req.body.food;
        var service = req.body.service;
        var environment = req.body.enviroment;
        var satisfaction = req.body.satisfaction;
        var restaurantId = req.body.resId;
        var isPicture = req.body.isPicture;
        var isActive = true;

        // picture
        let pictures = "";

        if (isPicture) {
            pictures = req.body.reviewPictures;
        }

        var newReview = new Review({
            comment,
            food,
            service,
            environment,
            satisfaction,
            pictures,
            isActive,
            isPicture,
            restaurantId,
            customerId
        })

        newReview.save()
            .then(() => {
                res.json({ errcode: 0, errmsg: "add review success" });
            })
            .catch((err) => {
                res.json({ errcode: 1, errmsg: err });
            })
    } else { // restaurant owner, manager
        res.json({ errcode: 2, errmsg: "Only customer can add review" });
    }

})

router.route("/editreview").post(async (req, res) => {
    var comment = req.body.comment;
    var food = req.body.foodRate;
    var service = req.body.serviceRate;
    var environment = req.body.environmentRate;
    var satisfaction = req.body.satisfactionRate;

    Review.findById(req.body._id).then((review) => {
        review.comment = comment;
        review.food = food;
        review.service = service;
        review.environment = environment;
        review.satisfaction = satisfaction;
        review.save();
        res.json({ errcode: 0, errmsg: 'success edit review' })
    }).catch(err => {
        res.json({ errcode: 1, errmsg: err })
    })
})

router.route("/deletereview").post(async (req, res) => {
    var reviewId = req.body._id;

    Review.findById(reviewId).then((review) => {
        review.isActive = false;
        review.save();
        res.json({ errcode: 0, errmsg: 'success delete review' })
    }).catch(err => {
        console.log(err)
        res.json({ errcode: 1, errmsg: err })
    })
})

let findCustomerByAccount = async function (actId) {
    return await Customer.findOne({ account: actId });
}

async function findRestaurantByIdAsync(id) {
    restaurantOwner = await RestaurantOwner.findOne({ account: id })

    return await Restaurant.findOne({ restaurantOwnerId: restaurantOwner._id });
}

async function findRestaurantByManagerIdAsync(id) {
    manager = await Manager.findOne({ accountId: id });

    return await Restaurant.findById(manager.restaurantId);
}

module.exports = router;