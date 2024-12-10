const router = require("express").Router();

const Booking = require("../models/Booking");
const User = require("../models/User");
const Listing = require("../models/Listing");

/* CREATE BOOKING */
router.post("/create", async (req, res) => {
  try {
    const { customerId, hostId, listingId, startDate, endDate, totalPrice } =
      req.body;
    const newBooking = new Booking({
      customerId,
      hostId,
      listingId,
      startDate,
      endDate,
      totalPrice,
    });
    await newBooking.save();

    // Populate the new booking's listingId
    const populatedBooking = await Booking.findById(newBooking._id).populate(
      "listingId"
    );

    // Update user's tripList and preferences
    const user = await User.findById(customerId)
      .populate("wishList")
      .populate({
        path: "tripList",
        populate: {
          path: "listingId",
          model: "Listing",
        },
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add the new booking to tripList
    user.tripList.push(populatedBooking);

    // Update preferred locations based on booked and wishlisted properties
    user.preferredLocations = [];

    // Add locations from wishlist
    user.wishList.forEach((wishListing) => {
      const locationExists = user.preferredLocations.some(
        (loc) =>
          loc.city === wishListing.city &&
          loc.province === wishListing.province &&
          loc.country === wishListing.country
      );

      if (!locationExists) {
        user.preferredLocations.push({
          city: wishListing.city,
          province: wishListing.province,
          country: wishListing.country,
        });
      }
    });

    // Add locations from booked properties
    user.tripList.forEach((trip) => {
      if (trip.listingId) {
        const locationExists = user.preferredLocations.some(
          (loc) =>
            loc.city === trip.listingId.city &&
            loc.province === trip.listingId.province &&
            loc.country === trip.listingId.country
        );

        if (!locationExists) {
          user.preferredLocations.push({
            city: trip.listingId.city,
            province: trip.listingId.province,
            country: trip.listingId.country,
          });
        }
      }
    });

    await user.save();

    res.status(200).json({
      message: "Booking is created successfully",
      booking: populatedBooking,
      user: user,
    });
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .json({ message: "Fail to create a new Booking!", error: err.message });
  }
});

/*GET BOOKINGS BY LISTING ID */
router.get("/:listingId/bookings", async (req, res) => {
  try {
    const { listingId } = req.params;
    const bookings = await Booking.find({ listingId });
    res.status(200).json(bookings);
  } catch (err) {
    res
      .status(404)
      .json({ message: "Fail to fetch bookings", error: err.message });
  }
});

module.exports = router;
