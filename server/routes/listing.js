const router = require("express").Router();
const multer = require("multer");
const mongoose = require("mongoose");

const Listing = require("../models/Listing");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");
const { verifyToken, verifyRole } = require("../middleware/auth");
const Booking = require("../models/Booking");

/* Configuration Multer for File Upload */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = "public/uploads/temp";
    fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage });

/* CREATE LISTING - Only accessible by hosts */
router.post(
  "/create",
  verifyToken,
  verifyRole(["host"]),
  upload.array("listingPhotos"),
  async (req, res) => {
    try {
      /* Take the information from the form */
      const {
        creator,
        category,
        type,
        streetAddress,
        aptSuite,
        city,
        province,
        country,
        guestCount,
        bedroomCount,
        bedCount,
        bathroomCount,
        amenities,
        title,
        description,
        highlight,
        highlightDesc,
        price,
      } = req.body;

      const listingPhotos = req.files;

      if (!listingPhotos) {
        return res.status(400).json({ message: "No file uploaded." });
      }

      const listingPhotoPaths = listingPhotos.map((file) => file.path);

      const newListing = new Listing({
        creator,
        category,
        type,
        streetAddress,
        aptSuite,
        city,
        province,
        country,
        guestCount,
        bedroomCount,
        bedCount,
        bathroomCount,
        amenities,
        listingPhotoPaths,
        title,
        description,
        highlight,
        highlightDesc,
        price,
      });

      const savedListing = await newListing.save();

      const listingDir = `public/uploads/listings/${savedListing._id}`;
      fs.mkdirSync(listingDir, { recursive: true });

      const updatedPhotoPaths = listingPhotos.map((file) => {
        const oldPath = file.path;
        const newPath = path.join(listingDir, file.filename);
        fs.renameSync(oldPath, newPath);
        return newPath;
      });

      savedListing.listingPhotoPaths = updatedPhotoPaths;
      await savedListing.save();

      res.status(200).json({
        message: "Listing created successfully.",
        listing: savedListing,
      });
    } catch (err) {
      console.log(err);
      res.status(409).json({ message: err.message });
    }
  }
);

/* GET lISTINGS BY CATEGORY */
router.get("/", async (req, res) => {
  const qCategory = req.query.category;

  try {
    let listings;
    if (qCategory) {
      listings = await Listing.find({ category: qCategory }).populate(
        "creator"
      );
    } else {
      listings = await Listing.find().populate("creator");
    }

    res.status(200).json(listings);
  } catch (err) {
    res
      .status(404)
      .json({ message: "Fail to fetch listings", error: err.message });
    console.log(err);
  }
});

/*GET LISTING BY SEARCH */
router.get("/search/:search", async (req, res) => {
  const { search } = req.params;
  try {
    let listings = [];
    if (search === "all") {
      listings = await Listing.find().populate("creator");
    } else {
      listings = await Listing.find({
        $or: [
          { category: { $regex: search, $options: "i" } },
          { title: { $regex: search, $options: "i" } },
        ],
      }).populate("creator");
    }
    res.status(200).json(listings);
  } catch (err) {
    res
      .status(404)
      .json({ message: "Fail to fetch listings", error: err.message });
    console.log(err);
  }
});

/* LISTING DETAILS */
router.get("/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params;
    const listing = await Listing.findById(listingId).populate("creator");
    res.status(202).json(listing);
  } catch (err) {
    res
      .status(404)
      .json({ message: "Listing can not found!", error: err.message });
  }
});

/* GET RECOMMENDED LISTINGS */
router.get(
  "/recommended/:userId",
  verifyToken,
  verifyRole(["guest"]),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { category } = req.query;

      const user = await User.findById(userId)
        .populate("lastViewedListings")
        .populate("viewHistory.listing");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get all listings with optional category filter
      let query = {};
      if (category && category !== "All") {
        query.category = category;
      }

      let listings = await Listing.find(query).populate("creator");

      // Calculate relevance score for each listing
      const scoredListings = listings.map((listing) => {
        let score = 0;

        // Preferred categories bonus
        if (user.preferredCategories?.includes(listing.category)) {
          score += 3;
        }

        // Location match bonus
        const locationMatch = user.preferredLocations?.some(
          (loc) =>
            loc.city === listing.city &&
            loc.province === listing.province &&
            loc.country === listing.country
        );
        if (locationMatch) {
          score += 2;
        }

        // Price range bonus
        if (
          user.pricePreferences?.min <= listing.price &&
          user.pricePreferences?.max >= listing.price
        ) {
          score += 1;
        }

        // Recent views bonus - calculate based on how recent the view was
        const view = user.viewHistory?.find(
          (view) => view.listing?._id.toString() === listing._id.toString()
        );

        if (view) {
          const viewDate = new Date(view.viewedAt);
          const now = new Date();
          const hoursSinceView = Math.floor(
            (now - viewDate) / (1000 * 60 * 60)
          );

          // Add bonus points based on recency:
          // - Less than 1 hour ago: 4 points
          // - Less than 6 hours ago: 3 points
          // - Less than 24 hours ago: 2 points
          // - Less than 72 hours ago: 1 point
          if (hoursSinceView < 1) {
            score += 4;
          } else if (hoursSinceView < 6) {
            score += 3;
          } else if (hoursSinceView < 24) {
            score += 2;
          } else if (hoursSinceView < 72) {
            score += 1;
          }
        }

        return {
          ...listing.toObject(),
          relevanceScore: score,
        };
      });

      // Sort by relevance score (higher score first)
      scoredListings.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Remove the score before sending to client
      const sortedListings = scoredListings.map(
        ({ relevanceScore, ...listing }) => listing
      );

      res.status(200).json({
        message: "Listings fetched successfully",
        listings: sortedListings,
      });
    } catch (err) {
      res.status(500).json({
        message: "Failed to fetch recommendations",
        error: err.message,
      });
    }
  }
);

/* DELETE LISTING - Safe delete with related records cleanup */
router.delete(
  "/:listingId",
  verifyToken,
  verifyRole(["host", "admin"]),
  async (req, res) => {
    try {
      const { listingId } = req.params;
      const listing = await Listing.findById(listingId);

      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      // Check if user is host and owns the listing
      if (
        req.user.role === "host" &&
        listing.creator.toString() !== req.user.id
      ) {
        return res
          .status(403)
          .json({ message: "You can only delete your own listings" });
      }

      // Start a session for transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Delete all bookings related to this listing
        await Booking.deleteMany({ listingId: listing._id }).session(session);

        // Remove listing from all users' wishLists
        await User.updateMany(
          { wishList: listing._id },
          { $pull: { wishList: listing._id } }
        ).session(session);

        // Remove listing from all users' lastViewedListings
        await User.updateMany(
          { lastViewedListings: listing._id },
          { $pull: { lastViewedListings: listing._id } }
        ).session(session);

        // Remove listing from all users' viewHistory
        await User.updateMany(
          { "viewHistory.listing": listing._id },
          { $pull: { viewHistory: { listing: listing._id } } }
        ).session(session);

        // Delete the listing itself
        await Listing.findByIdAndDelete(listing._id).session(session);

        // Commit the transaction
        await session.commitTransaction();
      } catch (error) {
        // If any operation fails, abort the transaction
        await session.abortTransaction();
        throw error;
      } finally {
        // End the session
        session.endSession();
      }

      res.status(200).json({
        message: "Listing and all related records deleted successfully",
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
