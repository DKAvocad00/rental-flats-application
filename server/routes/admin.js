const router = require("express").Router();
const User = require("../models/User");
const Listing = require("../models/Listing");
const Booking = require("../models/Booking");
const { verifyToken, verifyRole } = require("../middleware/auth");

/* Get all users */
router.get("/users", verifyToken, verifyRole(["admin"]), async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Get all listings */
router.get(
  "/listings",
  verifyToken,
  verifyRole(["admin"]),
  async (req, res) => {
    try {
      const listings = await Listing.find().populate("creator");
      res.status(200).json({ listings });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* Get platform statistics */
router.get("/stats", verifyToken, verifyRole(["admin"]), async (req, res) => {
  try {
    const [users, listings, bookings] = await Promise.all([
      User.countDocuments(),
      Listing.find(),
      Booking.countDocuments(),
    ]);

    // Calculate category statistics
    const categoryStats = listings.reduce((acc, listing) => {
      acc[listing.category] = (acc[listing.category] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      totalUsers: users,
      totalListings: listings.length,
      totalBookings: bookings,
      categoryStats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Toggle user block status */
router.patch(
  "/users/:userId/toggle-block",
  verifyToken,
  verifyRole(["admin"]),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.isBlocked = !user.isBlocked;
      await user.save();

      res.status(200).json({
        message: `User ${
          user.isBlocked ? "blocked" : "unblocked"
        } successfully`,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* Delete listing */
router.delete(
  "/listings/:listingId",
  verifyToken,
  verifyRole(["admin"]),
  async (req, res) => {
    try {
      const listing = await Listing.findByIdAndDelete(req.params.listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      res.status(200).json({ message: "Listing deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* Change user role */
router.patch(
  "/users/:userId/change-role",
  verifyToken,
  verifyRole(["admin"]),
  async (req, res) => {
    try {
      const { role } = req.body;
      const user = await User.findById(req.params.userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent changing own role
      if (user._id.toString() === req.user.id) {
        return res.status(403).json({ message: "Cannot change your own role" });
      }

      // Validate role
      if (!["host", "guest", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      user.role = role;
      await user.save();

      res.status(200).json({
        message: `User role changed to ${role} successfully`,
        user: user,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
