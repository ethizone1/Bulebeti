const mongoose = require("mongoose");
const Testimonial = require("./models/Testimonial");

mongoose
  .connect("mongodb://localhost:27017/bulebeti")
  .then(async () => {
    const ts = await Testimonial.find({});
    console.log(`Found ${ts.length} testimonials:`);
    ts.forEach((t) => console.log(t.name, t.status));
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
