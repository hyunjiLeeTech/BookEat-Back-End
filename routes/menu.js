const router = require("express").Router();
let Menu = require("../models/menu.model");
let RestaurantOwner = require("../models/restaurantOwner.model");
let Restaurant = require("../models/restaurnat.model");
let Manager = require("../models/manager.model");

router.route("/getmenus").get(async (req, res) => {
    console.log("Accessing /menu/getmenus");
    var actId = req.user._id;
    var userType = req.user.userTypeId;

    console.log("user type: " + userType);

    try {
        if (userType == 2) {

            var restaurant = await findRestaurantByIdAsync(actId);

            var menus = await Menu.find({
                restaurantId: restaurant._id,
                isActive: true
            });
            res.json({ errcode: 0, menus: menus });

        } else if (userType == 3) {
            var restaurant = await findRestaurantByManagerIdAsync(actId);

            var menus = await Menu.find({
                restaurantId: restaurant._id,
                isActive: true
            });
            res.json({ errcode: 0, menus: menus });
        } else {
            res.json({ errcode: 1, errmsg: 'this is get menus for res owner and manager' });
        }
    } catch (err) {
        res.json({ errcode: 1, errmsg: "internal error" });
    }
})

router.route("/addmenu").post((req, res) => {
    console.log("Accessing /menu/addmenu");
    var accountId = req.user._id;
    var userType = req.user.userTypeId;

    var menuName = req.body.menuName;
    var menuPrice = req.body.menuPrice;
    var menuDescript = req.body.menuDescript;
    var menuImageId = req.body.menuImageId;

    //console.log(imageUrl);

    var obj = {
        accountId,
        userType,
        menuName,
        menuPrice,
        menuDescript,
        menuImageId
    }

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
        if (req.body.menuImageId) {
            menu.menuImageId = req.body.menuImageId
        }
        menu.save();
        res.json({ errcode: 0, errmsg: 'success' })
    }).catch(err => {
        console.log(err)
        res.json({ errcode: 1, errmsg: 'failed to save' })
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

async function findRestaurantByManagerIdAsync(id) {
    manager = await Manager.findOne({ accountId: id });

    return await Restaurant.findById(manager.restaurantId);
}

async function addMenuAsync(obj) {
    const accountId = obj.accountId;
    const usrTypeId = obj.userType;

    const menuName = obj.menuName;
    const menuPrice = obj.menuPrice;
    const menuDescript = obj.menuDescript;
    const menuImageId = obj.menuImageId;
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

    if (usrTypeId == 2) restaurant = await findRestaurantByIdAsync(accountId);
    else if (usrTypeId == 3) restaurant = await findRestaurantByManagerIdAsync(accountId);

    const newMenu = new Menu({
        menuName,
        menuPrice,
        menuDescript,
        isActive,
        restaurantId: restaurant._id,
        menuImageId
    })

    return await newMenu.save();
}

module.exports = router;