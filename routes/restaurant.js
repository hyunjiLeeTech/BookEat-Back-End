const router = require("express").Router();
const Restaurant = require("../models/restaurnat.model");
const Address = require("../models/address.model");
const CuisineStyle = require("../models/cuisineStyle.model");
const Category = require("../models/category.model");
const PriceRange = require("../models/priceRange.model");
const StoreTime = require("../models/storeTime.model");
const RestaurantOwner = require("../models/restaurantOwner.model");
const Table = require("../models/table.model");
const Reservation = require("../models/reservation.model");
const cache = require('memory-cache')
const moment = require('moment');
const Customer = require("../models/customer.model");
const Manager = require("../models/manager.model");
const FoodOrder = require("../models/foodOrder.model");
const Menu = require("../models/menu.model");

let findCustomerByAccountAsync = async function (acc) {
  return await Customer.findOne({ account: acc })
}

async function findRestaurantOwnerByAccountAsync(acc) {
  return await RestaurantOwner.findOne({ account: acc });
}

async function findManagerByAccountWithRestaurntAsync(acc) {
  var tr = await Manager.findOne({ accountId: acc }).populate("restaurantId");
  return tr
}

class tableForClient {
  constructor(table) {
    this._id = table._id;
    this.status = table.status;
    this.resId = table.restaurant;
    this.rtid = table.rid;
    this.size = table.size;
    this.prefers = '';
    if (table.isQuite) this.prefers = this.prefers.concat("quite ");
    if (table.isNearWindow) this.prefers = this.prefers.concat("window ");
    this.isOpen = false;
  }
}



function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function updateInMemoryReservationsAysnc(id, reservation) {
  var reservations = cache.get('reservations')
  if (reservations === null) return;
  if (id === null) {
    reservations.push(reservation);
    return;
  }
  console.log("Updating reservations in memory cache of " + id)
  for (var index in reservations) {
    if (reservations[index]._id.toString() === id.toString()) {
      reservations[index] = reservation;
      return;
    }
  }
}

async function getReservationByIdAsync(id) {
  return await Reservation.findOne({ _id: id });
}

async function isTableAvaliableAtTimeAsync(table, datetime, eatingTime) {
  //console.log(datetime);
  var reservation = Reservation.find({
    table: table,
    status: 2,
    dateTime: {
      $gte: moment(datetime).add(0 - eatingTime, 'h').toDate(),
      $lte: moment(datetime).add(eatingTime, 'h').toDate()
    }
  })
  if ((await reservation).length > 0) {
    return false;
  }
  //console.log(moment(datetime).add(0-eatingTime, 'h').toDate());
  //console.log(new Date(datetime))
  return true;
}

router.post('/getRestaurantOwnerAndManagerViaRestaurantId', async (req, res) => {
  console.log("IN")
  var ro = await (await Restaurant.findOne({ _id: req.body.restaurantId }).populate("restaurantOwnerId")).restaurantOwnerId.populate("account").execPopulate();
  var rm = await Manager.find({ restaurantId: req.body.restaurantId }).populate("accountId");
  res.json({ Owner: ro, Managers: rm })
})

//TODO: clean code, security update
router.route('/tableinfo').post(async (req, res) => {
  var eatingTime = 2; //2 hours, TODO: this should refer restauraunt settings

  var obj = {
    resId: req.body.resId,
    numOfPeople: req.body.numOfPeople,
    dateTime: req.body.dateTime,
  };
  console.log(obj);
  var rest = Restaurant.findOne({ _id: obj.resId });
  var ts = [];
  try {
    ts = await Table.find({ restaurant: (await rest)._id })
  } catch (err) {
    console.error(err);
    throw err;
  }
  var tables = [];
  for (var i in ts) {
    tables.push(new tableForClient(ts[i]));
  }
  if (tables.length > 0) {
    //console.log(tables);
    for (var i in tables) {
      //checking number of people condition
      if (tables[i].status) {
        if (obj.numOfPeople <= 2 && tables[i].size <= 2) {
          tables[i].isOpen = true;
        } else if (obj.numOfPeople <= 4 && tables[i].size <= 4) {
          tables[i].isOpen = true;
        } else if (
          tables[i].size - obj.numOfPeople >= 0 &&
          tables[i].size - obj.numOfPeople < 3
        ) {
          tables[i].isOpen = true;
        } else {
          tables[i].isOpen = false;
        }
      } else {
        tables[i].isOpen = false;
      }
    }
    for (var t of tables) {
      //checking time condition
      if (t.isOpen) {
        if (
          !(await isTableAvaliableAtTimeAsync(t, new Date(obj.dateTime), eatingTime))
        ) {
          t.isOpen = false;
        }
      }
    }
  }
  res.json({ errcode: 0, tables: tables })
})

//for testing purpose
router.route("/addTable").post(async (req, res) => {
  //res: 5efa8fc9dd9918ba08ac9ade
  var ress = await Restaurant.find();
  console.log(req.body.size);
  var newTable = new Table({
    restaurant: ress[1],
    size: req.body.size,
    isNearWindow: true,
    isQuite: true,
    status: true,
  })
  newTable.save().then(() => {
    res.json({ errcode: 0 });
  }).catch(err => {
    console.error(err);
    res.json({ errcode: 1 })
  })
})
//TODO: testing, securty test
router.route("/cancelreservation").post(async (req, res) => {
  if (req.userTypeId === 1) {
    res.status(401).send('access denied');
    return;
  }
  try {
    var reservation = await getReservationByIdAsync(req.body.reservationId);
    reservation.status = 4;
    reservation.save().then((revs) => {
      updateInMemoryReservationsAysnc(revs._id, revs);
      res.json({ errcode: 0, errmsg: "success" })
    }).catch(err => {
      res.json({ errcode: 1, errmsg: err })
    })
  } catch (err) {
    console.log(err);
    res.status(500).send("internal error")
  }
})

//TODO: testing, security test
router.route("/confirmattendence").post(async (req, res) => {
  try {
    var reservation = await getReservationByIdAsync(req.body.reservationId);
    reservation.status = 0;
    reservation.save().then(() => {
      res.json({ errcode: 0, errmsg: "success" })
    }).catch(err => {
      res.json({ errcode: 1, errmsg: err })
    })
  } catch (err) {
    console.log(err);
    res.status(500).send("internal error")
  }
})

router.route('/getfoodorder/:id').get(async (req, res)=>{
  try {
    var id = req.params.id
    var items = await FoodOrder.findOne({_id: id})
    console.log(items);
    var menus = await Menu.find({_id: {$in: items.menuItems}})
    res.json({ errcode: 0, menus: menus })
  } catch (err) {
    console.log(err);
    res.status(500).send("internal error")
  }
})

//TODO:  clean code, food items
router.route("/reserve").post(async (req, res) => {
  var obj = {
    //resId: req.body.resId,
    numOfPeople: req.body.numOfPeople,
    dateTime: new Date(req.body.dateTime),
    tableId: req.body.tableId,
    comments: req.body.comments,
    customerId: await findCustomerByAccountAsync(req.user._id),
    menuItems: req.body.menuItems
  }

  if (obj.customerId === null) {
    res.json({ errcode: 4, errmsg: "Customer not found" });
    return;
  }

  var eatingTime = 2; //TODO: get eating time from restaruant database
  var table = await Table.findOne({ _id: obj.tableId });
  if (!table.status) {
    res.json({ errcode: 1, errmsg: "Table closed" });
    return;
  }
  if (!await (isTableAvaliableAtTimeAsync(table, new Date(obj.dateTime), eatingTime))) {
    res.json({ errcode: 3, errmsg: "Table is already reserved, please choose another table" });
    return;
  }
  if (cache.get(table._id) != null) {
    await sleep(3000);
    if (cache.get(table._id) != null) {
      res.json({ errcode: 2, errmsg: "Server busy" });
      return;
    }
  }
  if (table.status) {
    console.log("Saving: " + table._id);
    cache.put(table._id, "true", 30000);
    var fo= null;
    if(obj.menuItems !== null){
      var menuItems = await Menu.find({_id: {$in: obj.menuItems}});
      fo = await new FoodOrder({
        menuItems: menuItems,
      }).save();
    }

    var rev = new Reservation({
      customer: obj.customerId,
      table: table._id,
      dateTime: obj.dateTime.toString(),
      numOfPeople: obj.numOfPeople,
      comments: obj.comments,
      reserveTime: new Date(),
      restaurant: table.restaurant,
      status: 2,//0 finished, 1 not attend, 2 upcoming, 3 user cancelled, 4 restaurant cancelled.
      FoodOrder: fo,
    })

    rev.save().then(async (revs) => {
      cache.del(table._id);
      updateInMemoryReservationsAysnc(null, revs)
      var popedRevs = await revs.populate("customer").populate("restaurant").execPopulate();
      res.json({ errcode: 0, reservation: popedRevs })
    }
    ).catch(err => {
      console.error(err)
      cache.del(table._id);
      res.json({ errcode: 1 })
    })
  }
})

//TODO: Finish code, reservation update
router.route('/reservationsofpast14days').get(async (req, res) => {
  //var u = { _id: '5efa8fe8dd9918ba08ac9ae0', userType: 3, restaurantId: '5efa8fc9dd9918ba08ac9ade' }//FIXME: for debug restaurant maanger
  console.log(req.user);
  var u = req.user;
  if (u.userTypeId === 2) {
    var rest = Restaurant.findOne({ restaurantOwnerId: await findRestaurantOwnerByAccountAsync(u) });
    //console.log(rest)
    if (rest === null) {
      res.json({ errcode: 2, errmsg: 'restaurant not found' })
      return;
    }
    var reservations = await Reservation.find({ status: { $ne: 2 }, restaurant: (await rest)._id, dateTime: { $gte: moment(new Date()).add(-14, 'd').toDate() } }).populate('customer').populate('table');
    res.json({ errcode: 0, reservations: reservations });
  } else if (u.userTypeId === 3) {
    var rest = (await findManagerByAccountWithRestaurntAsync(u)).restaurantId;
    //console.log(rest)
    if (rest === null) {
      res.json({ errcode: 2, errmsg: 'restaurant not found' })
      return;
    }
    var reservations = await Reservation.find({ status: { $ne: 2 }, restaurant: rest, dateTime: { $gte: moment(new Date()).add(-14, 'd').toDate() } }).populate('customer').populate('table');
    //.where('table.restaurant', u.restaurantId);
    //console.log(reservations)
    res.json({ errcode: 0, reservations: reservations });
  } else {
    console.log(401)
    res.status(401).json({ errcode: 1, errmsg: 'permission denied' })
  }
});

//for restaurant management
router.route('/upcomingreservations').get(async (req, res) => {
  //var u = req.user;
  //var u = {_id: '5efa8fc9dd9918ba08ac9add', userType: 2}//FIXME: for debug restaurant owner 
  //var u = { _id: '5efa8fe8dd9918ba08ac9ae0', userType: 3, restaurantId: '5efa8fc9dd9918ba08ac9ade' }//FIXME: for debug restaurant maanger
  var u = req.user;
  //console.log(u)

  if (u.userTypeId === 2) {
    var rest = Restaurant.findOne({ restaurantOwnerId: await findRestaurantOwnerByAccountAsync(u) });
    console.log(await findRestaurantOwnerByAccountAsync(u))
    if (rest === null) {
      res.json({ errcode: 2, errmsg: 'restaurant not found' })
      return;
    }
    var reservations = await Reservation.find({ status: 2, restaurant: (await rest)._id, }).populate('customer').populate('table');
    res.json({ errcode: 0, reservations: reservations });
  } else if (u.userTypeId === 3) {
    var rest = (await findManagerByAccountWithRestaurntAsync(u)).restaurantId;
    if (rest === null) {
      res.json({ errcode: 2, errmsg: 'restaurant not found' })
      return;
    }
    var reservations = await Reservation.find({ status: 2, restaurant: rest, }).populate('customer').populate('table');
    //.where('table.restaurant', u.restaurantId);
    //console.log(reservations)
    res.json({ errcode: 0, reservations: reservations });
  } else {
    console.log(401)
    res.status(401).json({ errcode: 1, errmsg: 'permission denied' })
  }
})


router.route('/getTables').get(async (req, res) => {
  var u = req.user;
  console.log(u);
  if (u.userTypeId === 2) {
    var rest = Restaurant.findOne({ restaurantOwnerId: await findRestaurantOwnerByAccountAsync(u) });
    console.log(await findRestaurantOwnerByAccountAsync(u))
    if (rest === null) {
      res.json({ errcode: 2, errmsg: 'restaurant not found' })
      return;
    }
    var tables = await Table.find({ restaurant: await rest })
    res.json({ errcode: 0, tables: tables });
  } else if (u.userTypeId === 3) {
    var rest = (await findManagerByAccountWithRestaurntAsync(u)).restaurantId;
    if (rest === null) {
      res.json({ errcode: 2, errmsg: 'restaurant not found' })
      return;
    }
    var tables = await Table.find({ restaurant: await rest })
    //.where('table.restaurant', u.restaurantId);
    //console.log(reservations)
    res.json({ errcode: 0, tables: tables });
  } else {
    console.log(401)
    res.status(401).json({ errcode: 1, errmsg: 'permission denied' })
  }
})

router.route("/").get((req, res) => {
  Restaurant.find()
    .populate("addressId")
    .then((restaurant) => res.json(restaurant))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/editresprofile").post((req, res) => {
  var _id = req.user._id;

  var obj = {
    accountId: _id,
    resName: req.body.resname,
    phoneNumber: req.body.phonenumber,
    businessNum: req.body.businessnumber,
    description: req.body.description,
    eatingTime: req.body.eatingTime,

    //open and close times
    monOpenTime: req.body.monOpenTime,
    tueOpenTime: req.body.tueOpenTime,
    wedOpenTime: req.body.wedOpenTime,
    thuOpenTime: req.body.thuOpenTime,
    friOpenTime: req.body.friOpenTime,
    satOpenTime: req.body.satOpenTime,
    sunOpenTime: req.body.sunOpenTime,
    monCloseTime: req.body.monCloseTime,
    tueCloseTime: req.body.tueCloseTime,
    wedCloseTime: req.body.wedCloseTime,
    thuCloseTime: req.body.thuCloseTime,
    friCloseTime: req.body.friCloseTime,
    satCloseTime: req.body.satCloseTime,
    sunCloseTime: req.body.sunCloseTime,

    //address
    province: req.body.province,
    streetName: req.body.streetname,
    streetNum: req.body.streetnumber,
    postalCode: req.body.postalcode,
    city: req.body.city,

    //cuisine style
    cuisineStyleVal: req.body.cuisineStyle,

    //category
    categVal: req.body.category,

    //price range
    priceName: req.body.priceRange,
  };

  editRestaurantProfile(obj)
    .then(() => {
      res.json({ errcode: 0, errmsg: "success" });
    })
    .catch((err) => {
      res.json({ errcode: 1, errmsg: err });
    });
});

let editRestaurantProfile = async (obj) => {
  let status = 1; // completed res profile. If any fields are blank, it will change to 2 means working on filling the profile
  let resOwnerId, resId, addrId, cuisineId, categoryId, priceRangeId;
  let monOpenId,
    tueOpenId,
    wedOpenId,
    thuOpenId,
    friOpenId,
    satOpenId,
    sunOpenId,
    monCloseId,
    tueCloseId,
    wedCloseId,
    thuCloseId,
    friCloseId,
    satCloseId,
    sunCloseId;

  //regular expression for validation
  const regExpPhone = RegExp(
    /^\(?([0-9]{3})\)?[-.●]?([0-9]{3})[-.●]?([0-9]{4})$/
  );
  const regExpPostal = RegExp(/^\d{5}-\d{4}|\d{5}|[A-Z]\d[A-Z] \d[A-Z]\d$/);
  const regExpNumbers = RegExp(/^[0-9]+$/);
  const regExpBusinessNumber = RegExp(/^\d{9}$/);

  //restaurant basic info validation
  let message = "";

  if (obj.resName.length < 3) {
    message = "Restaurant Name: At lesat 3 characters are required";
    throw message;
  }

  if (!regExpPhone.test(obj.phoneNumber)) {
    message = "Incorrect phone number";
    throw message;
  }

  if (!regExpBusinessNumber.test(obj.businessNum)) {
    message = "Incorrect Business Number";
    throw message;
  }

  //address validation
  if (!regExpPostal.test(obj.postalCode)) {
    message = "Incorrect postal code";
    throw message;
  }

  if (!regExpNumbers.test(obj.streetNum)) {
    message = "Street Number: At least 1 number required";
    throw message;
  }

  if (obj.streetName.length < 4) {
    message = "Street Name: At least 4 characters are required";
    throw message;
  }

  if (obj.province.length < 2) {
    message = "Province: At lesat 2 characters are required";
    throw message;
  }

  if (obj.city.length < 1) {
    message = "City: Please write the city";
    throw message;
  }

  // for status whether 1 or 2
  if (
    obj.monOpenTime == "" ||
    obj.tueOpenTime == "" ||
    obj.wedOpenTime == "" ||
    obj.thuOpenTime == "" ||
    obj.friOpenTime == "" ||
    obj.satOpenTime == "" ||
    obj.sunOpenTime == "" ||
    obj.monCloseTime == "" ||
    obj.tueCloseTime == "" ||
    obj.wedCloseTime == "" ||
    obj.thuCloseTime == "" ||
    obj.friCloseTime == "" ||
    obj.satCloseTime == "" ||
    obj.sunCloseTime == "" ||
    obj.cuisineStyleVal == "" ||
    obj.categVal == "" ||
    obj.priceName == ""
  ) {
    status = 2;
  }

  await RestaurantOwner.findOne({ account: obj.accountId }).then((resOwner) => {
    resOwnerId = resOwner._id;
  });

  await Restaurant.findOne({ restaurantOwnerId: resOwnerId }).then(
    (restaurant) => {
      resId = restaurant._id;
    }
  );

  await CuisineStyle.findOne({ cuisineVal: obj.cuisineStyleVal }).then(
    (cuisineStyle) => {
      cuisineId = cuisineStyle._id;

      if (obj.cuisineStyleVal == "") {
      }
    }
  );

  await Category.findOne({ categoryVal: obj.categVal }).then((category) => {
    categoryId = category._id;
  });

  await PriceRange.findOne({ priceRangeName: obj.priceName }).then(
    (priceRange) => {
      priceRangeId = priceRange._id;
    }
  );

  //open and close time
  await StoreTime.findOne({ storeTimeVal: obj.monOpenTime }).then(
    (storeTime) => {
      monOpenId = storeTime._id;
    }
  );

  await StoreTime.findOne({ storeTimeVal: obj.tueOpenTime }).then(
    (storeTime) => {
      tueOpenId = storeTime._id;
    }
  );

  await StoreTime.findOne({ storeTimeVal: obj.wedOpenTime }).then(
    (storeTime) => {
      wedOpenId = storeTime._id;
    }
  );

  await StoreTime.findOne({ storeTimeVal: obj.thuOpenTime }).then(
    (storeTime) => {
      thuOpenId = storeTime._id;
    }
  );

  await StoreTime.findOne({ storeTimeVal: obj.friOpenTime }).then(
    (storeTime) => {
      friOpenId = storeTime._id;
    }
  );

  await StoreTime.findOne({ storeTimeVal: obj.satOpenTime }).then(
    (storeTime) => {
      satOpenId = storeTime._id;
    }
  );

  await StoreTime.findOne({ storeTimeVal: obj.sunOpenTime }).then(
    (storeTime) => {
      sunOpenId = storeTime._id;
    }
  );

  await StoreTime.findOne({ storeTimeVal: obj.monCloseTime }).then(
    (storeTime) => {
      monCloseId = storeTime._id;
    }
  );

  await StoreTime.findOne({ storeTimeVal: obj.tueCloseTime }).then(
    (storeTime) => {
      tueCloseId = storeTime._id;
    }
  );

  await StoreTime.findOne({ storeTimeVal: obj.wedCloseTime }).then(
    (storeTime) => {
      wedCloseId = storeTime._id;
    }
  );

  await StoreTime.findOne({ storeTimeVal: obj.thuCloseTime }).then(
    (storeTime) => {
      thuCloseId = storeTime._id;
    }
  );

  await StoreTime.findOne({ storeTimeVal: obj.friCloseTime }).then(
    (storeTime) => {
      friCloseId = storeTime._id;
    }
  );

  await StoreTime.findOne({ storeTimeVal: obj.satCloseTime }).then(
    (storeTime) => {
      satCloseId = storeTime._id;
    }
  );

  await StoreTime.findOne({ storeTimeVal: obj.sunCloseTime }).then(
    (storeTime) => {
      sunCloseId = storeTime._id;
    }
  );

  sunClose = StoreTime.findOne({ storeTimeVal: obj.sunCloseTime });

  await Restaurant.findById(resId).then((restaurant) => {
    //restaurant info
    restaurant.resName = obj.resName;
    restaurant.phoneNumber = obj.phoneNumber;
    restaurant.businessNum = obj.businessNum;
    restaurant.status = status;
    restaurant.eatingTime = obj.eatingTime;

    restaurant.restaurantDescription =
      typeof obj.description != "undefined" ? obj.description : "";

    //open and close times
    restaurant.monOpenTimeId = monOpenId;

    restaurant.tueOpenTimeId = tueOpenId;

    restaurant.wedOpenTimeId = wedOpenId;

    restaurant.thuOpenTimeId = thuOpenId;

    restaurant.friOpenTimeId = friOpenId;

    restaurant.satOpenTimeId = satOpenId;

    restaurant.sunOpenTimeId = sunOpenId;

    restaurant.monCloseTimeId = monCloseId;

    restaurant.tueCloseTimeId = tueCloseId;

    restaurant.wedCloseTimeId = wedCloseId;

    restaurant.thuCloseTimeId = thuCloseId;

    restaurant.friCloseTimeId = friCloseId;

    restaurant.satCloseTimeId = satCloseId;

    restaurant.sunCloseTimeId = sunCloseId;

    //cuisine style
    restaurant.cuisineStyleId = cuisineId;

    //category id
    restaurant.categoryId = categoryId;

    //price range id
    restaurant.priceRangeId = priceRangeId;

    // for address
    addrId = restaurant.addressId;

    restaurant.save();
  });

  await Address.findById(addrId).then((address) => {
    //address
    address.province = obj.province;
    address.streetName = obj.streetName;
    address.streetNum = obj.streetNum;
    address.postalCode = obj.postalCode;
    address.city = obj.city;

    address.save();
  });
};

module.exports = router;
