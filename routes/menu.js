const router = require("express").Router();
let Menu = require("../models/menu.model");
let RestaurantOwner = require("../models/restaurantOwner.model");
let Restaurant = require("../models/restaurnat.model");

router.route("/addmenu").post((req, res) => {
    console.log("Accessing /menu/addmenu");
    var accountId = req.user._id;

    var menuName = req.body.menuName;
    var menuPrice = req.body.menuPrice;
    var menuDescript = req.body.menuDescript;

    var obj = {
        accountId,
        menuName,
        menuPrice,
        menuDescript
    }

    console.log("start add menu async");
    console.log(obj);

    addMenuAsync(obj).then(() => {
        res.json({ errcode: 0, errmsg: "success" })
    }).catch(err => {
        res.json({ errcode: 1, errmsg: err })
    });
})

async function getRestaurantByIdAsync(id) {
    restaurantOwner = await RestaurantOwner.findOne({ account: id })

    return await Restaurant.findOne({ restaurantOwnerId: restaurantOwner._id });
}

async function addMenuAsync(obj) {
    const accountId = obj.accountId;
    const menuName = obj.menuName;
    const menuPrice = obj.menuPrice;
    const menuDescript = obj.menuDescript;
    const isActive = true;

    let message = "";
    if (menuName.length < 1) {
        message = "Menu name is required";
        throw message;
    }

    if (menuPrice < 0) {
        message = "Price should be greater than 0";
        throw message;
    }

    restaurant = await getRestaurantByIdAsync(accountId);

    const newMenu = new Menu({
        menuName,
        menuPrice,
        menuDescript,
        isActive,
        restaurantId: restaurant._id
    })

    return await newMenu.save();
}

module.exports = router;