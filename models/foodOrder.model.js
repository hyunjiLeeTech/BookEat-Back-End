const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const foodOrderSchema = new Schema(
    {
        menuItems: {type: [Schema.Types.ObjectId], ref: "Menu"},
    },
    {
        timestamps: true,
    }
);

const FoodOrder = mongoose.model("FoodOrder", foodOrderSchema);

FoodOrder.createIndexes();

module.exports = FoodOrder;
