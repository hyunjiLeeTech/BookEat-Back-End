const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const managerSchema = new Schema(
  {
    firstname: {
      type: String,
      required: true,
      maxLength: 32,
    },
    lastname: {
      type: String,
      required: true,
      maxLength: 32,
    },
    phonenumber: {
      type: Number,
      required: false,
      minlength: 10,
      maxlength: 10,
    },
    isActive: {
      type: Boolean,
    },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant" },
    accountId: { type: Schema.Types.ObjectId, ref: "Account" },
  },
  {
    timestamps: true,
  }
);

const Manager = mongoose.model("Manager", managerSchema);

Manager.createIndexes();

module.exports = Manager;
