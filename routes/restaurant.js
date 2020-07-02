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
const moment =require('moment')

class tableForClient{
  constructor(table){
    this._id = table._id;
    this.status = table.status;
    this.resId = table.restaurant;
    this.rid = table.rid;
    this.size = table.size;
    this.prefers = '';
    if(table.isQuite) this.prefers.concat("quite ");
    if(table.isNearWindow) this.prefers.concat("window ");
    this.isOpen = false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}   


async function isTableAvaliableAtTime(table, datetime, eatingTime) {
  //console.log(datetime);
  var reservation = Reservation.find({
    table: table, dateTime: {
      $gte: moment(datetime).add(0-eatingTime, 'h').toDate(),
      $lte: moment(datetime).add(eatingTime, 'h').toDate()
    }
  })
  console.log((await reservation).length);
  if ((await reservation).length > 0) 
  {
    console.log("err")
    return false;
  }
  //console.log(moment(datetime).add(0-eatingTime, 'h').toDate());
  //console.log(new Date(datetime))
  return true;
}

router.route('/tableinfo').post(async (req, res) => {

  
  
  var eatingTime = 2; //2 hours, TODO: this should refer restauraunt settings

  var obj = {
    resId: req.body.resId,
    numOfPeople: req.body.numOfPeople,
    dateTime: req.body.dateTime,
  }
  console.log(moment(obj.datetime).add(0-eatingTime, 'h').toDate())
  console.log(moment(obj.datetime).add(eatingTime, 'h').toDate())

  Reservation.find({
    table: '5efd87a3b25d3554106046f5', dateTime: {
      $gte: moment(obj.datetime).add(0-eatingTime, 'h').toDate(),
      $lte: moment(obj.datetime).add(eatingTime, 'h').toDate()
    }
  }).then((re)=>{
    console.log(re);
  })
  var rest = Restaurant.findOne({ _id: obj.resId });
  var ts = [];
  try {
    ts = await Table.find({ restaurant:  (await rest)._id})
  } catch (err) {
    console.error(err)
    throw err
  }
  var tables = [];
  for(var i in ts){
    tables.push(new tableForClient(ts[i]));
  }
  if (tables.length > 0) {
    //console.log(tables);
    for (var i in tables) { //checking number of people condition
      if (tables[i].status) {
        if (obj.numOfPeople <= 2 && tables[i].size <= 2) {
          tables[i].isOpen = true;
        } else if (obj.numOfPeople <= 4 && tables[i].size <= 4) {
          tables[i].isOpen = true;
        } else if (tables[i].size - obj.numOfPeople > 0 && tables[i].size - obj.numOfPeople < 3) {
          tables[i].isOpen = true;
        } else {
          tables[i].isOpen = false;
        }
      }
    }
    for (var t of tables) {//checking time condition
      if (t.isOpen) {
        if (!(await isTableAvaliableAtTime(t, new Date(obj.dateTime), eatingTime))) {
          t.isOpen = false;
        }
      }
    }
  }
  res.json(tables)
})

//for testing purpose
router.route('/addTable').post(async (req, res) => {
  //res: 5efa8fc9dd9918ba08ac9ade
  var ress = await Restaurant.find();
  console.log(req.body.size)
  var newTable = new Table({
    restaurant: ress[0],
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

//THIS IS NOT SAFE!!!! RESERVATION CONFILECTION MAY OCCURE, NEED A SOLUTION
router.route('/reserve').post(async (req, res) => {
  var obj = {
    //resId: req.body.resId,
    numOfPeople: req.body.numOfPeople,
    dateTime: new Date(req.body.dateTime),
    tableId : req.body.tableId,
    comments : req.body.comments,
    customerId: '5efa8f53dd9918ba08ac9ada' //FIXME: for debugging!!!
  }
  console.log(obj);
  var eatingTime = 2;
  var table = await Table.findOne({_id: obj.tableId});
  if(!table.status){
    res.json({errcode: 1, errmsg: "Table closed"});
  }
  if(!await(isTableAvaliableAtTime(table, new Date(obj.dateTime), eatingTime))){
    res.json({errcode: 3, errmsg: "Table is already reserved, please choose another table"});
  }
  if(cache.get(table._id) != null){
    await sleep(3000);
    if(cache.get(table._id) != null){
      res.json({errcode: 2, errmsg: "Server busy"});
    }
  }
  if(table.status){
    console.log("Saving: " + table._id);
    cache.put(table._id, "true", 30000);
    var rev = new Reservation({
      customer: obj.customerId, 
      table: table._id,
      dateTime: obj.dateTime.toString(),
      numOfPeople: obj.numOfPeople,
      comments: obj.comments,
      reserveTime: new Date(),
    })
    //console.log(rev)
    rev.save().then(()=>{
      cache.del(table._id);
      res.json({errcode: 0})
    }
    ).catch(err=>{
      console.error(err)
      cache.del(table._id);
      res.json({errcode: 1})
    })
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

//for testing
router.route("/:id").get((req, res) => {
  Restaurant.findById(req.params.id)
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
    .then((restaurant) => res.json(restaurant))
    .catch((err) => res.status(400).json("Error: " + err));
});

// for testing
router.route("/:id").post((req, res) => {
  var obj = {
    resId: req.params.id,
    resName: req.body.resname,
    phoneNumber: req.body.phonenumber,
    businessNum: req.body.businessnumber,
    description: req.body.description,

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

  await Restaurant.findById(resId).then((restaurant) => {
    //restaurant info
    restaurant.resName = obj.resName;
    restaurant.phoneNumber = obj.phoneNumber;
    restaurant.businessNum = obj.businessNum;

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
