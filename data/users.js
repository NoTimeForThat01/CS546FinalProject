import { users, banned } from '../config/mongoCollections.js';
import validationFuncs from '../validation.js';
import { ObjectId, ReturnDocument } from 'mongodb';

// Create a new user
export const createUser = async (
  firstName,
  lastName,
  userName,
  emailAddress,
  password,
  restrictions,
  role
) => {
  firstName = validationFuncs.nameHelper(firstName, 'First name');
  lastName = validationFuncs.nameHelper(lastName, 'Last name');
  emailAddress = validationFuncs.emailHelper(emailAddress, 'Email');
  userName = validationFuncs.nameHelper(userName, 'Username');
  restrictions = validationFuncs.restrictionsHelper(restrictions, 'Restrictions');
  password = validationFuncs.passwordHelper(password, 'Password');
  password = await validationFuncs.userPasswordHash(password);
  role = validationFuncs.roleHelper(role);

  const newUser = {
    firstName,
    lastName,
    userName,
    emailAddress,
    reviews: [],
    comments: [],
    restrictions,
    password,
    role
  };

  const userCollection = await users();
  const banCollection = await banned();

  const checkBan = await banCollection.findOne({emailAddress});
  if (checkBan) throw 'An account with this email is banned, please try another email';

  const checkEmail = await userCollection.findOne({ emailAddress });
  if (checkEmail) throw 'Email already in use';

  const checkUserName = await userCollection.findOne({ userName });
  if (checkUserName) throw 'Username already in use';

  const insertInfo = await userCollection.insertOne(newUser);
  if (!insertInfo.acknowledged || !insertInfo.insertedId) {
    return { insertedUser: false };
  } else {
    return { insertedUser: true };
  }
};

// Login user
export const loginUser = async (emailAddress, password) => {
  emailAddress = validationFuncs.emailHelper(emailAddress, 'Email');
  password = validationFuncs.passwordHelper(password, 'Password');

  const userCollection = await users();
  const userFound = await userCollection.findOne({ emailAddress });
  if (!userFound) throw 'Either the email address or password is invalid';

  const passwordCheck = await validationFuncs.userPasswordCompare(password, userFound.password);
  if (!passwordCheck) return false;

  return {
    _id: userFound._id.toString(),
    firstName: userFound.firstName,
    lastName: userFound.lastName,
    userName: userFound.userName,
    emailAddress: userFound.emailAddress,
    reviews: userFound.reviews,
    comments: userFound.comments,
    restrictions: userFound.restrictions,
    role: userFound.role
  };
};

// Get all users (admin only)
export const getAllUsers = async () => {
  const userCollection = await users();
  let userList = await userCollection.find({}).toArray();
  if (!userList) throw 'No users found in database';

  return userList.map((user) => ({
    ...user,
    _id: user._id.toString()
  }));
};

// Get user by ID
export const getUserById = async (userId) => {
  validationFuncs.dataExists(userId, 'User ID');
  validationFuncs.isDataString(userId, 'User ID');
  validationFuncs.isSpaces(userId, 'User ID');
  userId = validationFuncs.trimStr(userId);
  validationFuncs.isObjId(userId, 'User ID');

  const userCollection = await users();
  const user = await userCollection.findOne({ _id: new ObjectId(userId) });

  if (!user) throw `No user with ID: ${userId}`;

  user._id = user._id.toString();
  return user;
};

export const getBannedUserById = async (userId) => {
  validationFuncs.dataExists(userId, 'User ID');
  validationFuncs.isDataString(userId, 'User ID');
  validationFuncs.isSpaces(userId, 'User ID');
  userId = validationFuncs.trimStr(userId);
  validationFuncs.isObjId(userId, 'User ID');

  const banCollection = await banned();
  const banUser = await banCollection.findOne({ _id: new ObjectId(userId) });

  if (!banUser) throw `No user with ID: ${userId}`;

  banUser._id = banUser._id.toString();
  return banUser;
};

// Delete user by ID (admin or self)
export const deleteUserById = async (userId) => {
  validationFuncs.dataExists(userId, 'User ID');
  validationFuncs.isDataString(userId, 'User ID');
  validationFuncs.isSpaces(userId, 'User ID');
  userId = validationFuncs.trimStr(userId);

  if (!/^[a-z0-9-]+$/.test(userId)) {
    throw 'ID must have only lowercase characters and numbers';
  }

  validationFuncs.isObjId(userId);

  const userCollection = await users();
  const deletedUser = await userCollection.findOneAndDelete({ _id: new ObjectId(userId)});

  if (!deletedUser) {
    throw `Could not delete user with ID: ${userId}`;
  }

  return { deleted: true, id: userId };
};

//Admin ban prevolages
export const checkBanList = async () => {
  const banCollection = await banned();
  let banList = await banCollection.find({}).toArray();
  if (!banList) throw 'No users found in database';

  return banList.map((user) => ({
    ...user,
    _id: user._id.toString()
  }));
}

export const banUserById = async (userId) => {
  const getUser = await getUserById(userId);

  const banCollection = await banned();
  const banUserData = {...getUser, _id: new ObjectId(userId)};
  const bannedUser = await banCollection.insertOne(banUserData);

  if (!bannedUser.acknowledged || !bannedUser.insertedId) {
    throw `Could not ban user with ID?: ${userId}`
  }

  const delUser = await deleteUserById(userId);

  if (delUser.deleted !== true) {
    return { banned: false, id: userId};
  }

  return { banned: true, id: userId};
}

export const unbanUser = async (userId) => {
  validationFuncs.dataExists(userId, 'User ID');
  validationFuncs.isDataString(userId, 'User ID');
  validationFuncs.isSpaces(userId, 'User ID');
  userId = validationFuncs.trimStr(userId);

  if (!/^[a-z0-9-]+$/.test(userId)) {
    throw 'ID must have only lowercase characters and numbers';
  }

  validationFuncs.isObjId(userId);

  const banCollection = await banned();
  const userCollection = await users();
  
  const getUser = await banCollection.findOne({ _id: new ObjectId(userId) });

  if (!getUser) {
    throw `No banned user found with ID: ${userId}`;
  }
  
  const emailConflict = await userCollection.findOne({ emailAddress: getUser.emailAddress });
  if (emailConflict) throw 'Email already in use';
  
  const usernameConflict = await userCollection.findOne({ userName: getUser.userName });
  
  if (usernameConflict) throw 'Username already in use';
  
  const unbanUser = getUser;

  const insertInfo = await userCollection.insertOne(unbanUser);
  
  if (!insertInfo.acknowledged || !insertInfo.insertedId) {
    throw 'Failed to reinsert user into main user collection.';
  }

  const unbannedUser = await banCollection.findOneAndDelete({ _id: new ObjectId(userId)});
  
  if (!unbannedUser) {
    throw `Could not unban user with ID: ${userId}`;
  }
  
  return { unbanned: true, id: userId };
};

export const updateUser = async (
  userId,
  firstName,
  lastName,
  userName,
  emailAddress,
  password,
  newPassword,
  restrictions,
  role
) => {
  const tempArr = [userId, firstName, lastName, userName, emailAddress, password, restrictions, role];

  for(let i = 0; i < tempArr.length ; i++) {
    validationFuncs.dataExists(tempArr[i]);
  }

  validationFuncs.isObjId(userId, 'User ID');

  validationFuncs.isDataString(userId, 'User ID');
  validationFuncs.isSpaces(userId, 'User ID');
  userId = validationFuncs.trimStr(userId);

  firstName = validationFuncs.nameHelper(firstName, 'First name');
  lastName = validationFuncs.nameHelper(lastName, 'Last name');
  emailAddress = validationFuncs.emailHelper(emailAddress, 'Email');
  userName = validationFuncs.nameHelper(userName, 'Username');
  restrictions = validationFuncs.restrictionsHelper(restrictions, 'Restrictions');

  if(newPassword !== true) {
    password = validationFuncs.passwordHelper(password, 'Password');
    password = await validationFuncs.userPasswordHash(password);
  } else {
    password = password;
  }

  role = validationFuncs.roleHelper(role);
  
  const userCollection = await users();
  const banCollection = await banned();

  const getUser = await userCollection.findOne({_id: new ObjectId(userId)});

  const checkBan = await banCollection.findOne({emailAddress});
  if (checkBan) throw 'An account with this email is banned, please try another email';
  const checkEmail = await userCollection.findOne({ emailAddress, _id: { $ne: new ObjectId(userId) } });
  if (checkEmail) throw 'Email already in use';

  const checkUserName = await userCollection.findOne({ userName, _id: { $ne: new ObjectId(userId) } });
  if (checkUserName) throw 'Username already in use';

  const updateUser = {
    firstName,
    lastName,
    userName,
    emailAddress,
    reviews: getUser.reviews || [],
    comments: getUser.comments || [],
    restrictions,
    password,
    role
  };

  const updateInfo = await userCollection.findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $set: updateUser },
    { returnDocument: 'after' }
  );

  if (!updateInfo) {
    return { updatedUser: false };
  }

  updateInfo._id = updateInfo._id.toString();

  return { updatedUser: true, updateInfo: updateInfo};
};

// Helper for use in auth routes
export const getUserByEmail = async (email) => {
  email = validationFuncs.emailHelper(email, 'Email');
  const userCollection = await users();
  const user = await userCollection.findOne({ emailAddress: email });
  return user;
};

export const insertUser = async (userObj) => {
  const userCollection = await users();
  const insertInfo = await userCollection.insertOne(userObj);
  if (!insertInfo.acknowledged || !insertInfo.insertedId) {
    throw 'Could not insert user';
  }
  return { insertedUser: true };
};

const userFunctions = {
  createUser,
  loginUser,
  getAllUsers,
  getUserById,
  deleteUserById,
  banUserById,
  unbanUser,
  checkBanList,
  getBannedUserById,
  updateUser,
  getUserByEmail,
  insertUser
};

export default userFunctions;
