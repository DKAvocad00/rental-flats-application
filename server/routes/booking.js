const router = require("express").Router();

const Booking = require("../models/Booking");

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
    res.status(200).json(newBooking);
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
