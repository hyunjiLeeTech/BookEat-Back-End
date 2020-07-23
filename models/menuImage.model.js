const mongoose = require("mongoose");
const { stringify } = require("qs");
const Schema = mongoose.Schema;

const menuImageSchema = new Schema(
    {
        imageUrl: { type: String },
    },
    {
        timestamps: true,
    }
);

const MenuImage = mongoose.model("MenuImage", menuImageSchema);

MenuImage.createIndexes();

module.exports = MenuImage;
