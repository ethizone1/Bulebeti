const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');

mongoose.connect('mongodb://localhost:27017/bulebet')
  .then(async () => {
    console.log('Connected to MongoDB');
    const result = await Restaurant.findOneAndUpdate(
      { slug: 'the-golden-truffle' },
      { subscriptionTier: 'Premium' },
      { new: true }
    );
    if (result) {
      console.log('Successfully updated restaurant tier to:', result.subscriptionTier);
    } else {
      console.log('Restaurant not found');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
