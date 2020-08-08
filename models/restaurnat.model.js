const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const restaurantSchema = new Schema(
  {
    resName: { type: String, required: false },
    businessNum: { type: String, required: false },
    restaurantDescription: { type: String },
    phoneNumber: { type: Number, required: false },
    email: { type: String, required: false },
    status: { type: Number, required: true, default: 3 }, // 2: after sign up. not complete the profile, 4 deavtived
    eatingTime: { type: Number, required: false },

    // open or close
    monIsClose: {
      type: Boolean,
      default: true
    },
    tueIsClose: {
      type: Boolean,
      default: true
    },
    wedIsClose: {
      type: Boolean,
      default: true
    },
    thuIsClose: {
      type: Boolean,
      default: true
    },
    friIsClose: {
      type: Boolean,
      default: true
    },
    satIsClose: {
      type: Boolean,
      default: true
    },
    sunIsClose: {
      type: Boolean,
      default: true
    },

    // open and close times
    monOpenTimeId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "StoreTime",
      required: false,
    },
    tueOpenTimeId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "StoreTime",
      required: false,
    },
    wedOpenTimeId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "StoreTime",
      required: false,
    },
    thuOpenTimeId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "StoreTime",
      required: false,
    },
    friOpenTimeId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "StoreTime",
      required: false,
    },
    satOpenTimeId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "StoreTime",
      required: false,
    },
    sunOpenTimeId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "StoreTime",
      required: false,
    },
    monCloseTimeId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "StoreTime",
      required: false,
    },
    tueCloseTimeId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "StoreTime",
      required: false,
    },
    wedCloseTimeId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "StoreTime",
      required: false,
    },
    thuCloseTimeId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "StoreTime",
      required: false,
    },
    friCloseTimeId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "StoreTime",
      required: false,
    },
    satCloseTimeId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "StoreTime",
      required: false,
    },
    sunCloseTimeId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "StoreTime",
      required: false,
    },

    //address
    addressId: { type: Schema.Types.ObjectId, required: false, ref: "Address" },

    // restaurant owner
    restaurantOwnerId: {
      type: Schema.Types.ObjectId,
      ref: "RestaurantOwner",
      required: true,
    },

    //category
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: false,
    },

    //cuisine style
    cuisineStyleId: {
      type: Schema.Types.ObjectId,
      ref: "CuisineStyle",
      required: false,
    },

    //price range
    priceRangeId: {
      type: Schema.Types.ObjectId,
      ref: "PriceRange",
      required: false,
    },

    // pictures
    pictures: [{
      type: String,
      required: false
    }]
  },
  {
    timestamps: true,
  }
);

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

module.exports = Restaurant;
