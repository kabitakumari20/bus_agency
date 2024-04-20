const express = require("express");
const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/Bus-AGENCY", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const app = express();
const port = 3000;

// Middleware
app.use(express.json());

const agencySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  contact: { type: String, trim: true },
  from: [{ type: String, trim: true }], // Array of strings for starting points
  to: [{ type: String, trim: true }], // Array of strings for destinations
  pricePerTicket: { type: Number },
});

const Agency = mongoose.model("Agency", agencySchema);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true }, // trim use to remove sapce
  address: { type: String, trim: true },
  contact: { type: String, trim: true },
});
const User = mongoose.model("User", userSchema);

// booking schema----------------

const bookingSchema = new mongoose.Schema({
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agency",
    required: true,
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // If your app has user authentication
  numberOfTickets: { type: Number, required: true },
  bookingDate: { type: Date, default: Date.now },
  totalAmount: Number,
  from:{ type: String, trim: true },
  to:{ type: String, trim: true },
});

// Create a model for bookings
const Booking = mongoose.model("Booking", bookingSchema);

// craet a new user -----------------------
app.post("/register-user", async (req, res) => {
  try {
    const { name, email, address, contact } = req.body;
    const agency = new User({ name, email, address, contact });
    await agency.save();
    res.status(201).json(agency);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// add agency-------------------
app.post("/agencies", async (req, res) => {
  try {
    const { name, address, contact, from, to } = req.body;
    const agency = new Agency({ name, address, contact, from, to });
    await agency.save();
    res.status(201).json(agency);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all agencies
app.get("/get-list", async (req, res) => {
  try {
    const agencies = await Agency.find();
    res.status(200).json({ len: agencies.length, result: agencies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get agency by ID----------------------------
app.get("/get/:id", async (req, res) => {
  try {
    const agency = await Agency.findById(req.params.id);
    if (!agency) {
      return res.status(404).json({ error: "Agency not found" });
    }
    res.status(200).json(agency);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update agency by ID-----------------------------
app.put("/update/:id", async (req, res) => {
  try {
    const { name, address, contact } = req.body;
    const agency = await Agency.findByIdAndUpdate(
      req.params.id,
      { name, address, contact },
      { new: true }
    );
    if (!agency) {
      return res.status(404).json({ error: "Agency not found" });
    }
    res.status(200).json(agency);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/delete/:id", async (req, res) => {
  try {
    const agency = await Agency.findByIdAndDelete(req.params.id);
    if (!agency) {
      return res.status(404).json({ error: "Agency not found" });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// serach-from-to------------
app.post("/serach-from-to1", async (req, res) => {
  try {
    const { from, to } = req.body;
    console.log("from:", from, "to:", to);
    if (!from || !to) {
      return res
        .status(400)
        .json({ error: 'Both "from" and "to" parameters are required' });
    }

    const agencies = await Agency.find({
      from: from,
      to: to,
    });
    res.status(200).json({ len: agencies.length, result: agencies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/search-from-to", async (req, res) => {
  try {
    const { from, to } = req.body;
    console.log("from:", from, "to:", to);

    // Check if both "from" and "to" parameters are provided
    if (!from || !to) {
      return res
        .status(400)
        .json({ error: 'Both "from" and "to" parameters are required' });
    }

    // Search for agencies where both "from" and "to" are present in their respective arrays
    const agencies = await Agency.find({
      from: { $in: from },
      to: { $in: to },
    });

    // If agencies are found, return them
    if (agencies.length > 0) {
      return res
        .status(200)
        .json({ length: agencies.length, result: agencies });
    } else {
      return res
        .status(404)
        .json({ message: "No agencies found for the provided locations" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// search-agency-by-name-------------
app.post("/search-agency-by-name", async (req, res) => {
  try {
    const { name } = req.body;
    console.log("Name:", name);
    if (!name) {
      return res
        .status(400)
        .json({ error: "Name parameter is required for search" });
    }
    const agencies = await Agency.find({
      name: { $regex: new RegExp(name, "i") },
    });
    //   res.status(200).json(agencies);
    res.status(200).json({ len: agencies.length, result: agencies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// to book ticket of bus --------------

app.post("/bookings", async (req, res) => {
  try {
    const { agencyId, numberOfTickets, userId,from,to } = req.body;
    let findAgency = await Agency.findById(agencyId);
    if (!findAgency) throw "Agency not found";
    let amounOfParTicket = findAgency.pricePerTicket;
    let totalAmount = amounOfParTicket * numberOfTickets;
    console.log("totalAmount================>>", totalAmount);
    // Validate input data
    if (
      !agencyId ||
      isNaN(Number(numberOfTickets)) ||
      Number(numberOfTickets) <= 0 ||
      !userId
    ) {
      return res.status(400).json({ error: "Invalid input data" });
    }
    // Check agency availability and perform any necessary validation
    // (e.g., check if enough tickets are available)

    // Create a new booking
    const booking = new Booking({
      agency: agencyId,
      user: userId,
      numberOfTickets: Number(numberOfTickets),
      totalAmount: totalAmount,
      from:from,
      to:to,
      cancellationDate: { type: Date },
      refundAmount: { type: Number }
      // You can add more fields as needed (e.g., user ID, booking date)
    });
    // Save the booking to the database
    await booking.save();
    // Return booking confirmation
    res.status(201).json({ message: "Booking successful", booking: booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/getBookingListByUser", async (req, res) => {
    const { userId } = req.body;

  let findBookingListByUser = await Booking.find({ user: userId }).populate("agency").populate("user")
  if (!findBookingListByUser) throw "not found booking list of thsi user";

  res
    .status(201)
    .json({
      message: "Booking successful",
      len: findBookingListByUser.length,
      booking: findBookingListByUser,
    });
});


app.post("/bookings/cancel", async (req, res) => {
    try {
        const { bookingId } = req.body;
        if (!bookingId) {
            return res.status(400).json({ error: 'Booking ID is required' });
        }
        // Find the booking by ID
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        // Check if the booking has already been cancelled
        if (booking.cancellationDate) {
            return res.status(400).json({ error: 'Booking has already been cancelled' });
        }
        // Calculate refund amount based on your cancellation policy 
        // and if you want to add in userwall then calculate 
        const refundAmount = booking.totalAmount
        console.log("refundAmount=============>>",refundAmount)
        // Update the booking record with cancellation details
        booking.cancellationDate = new Date();
        booking.refundAmount = refundAmount;
        await booking.save();
        // Return cancellation confirmation
        res.status(200).json({ message: 'Booking cancelled successfully', refundAmount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.post("/bookings/update", async (req, res) => {
    try {
        const { bookingId, from,to } = req.body;
        if (!bookingId || !from||to) {
            return res.status(400).json({ error: 'Booking ID and updated data are required' });
        }
        // Find the booking by ID
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        // Apply the updates to the booking
        Object.assign(booking, from,to);
        // Save the updated booking to the database
        await booking.save();
        // Return confirmation message along with the updated booking details
        res.status(200).json({ message: 'Booking updated successfully', booking });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



app.listen(port, () => {
  console.log(`Server started at ${port}`);
});
