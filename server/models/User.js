const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImagePath: {
      type: String,
      default: "",
    },
    tripList: {
      type: Array,
      default: [],
    },
    wishList: {
      type: Array,
      default: [],
    },
    propertyList: {
      type: Array,
      default: [],
    },
    reservationList: {
      type: Array,
      default: [],
    },
    lastViewedListings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
      },
    ],
    preferredCategories: [
      {
        type: String,
      },
    ],
    preferredLocations: [
      {
        city: String,
        province: String,
        country: String,
      },
    ],
    pricePreferences: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 1000000 },
    },
    viewHistory: [
      {
        listing: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Listing",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    role: {
      type: String,
      enum: ["host", "guest", "admin"],
      default: "guest",
      required: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);
module.exports = User;
