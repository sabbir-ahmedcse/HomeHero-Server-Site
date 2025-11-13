const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o7qrlxd.mongodb.net/homehero_db?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

async function run() {
  try {
    await client.connect();
    console.log(" MongoDB Connected");

    const db = client.db("homehero_db");
    const usersCollection = db.collection("users");
    const servicesCollection = db.collection("services");
    const bookingsCollection = db.collection("bookings");

    /* =============================
       USERS COLLECTION CRUD
    ============================= */

    // Add or Update User
    app.put("/users/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const user = req.body;
        const filter = { email };
        const options = { upsert: true };
        const updateDoc = { $set: { ...user, lastLogin: new Date() } };
        const result = await usersCollection.updateOne(filter, updateDoc, options);
        res.json({ success: true, message: "User saved successfully", data: result });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to save user" });
      }
    });

    // Get All Users
    app.get("/users", async (req, res) => {
      try {
        const users = await usersCollection.find().toArray();
        res.json({ success: true, data: users });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch users" });
      }
    });

    // Get Single User
    app.get("/users/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const user = await usersCollection.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, data: user });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to get user" });
      }
    });

    /* =============================
       SERVICES COLLECTION CRUD
    ============================= */

    // Add Service
    app.post("/services", async (req, res) => {
      try {
        const { name, category, price, description, image, provider_name, provider_email } = req.body;
        if (!name || !category || !price || !description || !image || !provider_name || !provider_email) {
          return res.status(400).json({ success: false, message: "All fields required" });
        }

        const service = {
          name,
          category,
          price: parseFloat(price),
          description,
          image,
          provider_name,
          provider_email,
          created_at: new Date(),
          rating: 0,
          totalReviews: 0,
          reviews: []
        };

        const result = await servicesCollection.insertOne(service);
        res.json({ success: true, message: "Service added successfully", data: result });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to add service" });
      }
    });

    // Get All Services
    app.get("/services", async (req, res) => {
      try {
        const services = await servicesCollection.find().sort({ created_at: -1 }).toArray();
        res.json({ success: true, data: services });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch services" });
      }
    });

    // Get Home Services (latest 6)
    app.get("/home-services", async (req, res) => {
      try {
        const services = await servicesCollection.find().sort({ created_at: -1 }).limit(6).toArray();
        res.json({ success: true, data: services });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load home services" });
      }
    });

    // Get Single Service
    app.get("/services/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const service = await servicesCollection.findOne({ _id: new ObjectId(id) });
        if (!service) return res.status(404).json({ success: false, message: "Service not found" });
        res.json({ success: true, data: service });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to get service" });
      }
    });

    // Update Service
    app.patch("/services/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updateData = { $set: { ...req.body, updated_at: new Date() } };
        const result = await servicesCollection.updateOne({ _id: new ObjectId(id) }, updateData);
        res.json({ success: true, message: "Service updated successfully", data: result });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update service" });
      }
    });

    // Delete Service
    app.delete("/services/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await servicesCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          return res.status(404).json({ success: false, message: "Service not found" });
        }
        res.json({ success: true, message: "Service deleted successfully" });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete service" });
      }
    });

    /* =============================
       BOOKINGS COLLECTION CRUD
    ============================= */

    // Create Booking
    app.post("/bookings", async (req, res) => {
      try {
        const { serviceId, bookingDate, price, userEmail } = req.body;
        if (!serviceId || !bookingDate || !price || !userEmail) {
          return res.status(400).json({ success: false, message: "All fields required" });
        }

        const booking = {
          serviceId,
          bookingDate,
          price: parseFloat(price),
          userEmail,
          created_at: new Date()
        };

        const result = await bookingsCollection.insertOne(booking);
        res.json({ success: true, message: "Booking created successfully", data: result });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to create booking" });
      }
    });

    // Get All Bookings
    app.get("/bookings", async (req, res) => {
      try {
        const bookings = await bookingsCollection.find().sort({ created_at: -1 }).toArray();
        res.json({ success: true, data: bookings });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch bookings" });
      }
    });

    // Get Single Booking
    app.get("/bookings/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const booking = await bookingsCollection.findOne({ _id: new ObjectId(id) });
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
        res.json({ success: true, data: booking });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to get booking" });
      }
    });

    // Update Booking
    app.patch("/bookings/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updateData = { $set: { ...req.body, updated_at: new Date() } };
        const result = await bookingsCollection.updateOne({ _id: new ObjectId(id) }, updateData);
        res.json({ success: true, message: "Booking updated successfully", data: result });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update booking" });
      }
    });

    // Delete Booking
    app.delete("/bookings/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await bookingsCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          return res.status(404).json({ success: false, message: "Booking not found" });
        }
        res.json({ success: true, message: "Booking deleted successfully" });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete booking" });
      }
    });

    /* =============================
       ROOT / HEALTH CHECK
    ============================= */

    app.get("/", (req, res) => {
      res.send(" HomeHero Simple CRUD Server Running (Users, Services, Bookings)");
    });

    app.get("/health", (req, res) => {
      res.json({ success: true, message: "Server is healthy ✅" });
    });

    // Start Server
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("MongoDB connection failed:", err);
  }
}

run().catch(console.dir);
