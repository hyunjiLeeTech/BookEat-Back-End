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
    var userType = req.user.userTypeId;

    if (userType == 1) {
        var accountId = req.user._id;
        var customerId = await findCustomerByAccount(accountId);

        var reviews = await Review.find({
            customerId: customerId,
            isActive: true
        }).sort({ "updatedAt": -1 });
        res.json({ errcode: 0, reviews: reviews });
    } else {
        res.json({ errcode: 1, errmsg: "This is customer page" });
    }
})

router.route("/getreviewsrestaurantside").get(async (req, res) => {
    console.log("Accessing /review/getreviewsrestaurantside");
    var restaurantId = req.query[0];

    try {
        var reviews = await Review.find({
            restaurantId: restaurantId,
            isActive: true
        })
            .sort({ "updatedAt": -1 })
            .populate("customerId");
        console.log(reviews);
        res.json({ errcode: 0, reviews: reviews });

    } catch (err) {
        res.json({ errcode: 1, errmsg: "internal error" });
    }
})

router.route("/addreview").post(async (req, res) => {
    console.log("Accessing /review/addreview");
    console.log(req.body);

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
        var isActive = true;

        var newReview = new Review({
            comment,
            food,
            service,
            environment,
            satisfaction,
            isActive,
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
    console.log("Accessing /review/editreview");
    console.log(req.body);

    var comment = req.body.comment;
    var food = req.body.food;
    var service = req.body.service;
    var environment = req.body.enviroment;
    var satisfaction = req.body.satisfaction;

    Review.findById(req.body._id).then((review) => {
        review.comment = comment;
        review.food = food;
        review.service = service;
        review.environment = environment;
        review.satisfaction = satisfaction;
        review.save();
    })
})

router.route("/deletereview").post(async (req, res) => {
    console.log("Accessing /review/deletereview");
    console.log(req.body);
    var reviewId = req.body._id;

    Review.findById(reviewId).then((review) => {
        review.isActive = false;
        review.save();
    })
})

let findCustomerByAccount = async function (actId) {
    return await Customer.findOne({ account: actId });
}

module.exports = router;