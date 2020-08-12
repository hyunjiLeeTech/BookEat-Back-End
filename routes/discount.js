const router = require("express").Router();
let Discount = require("../models/discount.model");
let RestaurantOwner = require("../models/restaurantOwner.model");
let Restaurant = require("../models/restaurnat.model");

router.route("/getdiscounts").get(async (req, res) => {
    try {
        var restaurant = await findRestaurantByIdAsync(req.user._id);

        var discounts = await Discount.find({
            restaurantId: restaurant._id,
            isDeleted: false
        });
        res.json({ errcode: 0, discounts: discounts });
    } catch (err) {
        res.json({ errcode: 1, errmsg: "internal error" });
    };
})

router.route("/adddiscount").post(async (req, res) => {
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
    var percent = req.body.percent;
    var description = req.body.description;
    var isActive = req.body.isActive;

    Discount.findById(req.body._id).then((discount) => {
        discount.percent = percent;
        discount.description = description;
        discount.isActive = isActive;
        discount.save().then(saved => {
            res.json({ errcode: 0, errmsg: 'success edit discount', saved: saved })
        }).catch(err => {
            console.error(err)
            res.json({ errcode: 2, errmsg: 'failed to save' })
        })
    }).catch(err => {
        res.json({ errcode: 1, errmsg: 'failed to save' })
    })
})

router.post("/deletediscount", (req, res) => {
    Discount.findById(req.body._id).then((discount) => {
        discount.isDeleted = true;
        discount.save();
        res.json({ errcode: 0, errmsg: 'success delete discount' });
    }).catch(err => {
        res.json({ errcode: 1, errmsg: err });
    })
})

async function findRestaurantByIdAsync(id) {
    restaurantOwner = await RestaurantOwner.findOne({ account: id })

    return await Restaurant.findOne({ restaurantOwnerId: restaurantOwner._id });
}

async function addDiscountAsync(obj) {
    const accountId = obj.accountId;
    const percent = obj.percent;
    const description = obj.descript;
    const isActive = true;

    let message = "";

    if (percent > 100 || percent < 0) {
        message = "Discount range: 0-100";
        throw message;
    }

    let restaurant = await findRestaurantByIdAsync(accountId);

    const newDiscount = new Discount({
        percent,
        description,
        isActive,
        restaurantId: restaurant._id
    })

    return await newDiscount.save();
}

module.exports = router;