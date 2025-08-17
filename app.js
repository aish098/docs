const mongoose = require('mongoose');

// --- 1. DATABASE CONNECTION ---
const mongoURI = 'mongodb://localhost:27017/mongo-demo';

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1); // Exit process with failure
  }
};


// --- 2. DEFINE A SCHEMA AND MODEL ---
// A schema defines the structure of our documents.
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  tags: [String],
  createdAt: { type: Date, default: Date.now }
});

// A model is a wrapper on the schema that provides an interface to the database.
const Product = mongoose.model('Product', productSchema);


// --- 3. MAIN FUNCTION TO RUN DEMONSTRATIONS ---
// We will add our database operations inside this function.
const runDemonstrations = async () => {
  console.log('--- Running MongoDB Demonstrations ---');

  // --- 0. SEED DATA ---
  // Clear existing data and insert sample products
  console.log('\n[0] Seeding Data...');
  await Product.deleteMany({}); // Clear the collection
  const sampleProducts = [
    { name: 'Laptop', category: 'Electronics', price: 1200, stock: 15, tags: ['pc', 'gaming'] },
    { name: 'Coffee Maker', category: 'Appliances', price: 80, stock: 30, tags: ['kitchen'] },
    { name: 'The Great Gatsby', category: 'Books', price: 15, stock: 50, tags: ['fiction', 'classic'] },
    { name: 'Smartphone', category: 'Electronics', price: 800, stock: 25, tags: ['mobile'] },
    { name: 'Blender', category: 'Appliances', price: 50, stock: 40, tags: ['kitchen'] },
    { name: 'A Tale of Two Cities', category: 'Books', price: 12, stock: 60, tags: ['fiction', 'history'] },
  ];
  await Product.insertMany(sampleProducts);
  console.log('Sample data inserted.');


  // --- 1. CRUD OPERATIONS ---
  console.log('\n--- [1] CRUD Operations ---');

  // CREATE a new product
  console.log('\n(a) CREATE: Adding a new product...');
  const newProduct = new Product({
    name: 'Wireless Mouse',
    category: 'Electronics',
    price: 45,
    stock: 75,
    tags: ['accessory', 'pc']
  });
  await newProduct.save();
  console.log('New product created:', newProduct.name);

  // READ all products
  console.log('\n(b) READ: Finding all products...');
  const allProducts = await Product.find({});
  console.log(`Found ${allProducts.length} products.`);

  // UPDATE a product's price
  console.log('\n(c) UPDATE: Updating Laptop price...');
  await Product.updateOne({ name: 'Laptop' }, { $set: { price: 1150 } });
  const updatedLaptop = await Product.findOne({ name: 'Laptop' });
  console.log('Updated Laptop price:', updatedLaptop.price);

  // DELETE a product
  console.log('\n(d) DELETE: Removing the Blender...');
  await Product.deleteOne({ name: 'Blender' });
  const deletedBlender = await Product.findOne({ name: 'Blender' });
  console.log('Blender exists after deletion?', !!deletedBlender);


  // --- 2. QUERY OPERATORS ---
  console.log('\n--- [2] Query Operators ---');

  // Find products with price GREATER THAN ($gt) 500
  console.log('\n(a) Find products with price > $500...');
  const expensiveProducts = await Product.find({ price: { $gt: 500 } });
  console.log(`Found ${expensiveProducts.length} expensive products:`, expensiveProducts.map(p => p.name));

  // Find products IN the 'Electronics' or 'Books' categories
  console.log('\n(b) Find products in "Electronics" or "Books" categories...');
  const selectedCategories = await Product.find({ category: { $in: ['Electronics', 'Books'] } });
  console.log(`Found ${selectedCategories.length} products in selected categories.`);


  // --- 3. AGGREGATION ---
  console.log('\n--- [3] Aggregation ---');
  console.log('\nCalculating average price and total stock per category...');
  const aggregationResult = await Product.aggregate([
    {
      $group: {
        _id: '$category', // Group by the 'category' field
        averagePrice: { $avg: '$price' }, // Calculate the average price
        totalStock: { $sum: '$stock' } // Calculate the sum of stock
      }
    },
    {
      $sort: { _id: 1 } // Sort by category name
    }
  ]);
  console.log('Aggregation Result:', aggregationResult);


  console.log('\n--- Demonstrations Complete ---');
};


// --- 4. SCRIPT EXECUTION ---
const execute = async () => {
  await connectDB();
  await runDemonstrations();
  // Disconnect from the database when the script is done
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
};

execute();
