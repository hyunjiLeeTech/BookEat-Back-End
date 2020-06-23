const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const accountSchema = new Schema({
  email: { type: String, required: false, maxLength: 255 },
  userTypeId: { type: Number, required: false },
  password: { type: String, required: true },
});

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
