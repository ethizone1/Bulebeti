const mongoose = require('mongoose');
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const MenuItem = require('./models/MenuItem');
const Event = require('./models/Event');
const Feedback = require('./models/Feedback');
const Location = require('./models/Location');
const bcrypt = require('bcrypt');

mongoose.connect('mongodb://localhost:27017/bulebet').then(async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    await Event.deleteMany({});
    await Feedback.deleteMany({});
    await Location.deleteMany({});

    // Create Owner
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const owner = new User({
      name: 'Admin User',
      email: 'admin@goldentruffle.com',
      password: hashedPassword,
      role: 'admin'
    });
    await owner.save();

    const superAdmin = new User({
      name: 'Super Admin',
      email: 'superadmin@bulebet.com',
      password: hashedPassword,
      role: 'super-admin'
    });
    await superAdmin.save();

    // Create Restaurant
    const restaurant = new Restaurant({
      name: 'The Golden Truffle',
      slug: 'the-golden-truffle',
      description: 'An exquisite dining experience.',
      address: '123 Truffle Way, Culinary District',
      phone: '555-0199',
      ownerId: owner._id
    });
    await restaurant.save();

    // Create Menu Items
    const items = [
      { name: 'Truffle Arancini', price: 18, description: 'Sicilian rice balls with black truffle.\nIngredients: Arborio rice, Black Truffle, Panko\nContains: Gluten, Dairy', category: 'Starters', imageUrl: 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=400&q=80', isAvailable: true, restaurantId: restaurant._id },
      { name: 'Wagyu Beef Carpaccio', price: 24, description: 'Thinly sliced wagyu and parmigiano.\nIngredients: Wagyu Beef, Capers, Parmigiano\nContains: Dairy', category: 'Starters', imageUrl: 'https://images.unsplash.com/photo-1514333919153-ca54640ca227?w=400&q=80', isAvailable: true, restaurantId: restaurant._id },
      { name: 'Pan-Seared Sea Bass', price: 42, description: 'With lemon butter sauce.\nIngredients: Sea Bass, Lemon Butter, Asparagus\nContains: Fish, Dairy', category: 'Mains', imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80', isAvailable: true, restaurantId: restaurant._id },
      { name: 'Lobster Linguine', price: 46, description: 'Fresh pasta with half lobster.\nIngredients: Lobster, Linguine, Chili, Garlic\nContains: Shellfish, Gluten', category: 'Mains', imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&q=80', isAvailable: true, restaurantId: restaurant._id },
      { name: 'Vintage Cabernet Sauvignon', price: 120, description: 'Aged for 12 years in French oak barrels.\nIngredients: Grapes, Oak Notes\nContains: Alcohol (13.5%)', category: 'Beverages', imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80', isAvailable: true, restaurantId: restaurant._id },
      { name: 'Handcrafted Espresso Martini', price: 18, description: 'Premium vodka with freshly brewed espresso.\nIngredients: Vodka, Espresso, Coffee Liqueur\nContains: Caffeine, Alcohol', category: 'Beverages', imageUrl: 'https://images.unsplash.com/photo-1545438102-799c3991ffb2?w=400&q=80', isAvailable: true, restaurantId: restaurant._id },
      { name: 'Artisanal Sparkling Water', price: 9, description: 'Naturally carbonated with a touch of lime.\nIngredients: Spring Water, Lime Zest\nContains: Non-Alcoholic', category: 'Beverages', imageUrl: 'https://images.unsplash.com/photo-1548919973-5cdf592edc45?w=400&q=80', isAvailable: true, restaurantId: restaurant._id }
    ];

    await MenuItem.insertMany(items);

    // Create Events
    await Event.insertMany([
      { 
        restaurantId: restaurant._id, 
        title: 'Summer Truffle Festival', 
        category: 'Food Discount',
        description: 'Join us for a celebration of the season’s finest black truffles. Enjoy an exclusive 5-course tasting menu curated by our executive chef.',
        restaurantNameField: 'The Golden Truffle',
        branchLocation: 'Main Downtown',
        startDate: '2026-07-15', 
        endDate: '2026-07-17',
        startTime: '18:00',
        endTime: '23:00',
        isRepeat: false,
        address: '123 Culinary Ave',
        city: 'Addis Ababa',
        area: 'Bole',
        mapLink: 'https://maps.google.com',
        indoorOutdoor: 'Indoor',
        eventImage: 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=600&q=80',
        posterImage: '',
        bannerImage: '',
        isFree: false,
        price: '1500',
        currency: 'ETB',
        bookingRequired: true,
        maxGuests: '100',
        specialMenu: true,
        menuItems: 'Truffle Risotto, Truffle Ice Cream',
        discountPercent: '10',
        specialOfferDesc: '10% off for couples',
        contactName: 'Chef Remy',
        contactPhone: '+251 911 234 567',
        contactEmail: 'events@goldentruffle.com',
        whatsappLink: 'https://wa.me/251911234567',
        reservationLink: 'http://localhost:5173/bulebet/the-golden-truffle/reservations',
        status: 'Active'
      },
      { 
        restaurantId: restaurant._id, 
        title: 'Vintage Champagne Tasting', 
        category: 'Happy Hour',
        description: 'Experience rare vintages from the finest houses in Champagne. Includes caviar pairings.',
        restaurantNameField: 'The Golden Truffle',
        branchLocation: 'Main Downtown',
        startDate: '2026-06-20', 
        endDate: '2026-06-20',
        startTime: '19:00',
        endTime: '21:00',
        isRepeat: false,
        address: '123 Culinary Ave',
        city: 'Addis Ababa',
        area: 'Bole',
        mapLink: 'https://maps.google.com',
        indoorOutdoor: 'Indoor',
        eventImage: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80',
        isFree: false,
        price: '5000',
        currency: 'ETB',
        bookingRequired: true,
        maxGuests: '30',
        contactName: 'Sommelier Anna',
        contactPhone: '+251 922 345 678',
        status: 'Closed'
      },
      { 
        restaurantId: restaurant._id, 
        title: 'Chef\'s Table Experience', 
        category: 'Private Event',
        description: 'An intimate dining experience right in the heart of our kitchen. Watch the culinary magic happen up close.',
        restaurantNameField: 'The Golden Truffle',
        branchLocation: 'Main Downtown',
        startDate: '2026-08-01', 
        endDate: '2026-12-31',
        startTime: '19:00',
        endTime: '22:00',
        isRepeat: true,
        address: '123 Culinary Ave',
        city: 'Addis Ababa',
        area: 'Bole',
        indoorOutdoor: 'Indoor',
        eventImage: 'https://images.unsplash.com/photo-1514333919153-ca54640ca227?w=600&q=80',
        isFree: false,
        price: '2500',
        currency: 'ETB',
        bookingRequired: true,
        maxGuests: '12',
        contactPhone: '+251 911 234 567',
        status: 'Active'
      }
    ]);

    // Create Feedback
    await Feedback.insertMany([
      { restaurantId: restaurant._id, customer: 'John Doe', email: 'john@example.com', rating: 5, comment: 'Absolutely amazing truffle pasta!', date: '2026-05-15', status: 'New' },
      { restaurantId: restaurant._id, customer: 'Jane Smith', email: 'jane@example.com', rating: 4, comment: 'Great service, but a bit loud.', date: '2026-05-14', status: 'Reviewed' },
      { restaurantId: restaurant._id, customer: 'Mike Johnson', email: 'mike@example.com', rating: 2, comment: 'Waited too long for our table.', date: '2026-05-12', status: 'Action Needed' }
    ]);

    // Create Locations
    await Location.insertMany([
      { restaurantId: restaurant._id, name: 'BuleBet Downtown', address: '123 Main St, New York, NY', capacity: 80, status: 'Open' },
      { restaurantId: restaurant._id, name: 'BuleBet Waterfront', address: '456 Bay Ave, New York, NY', capacity: 120, status: 'Open' },
      { restaurantId: restaurant._id, name: 'BuleBet Uptown (New)', address: '789 High St, New York, NY', capacity: 60, status: 'Coming Soon' }
    ]);

    console.log('Database seeded with static data successfully!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});
