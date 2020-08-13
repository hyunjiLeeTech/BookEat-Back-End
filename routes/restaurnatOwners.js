const router = require("express").Router();
let RestaurantOwner = require("../models/restaurantOwner.model");
let Account = require("../models/account.model");
let Address = require("../models/address.model");
const Restaurant = require("../models/restaurnat.model");
let Manager = require("../models/manager.model");
const { find } = require("../models/restaurnat.model");
const Reservation = require("../models/reservation.model");

let findAccountByEmailAsyc = async function (email) {
  return await Account.find({ email: email });
};
let findRestaurantById = async function (actId) {
  let resOwner = await RestaurantOwner.findOne({ account: actId });
  console.log("ResOwner: " + resOwner._id);
  return await Restaurant.findOne({ restaurantOwnerId: resOwner._id });
};

async function findRestaurantOwnerByAccountAsync(acc) {
  return await RestaurantOwner.findOne({ account: acc });
}
//get request (/customers)
router.route("/").get((req, res) => {
  RestaurantOwner.find()
    .populate("account")
    .then((restaurantOwner) => res.json(restaurantOwner))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/getmanagers").get(async (req, res) => {
  console.log("Accessing /restaurantOwners/getmanagers");
  var actId = req.user._id;

  try {
    var restaurant = await findRestaurantById(actId);
    console.log("Res: " + restaurant._id);

    var managers = await Manager.find({
      restaurantId: restaurant._id,
      isActive: true,
    });
    res.json({ errcode: 0, managers: managers });
  } catch (err) {
    res.json({ errcode: 1, errmsg: "internal error" });
  }
});

router.route("/deletemanager").post(async (req, res) => {
  console.log("Accessing /restaurantOwners/deletemanager");
  let manAccountId;

  try {
    await Manager.findById(req.body.deleteManId).then((manager) => {
      manager.isActive = false;
      manAccountId = manager.accountId._id;
      manager.save();
    });

    await Account.findById(manAccountId).then((manAccount) => {
      manAccount.isActive = false;
      manAccount.save();
    });
    res.json({ errcode: 0, errmsg: "success" });
  } catch (err) {
    res.json({ errcode: 1, errmsg: "internal error" });
  }
});

router.get('/deleteAccount', async (req, res) => {
  var u = req.user;
  u = await Account.findById(u._id)
  if (u.userTypeId === 2) {
    var rest = await Restaurant.findOne({ restaurantOwnerId: await findRestaurantOwnerByAccountAsync(u) });
    console.log(await findRestaurantOwnerByAccountAsync(u))
    if (rest === null) {
      res.json({ errcode: 2, errmsg: 'restaurant not found' })
      return;
    }
    var managers = await Manager.find({ restaurantId: (await rest)._id })

    var reservations = await Reservation.find({ status: 2, restaurant: (await rest)._id, }).populate('customer').populate('table');
    if (reservations.length > 0) {
      return res.json({ errocde: 1, errmsg: 'Please finish all reservations before closing restaurant' })
    } else {
      for (var m of managers) {
        var a = await Account.findById(m.accountId);
        if (a) {
          a.isActive = false;
          a.save();
        }
      }
      u.isActive = false;
      u.token = '';
      rest.status = 4;
      await rest.save();
      await u.save()
      return res.json({ errcode: 0, errmsg: 'success' })
    }
  }
})

router.route("/getrestaurantinfo").get((req, res) => {
  var _id = req.user._id;
  //query from db
  console.log("/restaurantOwners/getrestaurantinfo:");
  RestaurantOwner.findOne({ account: _id }).then((restOwner) => {
    Restaurant.findOne({ restaurantOwnerId: restOwner._id })
      .populate("addressId")
      .populate("cuisineStyleId")
      .populate("categoryId")
      .populate("priceRangeId")
      .populate("monOpenTimeId")
      .populate("tueOpenTimeId")
      .populate("wedOpenTimeId")
      .populate("thuOpenTimeId")
      .populate("friOpenTimeId")
      .populate("satOpenTimeId")
      .populate("sunOpenTimeId")
      .populate("monCloseTimeId")
      .populate("tueCloseTimeId")
      .populate("wedCloseTimeId")
      .populate("thuCloseTimeId")
      .populate("friCloseTimeId")
      .populate("satCloseTimeId")
      .populate("sunCloseTimeId")
      .then((restaurant) => {
        //console.log(restaurant);
        res.json(restaurant);
      });
  });
});

//restaurant signup
let addRestaurantOwnerAsync = async function (obj) {
  const regExpEmail = RegExp(/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/);

  const regExpPhone = RegExp(
    /^\(?([0-9]{3})\)?[-.●]?([0-9]{3})[-.●]?([0-9]{4})$/
  );

  const regExpPassword = RegExp(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,32}$/
  );

  const regExpPostalCode = RegExp(/^([A-Za-z]\d[A-Za-z][-]?\d[A-Za-z]\d)$/);

  const regExpBusinessNum = RegExp(/^[0-9]{9}\s+[A-Za-z]{2}\s+[0-9]{4}$/);

  //account
  const userTypeId = 2; // restaurant owner
  const password = obj.password;
  const email = obj.email;

  //restaurantOwner
  // this is for restaurant

  //address
  const province = obj.province;
  const streetNumber = obj.streetNumber;
  const streetName = obj.streetName;
  const postalCode = obj.postalCode;
  const city = obj.city;

  //restaurant
  const resName = obj.resName;
  const businessNum = obj.businessNum;
  const phoneNumber = obj.phoneNumber;

  const newAccount = new Account({
    email,
    password,
    userTypeId,
  });

  const newAddress = new Address({
    province,
    streetName,
    streetNumber,
    postalCode,
    city,
  });

  let message = "";
  if ((await findAccountByEmailAsyc(email)).length > 0) {
    message = "This email is already registered";
    throw message;
  }

  if (!regExpEmail.test(email)) {
    message = "Incorrect email format";
    throw message;
  }

  if (!regExpPhone.test(phoneNumber)) {
    message = "Incorrect phone number";
    throw message;
  }

  if (!regExpBusinessNum.test(businessNum)) {
    message = "Incorrect business number";
    throw message;
  }

  if (!regExpPostalCode.test(postalCode)) {
    message = "Incorrect postal code";
    throw message;
  }

  // if (!regExpPassword.test(password)) {
  //   message = "Incorrect password";
  //   throw message;
  // }

  let acnt = await newAccount.save();
  let address = await newAddress.save();

  const newRestaurantOwner = new RestaurantOwner({
    account: acnt._id,
  });

  let restOwner = await newRestaurantOwner.save();

  const newRestaurant = new Restaurant({
    resName,
    phoneNumber,
    businessNum,
    restaurantOwnerId: restOwner._id,
    addressId: address._id,
  });

  return await newRestaurant.save();
};

router.post("/add", (req, res) => {
  //account
  const userTypeId = 2; // restaurant owner
  const password = req.body.password;
  const email = req.body.email;

  //restaurantOwner
  // this is for restaurant

  //address
  const province = req.body.province;
  const streetNumber = req.body.streetNumber;
  const streetName = req.body.streetName;
  const postalCode = req.body.postalCode;
  const city = req.body.city;

  //restaurant
  const resName = req.body.resName;
  const businessNum = req.body.businessNum;
  const phoneNumber = req.body.phoneNumber;
  var obj = {
    userTypeId,
    password,
    email,
    province,
    streetNumber,
    streetName,
    postalCode,
    city,
    resName,
    businessNum,
    phoneNumber,
  };
  addRestaurantOwnerAsync(obj)
    .then(() => {
      res.json({ errcode: 0, errmsg: "success" });
    })
    .catch((err) => {
      res.json({ errcode: 1, errmsg: err });
    });
});

module.exports = router;
