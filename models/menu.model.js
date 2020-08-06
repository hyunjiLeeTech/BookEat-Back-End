const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const menuSchema = new Schema(
    {
        menuName: {
            type: String,
            required: true,
            maxLength: 32,
        },
        menuPrice: {
            type: Number,
            required: true,
            maxLength: 32,
        },
        menuDescript: {
            type: String,
            required: false, // TODO: required true
        },
        foodType: {
            type: String,
            required: false, // TODO: required true
        },
        isActive: {
            type: Boolean,
            required: true,
        },
        restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant" },
        menuImageId: { type: String }
    },
    {
        timestamps: true,
    }
);

const Menu = mongoose.model("Menu", menuSchema);

Menu.createIndexes();

module.exports = Menu;
