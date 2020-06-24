const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const accountSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, maxLength: 255 },
    userTypeId: { type: Number, required: true },
    password: { type: String, unique: false, required: true },
    token: { type: String },
  },
  {
    timestamps: true,
  }
);

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
