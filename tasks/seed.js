import postFunctions from '../data/posts.js';
import userFuncs from '../data/users.js';
import { createReview } from '../data/reviews.js';
import { reportIncident } from '../data/incidents.js';
import { users, posts, reviews, safetyIncidents, restaurant, ratings, banned } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    //clear
    console.log('Clearing existing data...');
    await clearCollections();
    
    //users
    console.log('Seeding users...');
    const seededUsers = await seedUsers();
    
    //restaurants post
    console.log('Seeding restaurants...');
    const seededRestaurants = await seedRestaurants();
    
    //reviews
    console.log('Seeding reviews...');
    await seedReviews(seededUsers, seededRestaurants);
    
    //incidents
    console.log('Seeding incidents...');
    await seedIncidents(seededUsers, seededRestaurants);

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    process.exit();
  }
};

const clearCollections = async () => {
  const collections = [
    { name: 'users', collection: await users() },
    { name: 'posts', collection: await posts() },
    { name: 'restaurant', collection: await restaurant() },
    { name: 'reviews', collection: await reviews() },
    { name: 'ratings', collection: await ratings() },
    { name: 'safetyIncidents', collection: await safetyIncidents() },
    { name: 'banned', collection: await banned() }
  ];

  for (const { name, collection } of collections) {
    await collection.deleteMany({});
    console.log(`Cleared ${name} collection`);
  }
};

const seedUsers = async () => {
  const usersToInsert = [
    {
      firstName: 'Tofu', 
      lastName: 'McSoy', 
      userName: 'tofumc',
      emailAddress: 'tofu.mcsoy@example.com', 
      password: 'Vegan4Life!',
      restrictions: ['gluten', 'vegetarian'], 
      role: 'user'
    },
    {
      firstName: 'Bacon', 
      lastName: 'Lover', 
      userName: 'baconfan',
      emailAddress: 'bacon.lover@example.com', 
      password: 'MeatLover99!',
      restrictions: ['none'], 
      role: 'user'
    },
    {
      firstName: 'Kale', 
      lastName: 'Crunch', 
      userName: 'kaleslayer',
      emailAddress: 'kale.crunch@example.com', 
      password: 'GreenPower1!',
      restrictions: ['dairyfree', 'vegan'], 
      role: 'user'
    },
    {
      firstName: 'Cheesy', 
      lastName: 'Gordita', 
      userName: 'cheesyg',
      emailAddress: 'cheesy.g@example.com', 
      password: 'TacoTuesday1!',
      restrictions: ['vegetarian'], 
      role: 'user'
    },
    {
      firstName: 'Pasta', 
      lastName: 'Alfredo', 
      userName: 'pastalover',
      emailAddress: 'pasta.alfredo@example.com', 
      password: 'CarbsAreLife3!',
      restrictions: ['none'], 
      role: 'user'
    },
    {
      firstName: 'Quinoa', 
      lastName: 'Queen', 
      userName: 'quinoaq',
      emailAddress: 'quinoa.queen@example.com', 
      password: 'SuperGrain1!',
      restrictions: ['gluten', 'vegan'], 
      role: 'user'
    },
    {
      firstName: 'Burger', 
      lastName: 'King', 
      userName: 'burgermonarch',
      emailAddress: 'burger.king@example.com', 
      password: 'WhopperTime2!',
      restrictions: ['none'], 
      role: 'user'
    },
    {
      firstName: 'Gordon', 
      lastName: 'Ramsay', 
      userName: 'gordonr',
      emailAddress: 'gordon.ramsay@example.com', 
      password: 'IdiotSandwich1!',
      restrictions: ['none'], 
      role: 'admin'
    },
    {
      firstName: 'Guy', 
      lastName: 'Fieri', 
      userName: 'guyf',
      emailAddress: 'guy.fieri@example.com', 
      password: 'Flavortown123!',
      restrictions: ['none'], 
      role: 'admin'
    },
    {
      firstName: 'Ratatouille', 
      lastName: 'Rat', 
      userName: 'remytherat',
      emailAddress: 'remy.rat@example.com', 
      password: 'AnyoneCanCook1!',
      restrictions: ['none'], 
      role: 'admin'
    },
    {
      firstName: 'Uncle', 
      lastName: 'Roger', 
      userName: 'uncler',
      emailAddress: 'uncle.roger@example.com', 
      password: 'Haiyaa123!',
      restrictions: ['none'],
      role: 'admin'
    },
    {
      firstName: 'Chef', 
      lastName: 'Boyardee', 
      userName: 'chefb',
      emailAddress: 'chef.boyardee@example.com', 
      password: 'CannedPasta1!',
      restrictions: ['none'], 
      role: 'admin'
    }
  ];

  const insertedUsers = [];
  for (const user of usersToInsert) {
    try {
      const result = await userFuncs.createUser(
        user.firstName,
        user.lastName,
        user.userName,
        user.emailAddress,
        user.password,
        user.restrictions,
        user.role
      );
      insertedUsers.push(result);
      console.log(`Inserting ${user.userName}:`, result.insertedUser);
    } catch (err) {
      console.error(`Error inserting ${user.userName}:`, err);
    }
  }

  return await userFuncs.getAllUsers();
};

const seedRestaurants = async () => {
  const restaurantsToInsert = [
    {
      name: 'The Spaghetti Incident', 
      address: '123 Noodle Lane, Pasta Town',
      cuisine: 'Italian', 
      diet: ['vegetarian', 'gluten-free'],
      qualRating: 4.2, 
      safetyRating: 4.5, 
      accessRating: 3.8
    },
    {
      name: 'Carbonara Crime Scene', 
      address: '456 Alfredo Ave, Sauce City',
      cuisine: 'Italian', 
      diet: ['vegetarian'],
      qualRating: 3, 
      safetyRating: 4, 
      accessRating: 4
    },
    {
      name: 'Avocado Toast Conspiracy', 
      address: '789 Millennial Blvd, Hipster Ville',
      cuisine: 'Vegan', 
      diet: ['vegan', 'gluten-free', 'dairy-free'],
      qualRating: 4, 
      safetyRating: 4, 
      accessRating: 4
    },
    {
      name: 'Tempeh Tantrum', 
      address: '321 Soy Street, Plantville',
      cuisine: 'Vegan', 
      diet: ['vegan', 'organic'],
      qualRating: 4, 
      safetyRating: 4, 
      accessRating: 4
    },
    {
      name: 'The Heart Attack Grill', 
      address: '555 Cholesterol Circle, Grease Town',
      cuisine: 'American', 
      diet: [],
      qualRating: 3, 
      safetyRating: 3, 
      accessRating: 3
    },
    {
      name: 'Bacon Me Crazy', 
      address: '777 Main St, Carnivore City',
      cuisine: 'American', 
      diet: [],
      qualRating: 4, 
      safetyRating: 3, 
      accessRating: 3
    },
    {
      name: 'Wok This Way', 
      address: '888 Stir Fry Street, Wokville',
      cuisine: 'Chinese', 
      diet: ['vegetarian'],
      qualRating: 4, 
      safetyRating: 4, 
      accessRating: 4
    },
    {
      name: 'Sushi Intervention', 
      address: '999 Raw Fish Road, Wasabi Town',
      cuisine: 'Japanese', 
      diet: ['pescatarian'],
      qualRating: 4, 
      safetyRating: 4, 
      accessRating: 4
    },
    {
      name: 'Taco Yummy', 
      address: '222 Guac Lane, Salsa City',
      cuisine: 'Mexican', 
      diet: ['vegetarian', 'gluten-free'],
      qualRating: 4, 
      safetyRating: 4, 
      accessRating: 3
    },
    {
      name: 'Nacho Average Cantina', 
      address: '333 Cheese Blvd, Queso Town',
      cuisine: 'Mexican', 
      diet: [],
      qualRating: 4, 
      safetyRating: 3, 
      accessRating: 4
    },
    {
      name: 'Pho Real', 
      address: '444 Noodle Street, Broth City',
      cuisine: 'Vietnamese', 
      diet: ['gluten-free'],
      qualRating: 4, 
      safetyRating: 4, 
      accessRating: 4
    },
    {
      name: 'Curry In A Hurry', 
      address: '555 Spice Road, Flavor Town',
      cuisine: 'Indian', 
      diet: ['vegetarian', 'vegan'],
      qualRating: 4, 
      safetyRating: 4, 
      accessRating: 3
    },
    {
      name: 'The Falafel Waffle', 
      address: '666 Chickpea Lane, Hummus Heights',
      cuisine: 'Mediterranean', 
      diet: ['vegetarian', 'vegan'],
      qualRating: 4, 
      safetyRating: 4, 
      accessRating: 4
    },
    {
      name: 'Seoul Food', 
      address: '777 Kimchi Avenue, Gangnam District',
      cuisine: 'Korean', 
      diet: ['gluten-free'],
      qualRating: 4, 
      safetyRating: 4, 
      accessRating: 4
    },
    {
      name: 'Kale Yeah!', 
      address: '888 Superfood Street, Health Haven',
      cuisine: 'Health Food', 
      diet: ['vegan', 'gluten-free', 'organic'],
      qualRating: 4, 
      safetyRating: 4, 
      accessRating: 4
    }
  ];

  const insertedRestaurants = [];
  for (const restaurant of restaurantsToInsert) {
    try {
      const result = await postFunctions.createPost(
        restaurant.name,
        restaurant.address,
        restaurant.cuisine,
        restaurant.diet,
        restaurant.qualRating,
        restaurant.safetyRating,
        restaurant.accessRating,
        0, // incidentOccurred
        [], // incidentComment
        []  // reviews
      );
      insertedRestaurants.push(result);
      console.log(`Inserted restaurant: ${restaurant.name}`);
    } catch (err) {
      console.error(`Error inserting ${restaurant.name}:`, err);
    }
  }

  return await postFunctions.getAllPosts();
};

const seedReviews = async (users, restaurants) => {
  console.log('Starting to seed reviews directly with data functions...');
  
  const reviewsToInsert = [
    {
      userId: users[0]._id,
      restaurantId: restaurants[0]._id,
      comment: 'The spaghetti was so good I almost forgot about the incident! Perfect for vegetarians like me.',
    },
    {
      userId: users[1]._id,
      restaurantId: restaurants[0]._id,
      comment: 'I came for the pasta, stayed for the crime scene ambiance. 10/10 would dine again.',
    },
    {
      userId: users[2]._id,
      restaurantId: restaurants[2]._id,
      comment: 'The avocado toast cured my depression but ruined my bank account. Worth it!',
    },
    {
      userId: users[3]._id,
      restaurantId: restaurants[2]._id,
      comment: 'I don\'t usually like vegan food but this place made me question all my life choices.',
    },
    {
      userId: users[4]._id,
      restaurantId: restaurants[4]._id,
      comment: 'I had to sign a waiver before eating here. The burger was good but I can feel my arteries clogging.',
    },
    {
      userId: users[0]._id,
      restaurantId: restaurants[4]._id,
      comment: 'The defibrillator on the wall really adds to the dining experience.',
    },
    {
      userId: users[1]._id,
      restaurantId: restaurants[6]._id,
      comment: 'The food was so good I wok-ed in and wok-ed out with a full belly!',
    },
    {
      userId: users[2]._id,
      restaurantId: restaurants[7]._id,
      comment: 'The sushi was so fresh the fish was still writing its will.',
    },
    {
      userId: users[3]._id,
      restaurantId: restaurants[8]._id,
      comment: 'I came here to taco bout my feelings and left with a full stomach and empty wallet.',
    },
    {
      userId: users[4]._id,
      restaurantId: restaurants[9]._id,
      comment: 'These nachos were nacho average nachos - they were extraordinary!',
    },
    {
      userId: users[5]._id,
      restaurantId: restaurants[10]._id,
      comment: 'The pho broth was simmered to perfection. I could taste generations of family secrets.',
    },
    {
      userId: users[6]._id,
      restaurantId: restaurants[11]._id,
      comment: 'The spice level was perfect - made me cry tears of joy and pain simultaneously.',
    },
    {
      userId: users[0]._id,
      restaurantId: restaurants[12]._id,
      comment: 'Best falafel in town! Crispy outside, fluffy inside. A vegetarian dream.',
    },
    {
      userId: users[1]._id,
      restaurantId: restaurants[13]._id,
      comment: 'The bibimbap was so authentic I felt transported to Seoul.',
    },
    {
      userId: users[2]._id,
      restaurantId: restaurants[14]._id,
      comment: 'Never thought i say this, but this kale smoothie changed my life for the better.',
    }
  ];

  for (const review of reviewsToInsert) {
    try {
      await createReview(
        review.userId,
        review.restaurantId,
        review.comment
      );
      console.log(`Added review for restaurant ID ${review.restaurantId}`);
    } catch (err) {
      console.error(`Error creating review:`, err);
    }
  }
};

const seedIncidents = async (users, restaurants) => {
  console.log('Starting to seed incidents directly with data functions...');
  
  const incidentsToInsert = [
    {
      reporterId: users[0]._id,
      restaurantId: restaurants[0]._id,
      location: restaurants[0].address,
      description: 'Found actual spaghetti incident in the kitchen - noodles everywhere!',
      severity: 'moderate'
    },
    {
      reporterId: users[1]._id,
      restaurantId: restaurants[1]._id,
      location: restaurants[1].address,
      description: 'Carbonara was so slimy it slid off my plate and onto my lap.',
      severity: 'low'
    },
    {
      reporterId: users[2]._id,
      restaurantId: restaurants[2]._id,
      location: restaurants[2].address,
      description: 'Avocado toast was $25! That\'s a safety issue for my wallet.',
      severity: 'high'
    },
    {
      reporterId: users[3]._id,
      restaurantId: restaurants[3]._id,
      location: restaurants[3].address,
      description: 'The veggies were soaked in meat juice despite being advertised as vegan-friendly.',
      severity: 'moderate'
    },
    {
      reporterId: users[4]._id,
      restaurantId: restaurants[4]._id,
      location: restaurants[4].address,
      description: 'Actual heart attack occurred - ambulance took 20 minutes because they thought it was part of the theme.',
      severity: 'high'
    },
    {
      reporterId: users[5]._id,
      restaurantId: restaurants[5]._id,
      location: restaurants[5].address,
      description: 'Undercooked bacon caused severe food poisoning - spent the next day regretting my life choices.',
      severity: 'moderate'
    },
    {
      reporterId: users[6]._id,
      restaurantId: restaurants[6]._id,
      location: restaurants[6].address,
      description: 'Kitchen had thick black smoke coming out of it, staff acted like it was normal.',
      severity: 'high'
    },
    {
      reporterId: users[0]._id,
      restaurantId: restaurants[7]._id,
      location: restaurants[7].address,
      description: 'Raw fish left out at room temperature for hours before serving.',
      severity: 'high'
    },
    {
      reporterId: users[1]._id,
      restaurantId: restaurants[8]._id,
      location: restaurants[8].address,
      description: 'Got into heated debate about whether tacos need lettuce - tables were flipped.',
      severity: 'low'
    },
    {
      reporterId: users[2]._id,
      restaurantId: restaurants[9]._id,
      location: restaurants[9].address,
      description: 'Nacho cheese was rotten yellow mixed with green mold - server said it was "artisanal."',
      severity: 'moderate'
    },
    {
      reporterId: users[3]._id,
      restaurantId: restaurants[10]._id,
      location: restaurants[10].address,
      description: 'Found small metal piece in my pho bowl. Staff apologized but didn\'t comp the meal.',
      severity: 'high'
    },
    {
      reporterId: users[4]._id,
      restaurantId: restaurants[11]._id,
      location: restaurants[11].address,
      description: 'Chef sneezed directly into the curry pot. Continued stirring like nothing happened.',
      severity: 'moderate'
    },
    {
      reporterId: users[5]._id,
      restaurantId: restaurants[12]._id,
      location: restaurants[12].address,
      description: 'Bathroom had no soap or paper towels. Staff said they\'ve been out for weeks.',
      severity: 'moderate'
    },
    {
      reporterId: users[6]._id,
      restaurantId: restaurants[13]._id,
      location: restaurants[13].address,
      description: 'Kimchi smelled like it had been fermenting since the Joseon Dynasty - not in a good way.',
      severity: 'low'
    },
    {
      reporterId: users[0]._id,
      restaurantId: restaurants[14]._id,
      location: restaurants[14].address,
      description: 'Employee admitted they don\'t wash the blenders between smoothies "to save water".',
      severity: 'high'
    }
  ];

  for (const incident of incidentsToInsert) {
    try {
      await reportIncident(
        incident.reporterId,
        incident.location,
        incident.description,
        incident.severity,
        incident.restaurantId
      );
      console.log(`Added incident for restaurant ID ${incident.restaurantId}`);
    } catch (err) {
      console.error(`Error creating incident:`, err);
    }
  }
};

// Run the seed
seedDatabase();