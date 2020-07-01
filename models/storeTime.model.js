const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const storeTimeSchema = new Schema({
  storeTimeVal: {
    type: String,
    unique: true,
  },
  storeTimeName: {
    type: String,
    required: true,
    unique: true,
  },
});

const StoreTime = mongoose.model("StoreTime", storeTimeSchema);

module.exports = StoreTime;
