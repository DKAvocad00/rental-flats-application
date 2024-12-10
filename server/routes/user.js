const router = require("express").Router();

const Booking = require("../models/Booking");
const User = require("../models/User");
const Listing = require("../models/Listing");
const { verifyToken, verifyRole } = require("../middleware/auth");

/* GET TRIP BOOKINGS */
router.get(
  "/:userId/trips",
  verifyToken,
  verifyRole(["guest"]),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const trips = await Booking.find({ customerId: userId }).populate(
        "customerId hostId listingId"
      );
      res
        .status(202)
        .json({ message: "Trips fetched successfully", trips: trips });
    } catch (err) {
      console.log(err);
      res
        .status(404)
        .json({ message: "Can not find trips!", error: err.message });
    }
  }
);

/*Add listing wish list */
router.patch(
  "/:userId/:listingId",
  verifyToken,
  verifyRole(["guest"]),
  async (req, res) => {
    try {
      const { userId, listingId } = req.params;
      const user = await User.findById(userId)
        .populate("wishList")
        .populate({
          path: "tripList",
          populate: {
            path: "listingId",
            model: "Listing",
          },
        });
      const listing = await Listing.findById(listingId).populate("creator");

      if (!user || !listing) {
        return res.status(404).json({ message: "User or listing not found" });
      }

      const favoriteListing = user.wishList.find(
        (item) => item._id.toString() === listingId
      );

      if (favoriteListing) {
        // Remove from wishlist
        user.wishList = user.wishList.filter(
          (item) => item._id.toString() !== listingId
        );

        // Recalculate preferred locations and categories from scratch
        user.preferredLocations = [];
        user.preferredCategories = [];

        // Add locations and categories from remaining wishlist items
        user.wishList.forEach((wishListing) => {
          // Handle locations
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

          // Handle categories
          if (!user.preferredCategories.includes(wishListing.category)) {
            user.preferredCategories.push(wishListing.category);
          }
        });

        // Add locations and categories from booked properties
        user.tripList.forEach((trip) => {
          if (trip.listingId) {
            // Handle locations
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

            // Handle categories
            if (!user.preferredCategories.includes(trip.listingId.category)) {
              user.preferredCategories.push(trip.listingId.category);
            }
          }
        });
      } else {
        // Add to wishlist
        user.wishList.push(listing);

        // Add new location if it doesn't exist
        const locationExists = user.preferredLocations.some(
          (loc) =>
            loc.city === listing.city &&
            loc.province === listing.province &&
            loc.country === listing.country
        );

        if (!locationExists) {
          user.preferredLocations.push({
            city: listing.city,
            province: listing.province,
            country: listing.country,
          });
        }

        // Add new category if it doesn't exist
        if (!user.preferredCategories.includes(listing.category)) {
          user.preferredCategories.push(listing.category);
        }
      }

      await user.save();

      res.status(200).json({
        message: favoriteListing
          ? "Listing is removed from wish list"
          : "Listing is added to wish list",
        wishList: user.wishList,
        user: user,
      });
    } catch (err) {
      console.log(err);
      res.status(404).json({ error: err.message });
    }
  }
);

/*Get property list*/
router.get(
  "/:userId/properties",
  verifyToken,
  verifyRole(["host"]),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const properties = await Listing.find({ creator: userId }).populate(
        "creator"
      );
      res.status(202).json({
        message: "Properties fetched successfully",
        properties: properties,
      });
    } catch (err) {
      console.log(err);
      res
        .status(404)
        .json({ message: "Can not find properties!", error: err.message });
    }
  }
);

/* GET Reservation list */
router.get(
  "/:userId/reservations",
  verifyToken,
  verifyRole(["host"]),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const reservations = await Booking.find({ hostId: userId }).populate(
        "customerId hostId listingId"
      );
      res.status(202).json({
        message: "Reservations fetched successfully",
        reservations: reservations,
      });
    } catch (err) {
      console.log(err);
      res
        .status(404)
        .json({ message: "Can not find reservations!", error: err.message });
    }
  }
);

/* Track user view and update preferences */
router.post(
  "/:userId/track-view",
  verifyToken,
  verifyRole(["guest"]),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { listingId } = req.body;

      const user = await User.findById(userId)
        .populate("wishList")
        .populate({
          path: "tripList",
          populate: {
            path: "listingId",
            model: "Listing",
          },
        });
      const listing = await Listing.findById(listingId).populate("creator");

      if (!user || !listing) {
        return res.status(404).json({ message: "User or listing not found" });
      }

      // Add to view history
      const viewExists = user.viewHistory.some(
        (view) => view.listing?.toString() === listingId
      );

      if (!viewExists) {
        user.viewHistory.push({
          listing: listingId,
          viewedAt: new Date(),
        });
      }

      // Update last viewed listings (keep last 10)
      const listingIndex = user.lastViewedListings.indexOf(listingId);
      if (listingIndex !== -1) {
        user.lastViewedListings.splice(listingIndex, 1);
      }
      user.lastViewedListings.unshift(listingId);
      if (user.lastViewedListings.length > 10) {
        user.lastViewedListings.pop();
      }

      // Update preferred locations based on booked and wishlisted properties only
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

      // Update price preferences
      if (!user.pricePreferences) {
        user.pricePreferences = { min: listing.price, max: listing.price };
      } else {
        user.pricePreferences.min = Math.min(
          user.pricePreferences.min,
          listing.price
        );
        user.pricePreferences.max = Math.max(
          user.pricePreferences.max,
          listing.price
        );
      }

      await user.save();

      res.status(200).json({
        message: "User preferences updated successfully",
        user: user,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
