
async function testTestimonialsAPI() {
  try {
    const res = await fetch('http://localhost:5000/api/testimonials/restaurant/premium');
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body length:", text.length);
    if (res.ok) {
      const data = JSON.parse(text);
      console.log(`Returned ${data.length} testimonials`);
      if (data.length > 0) {
        console.log("First testimonial name:", data[0].name);
        console.log("First testimonial status:", data[0].status);
        console.log("First testimonial restaurantId:", data[0].restaurantId);
      }
    } else {
      console.log("Error:", text);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testTestimonialsAPI();
