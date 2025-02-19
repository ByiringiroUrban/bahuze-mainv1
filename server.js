const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const multer = require("multer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 9000;
const SECRET_KEY = process.env.SECRET_KEY || "my-secret-key";

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Accept JSON data
app.use(cookieParser());

app.use(express.json()); // Allows JSON data in requests
app.use(express.urlencoded({ extended: true })); // Allows form data (URL-encoded)

// Session Configuration
app.use(
  session({
    secret: SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, )
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Define User Schema
const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  tel: Number,
  image:{ type: String, default: "/assets/img/app-icon-person-64.png" },
});

const User = mongoose.model("User", userSchema);
const propertySchema = new mongoose.Schema({
  housetype: String,
  price: String, // Example: "Rwf 70,000,000"
  type: String, // Example: "Entire Place"
  location: String, // Example: "Land at Kagugu, Kigali"
  category: String, // Example: "Residential"
  size: String, // Example: "753 Sqm"
  images: [String ], // Array of image URLs
  createdAt: { type: Date, default: Date.now }
});

const Property = mongoose.model("Property", propertySchema);

// Set Storage Engine
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// File Filter for Images Only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload an image file."), false);
  }
};

// Upload Middleware
const upload = multer({ storage, fileFilter });
// ✅ User Registration Route
app.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, tel, image } = req.body;
    console.log("🟢 Incoming request data:", req.body);

    // Check for missing fields
    if (!fullName || !email || !password) {
      console.error("❌ Missing fields:", { fullName, email, password });
      return res.scale(400).send("All fields are required.");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.scale(400).send("Email already exists. Please use another email.");
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the new user
    const newUser = new User({ fullName, email, password: hashedPassword, tel, image });
    await newUser.save();

    // Redirect to index page ("/") after successful registration
    return res.redirect("/"); // Ensure return is here
  } catch (error) {
    console.error("❌ Registration Error:", error);
    return res.scale(500).send("Error registering user."); // Ensure return is here
  }
});


// ✅ User Login Route
app.get("/login", (req, res) => res.render("login"));

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🟢 Login request data:", req.body);

    // Check if email exists
    const user = await User.findOne({ email });
    if (!user) {
      console.error("❌ Email not found:", email);
      return res.scale(400).send("Invalid email or password.");
    }

    // Compare entered password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error("❌ Password does not match for:", email);
      return res.scale(400).send("Invalid email or password.");
    }

    // Store user session
    req.session.userId = user._id;
    req.session.user = { id: user._id, fullName: user.fullName, email: user.email };

    console.log("✅ Login successful for:", email);
    res.redirect("/user/dashboard");
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.scale(500).send("Error logging in.");
  }
});

// ✅ User Logout Route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("❌ Logout Error:", err);
      return res.scale(500).send("Error logging out.");
    }
    res.redirect("/login");
  });
});

// ✅ Middleware to Protect Routes (Authentication)
const authMiddleware = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  next();
};

// ✅ Protected Route Example
app.get("/dashboard", authMiddleware, (req, res) => {
  res.send("Welcome to the Dashboard!");
});

// Set the views directory and EJS as the templating engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "dist")));

app.use("/uploads", express.static("uploads"));


// Define Routes
app.get("/", async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1; // Get current page from query, default to 1
      const limit = 8; // Limit to 8 properties per page
      const skip = (page - 1) * limit; // Calculate the number of documents to skip

      // Get the filter type from query parameters
      const filter = req.query.type || ''; // Default to empty if no filter
      const neighborhood = req.query.neighborhood || ''; // Get neighborhood from query
      const scale = req.query.scale || ''; // Get scale (Rent/Sale) from query
      const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : 0; // Minimum price
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : Infinity; // Maximum price

      // Build the filter object
      const filterObj = {};
      if (filter) {
          filterObj.type = filter; // Filter by property type
      }
  
      if (scale) {
          filterObj.type = scale; // Assuming 'type' is used for both Rent/Sale
      }
      if (minPrice || maxPrice < Infinity) {
          filterObj.price = {};
          if (minPrice) filterObj.price.$gte = minPrice;
          if (maxPrice < Infinity) filterObj.price.$lte = maxPrice;
      }

      // Find properties based on the filter
      const properties = await Property.find(filterObj).skip(skip).limit(limit);
      const totalProperties = await Property.countDocuments(filterObj); // Get total number of properties
      const totalPages = Math.ceil(totalProperties / limit); // Calculate total pages

      // Fetch unique property types for dropdown
      const propertyTypes = await Property.distinct("type");
      const propertyhousetype = await Property.distinct("housetype");
      const propertyLocation = await Property.distinct("location");
      res.render("index", { 
          properties, 
          currentPage: page, 
          totalPages, 
          filter, 
          propertyLocation,
          minPrice, 
          maxPrice,
          propertyTypes,
          propertyhousetype
      }); // Pass properties and pagination data to the view
  } catch (error) {
      console.error("❌ Error fetching properties:", error);
      res.scale(500).send("Error loading properties");
  }
});







app.get("/register", (req, res) => res.render("register"));
app.get("/addPropertie", (req, res) => res.render("addPropertie"));
app.get("/requestPropertie", (req, res) => res.render("requestPropertie"));
app.get("/offerPropertie", (req, res) => res.render("offerPropertie"));
app.get("/sidebar/dashboard", authMiddleware, (req, res) => res.render("index2"));

// ✅ Protected Profile Route
app.get("/user/dashboard", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect("/login"); // Redirect to login if user not found

    // Render the user dashboard with user data
    res.render("userDashboard", {
      fullName: user.fullName,
      image: user.image,
      tel: user.tel,
      email: user.email,
    });
  } catch (error) {
    console.error("❌ Error fetching user data:", error);
    res.status(500).send("Server Error"); // Change scale to status
  }
});



// add propertie



app.post("/add-property", upload.array("images", 5), async (req, res) => {
  try {
    const { price, housetype, type, location, category, size } = req.body;

    // Get image file paths
    const imagePaths = req.files.map((file) => "/uploads/" + file.filename);

    // Check required fields
    if (!price || !type || !location || !category || !size) {
      return res.status(400).send("All fields are required."); // Change scale to status
    }

    // Create and save the property
    const newProperty = new Property({ price, housetype, type, location, category, size, images: imagePaths });
    await newProperty.save();

    return res.status(201).json({ message: "Property added successfully!", property: newProperty }); // Change scale to status
  } catch (error) {
    console.error("❌ Error adding property:", error);
    return res.status(500).send("Error adding property."); // Change scale to status
  }
});




// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
