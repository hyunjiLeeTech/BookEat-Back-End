const router = require("express").Router();
let Menu = require("../models/menu.model");
let RestaurantOwner = require("../models/restaurantOwner.model");
let Restaurant = require("../models/restaurnat.model");

router.route("/getmenus").get(async (req, res) => {
    console.log("Accessing /menu/getmenus");
    var actId = req.user._id;

    try {
        var restaurant = await findRestaurantByIdAsync(actId);

        var menus = await Menu.find({
            restaurantId: restaurant._id,
            isActive: true
        });
        console.log("this is menu");
        console.log(menus);
        res.json({ errcode: 0, menus: menus });
    } catch (err) {
        res.json({ errcode: 1, errmsg: "internal error" });
    }
})

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

router.route("/editmenu").post((req, res) => {
    console.log("Accessing /menu/editmenu");
    console.log(req.body);

    Menu.findById(req.body._id).then((menu) => {
        menu.menuName = req.body.menuName;
        menu.menuPrice = req.body.menuPrice;
        menu.menuDescript = req.body.menuDescript;
        menu.save();
    })
})

router.route("/deletemenu").post((req, res) => {
    console.log("Accessing /menu/deletemenu");
    console.log(req.body);

    Menu.findById(req.body._id).then((menu) => {
        menu.isActive = false;
        menu.save();
    })
})

async function findRestaurantByIdAsync(id) {
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

    restaurant = await findRestaurantByIdAsync(accountId);

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