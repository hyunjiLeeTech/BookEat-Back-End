const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const dicountSchema = new Schema(
    {
        percent: { type: Number, required: true },
        description: { type: String, required: false },
        isActive: { type: Boolean, required: true, default: true },
        isDeleted: { type: Boolean, required: true, default: false },
        restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant" }
    },
    {
        timestamps: true,
    }
);

const Discount = mongoose.model("Discount", dicountSchema);

Discount.createIndexes();

module.exports = Discount;
