const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const externalLoginSchema = new Schema(
  {
    externalType: {type : Number, required: true},
    account: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    externalId: { type: String, required: true}
  },
  {
    timestamps: true,
  }
);

const ExternalLogin = mongoose.model("ExternalLogin", externalLoginSchema);

module.exports = ExternalLogin;
