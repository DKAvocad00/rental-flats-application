const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const User = require("../models/User");

/* Configuration Multer for file upload */
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

/*USER REGISTER*/
router.post("/register", upload.single("profileImage"), async (req, res) => {
  try {
    /* Take all information from the form */
    const { firstName, lastName, email, password, role } = req.body;

    /* Validate role */
    if (!["host", "guest"].includes(role)) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: "Invalid role selected." });
    }

    /* Check if user exists */
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(409).json({ message: "User already exists!" });
    }

    /*The uploaded file is available as req.file */
    const profileImage = req.file;
    if (!profileImage) {
      return res.status(400).json({ message: "No profile image uploaded." });
    }

    /*Hass the passords*/
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    /*Create a new user */
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      profileImagePath: profileImage.filename,
      role,
    });

    /* Save the new User */
    const savedUser = await newUser.save();

    const userDir = `public/uploads/users/${savedUser._id}`;
    fs.mkdirSync(userDir, { recursive: true });

    const oldPath = profileImage.path;
    const newPath = path.join(userDir, profileImage.filename);
    fs.renameSync(oldPath, newPath);

    savedUser.profileImagePath = newPath;
    await savedUser.save();

    res
      .status(200)
      .json({ message: "User registered successfully!", user: savedUser });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Registration failed!", error: err.message });
  }
});

/*USER LOGIN */

router.post("/login", async (req, res) => {
  try {
    /*Take the information from the form */
    const { email, password } = req.body;

    /* Check if user exists */
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(409).json({ message: "User doesn't exist!" });
    }
    /*Compose the password with the hashed password */
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials!" });
    }

    /* Generate JWT token */
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    delete user.password;

    if (user.isBlocked) {
      return res.status(403).json({ message: "User is blocked." });
    }

    res.status(200).json({
      message: "Login successful!",
      token: token,
      user: user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
