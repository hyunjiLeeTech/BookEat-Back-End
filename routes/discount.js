const router = require("express").Router();
let Discount = require("../models/discount.model");
let RestaurantOwner = require("../models/restaurantOwner.model");
let Restaurant = require("../models/restaurnat.model");

router.route("/getdiscounts").get(async (req, res) => {
    console.log("Accessing discount/getdiscounts");
    try {
        var restaurant = await findRestaurantByIdAsync(req.user._id);

        var discounts = await Discount.find({
            restaurantId: restaurant._id,
            isActive: true
        });
        res.json({ errcode: 0, discounts: discounts });
    } catch (err) {
        res.json({ errcode: 1, errmsg: "internal error" });
    };
})

router.route("/adddiscount").post(async (req, res) => {
    console.log("Accessing discount/adddiscount");

    var obj = {
        accountId: req.user._id,
        percent: req.body.percent,
        descript: req.body.descript,
    }

    addDiscountAsync(obj).then(() => {
        res.json({ errcode: 0, errmsg: "success" })
    }).catch((err) => {
        res.json({ errcode: 1, errmsg: err })
    })
})

router.route("/editdiscount").post(async (req, res) => {
    console.log("Accessing discount/editdiscounts");
    Discount.findById(req.body._id).then((discount) => {
        discount.percent = req.body.percent;
        discount.descript = req.body.descript;
        discount.save();
    })
})

router.route("/deletediscount").post(async (req, res) => {
    console.log("Accessing discount/deletediscounts");
    Discount.findById(req.body._id).then((discount) => {
        discount.isActive = false;
        discount.save();
    })
})

async function findRestaurantByIdAsync(id) {
    restaurantOwner = await RestaurantOwner.findOne({ account: id })

    return await Restaurant.findOne({ restaurantOwnerId: restaurantOwner._id });
}

async function addDiscountAsync(obj) {
    const accountId = obj.accountId;
    const percent = obj.percent;
    const descript = obj.descript;
    const isActive = true;

    let message = "";

    if (percent > 100 || percent < 0) {
        message = "Discount range: 0-100";
        throw message;
    }

    let restaurant = await findRestaurantByIdAsync(accountId);

    const newDiscount = new Discount({
        percent,
        descript,
        isActive,
        restaurantId: restaurant._id
    })

    return await newDiscount.save();
}

module.exports = router;