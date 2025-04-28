import bcrypt from 'bcryptjs';
import {ObjectId} from 'mongodb';

const userPasswordHash = async (plainTextPassword) => {
  
  plainTextPassword = trimStr(plainTextPassword);

  const saltRounds = 16;
  const hash = await bcrypt.hash(plainTextPassword, saltRounds);
  return hash;
}

const userPasswordCompare = async (inputPassword, hash) => {
  
  inputPassword = trimStr(inputPassword);

  const comparePassword = await bcrypt.compare(inputPassword, hash);
  return comparePassword;
}

const dataExists = (data, variable) => {
  if(data == undefined) {
    throw `${variable} does not exists.`
  }
}

const isDataString = (data, variable) => {
  if (typeof data !== 'string') {
    throw `${variable} must be a string`
  }
}

const isSpaces = (data, variable) => {
  if (data.length === 0) {
    throw `${variable} can't be empty`
  }

  if (data.trim() === '') {
    throw `${variable} can't be spaces`
  }

  if (/\s/.test(data)) {
    throw `${variable} can't have spaces`
  }
}

const isArr = (data, variable) => {
  if(!Array.isArray(data)) {
      throw `${variable} must be an array`
  }
}

const isObjId = (data, variable) => {
  if (!ObjectId.isValid(data)) {
    throw `${variable} is not an ObjectID`
  }
}

const trimStr = (data) => {
  let trimData = data.trim();
  return trimData;
}

const nameHelper = (data, variable) => {
  isDataString(data, variable);
  isSpaces(data, variable);
  data = trimStr(data);

  if (variable !== 'Username') {
    if (/\d/.test(data)) {
      throw `${variable} can't have numbers`
    }
  }

  if (data.length > 2 && data.length <= 25) {
    return data;
  } else {
    throw `${variable} has to be more than 2 characters long, with a max of 25`
  }
}

const emailHelper = (data, variable) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  data = trimStr(data);
  data = data.toLowerCase();

  if (regex.test(data)) {
    return data;
  } else {
    throw `${variable} must be in the example@example.com format`
  }
}

const passwordHelper = (data, variable) => {
  isDataString(data, variable);
  isSpaces(data, variable);

  data = trimStr(data);

  if (data.length < 8) {
    throw 'Password must be 8 characters long'
  }

  if (!/[A-Z]/.test(data)) {
    throw 'Password must contain at least one upper case letter'
  }

  if (!/\d/.test(data)) {
    throw 'Password must contain at least one number'
  }

  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\\[\];'/`~]]/) {
    throw 'Password must contain at leas one special character'
  }

  return data;
}

const restrictionsHelper = (data, variable) => {
  if (!Array.isArray(data)) {
    throw `${variable} must be an array`;
  }

  const validRestrictions = [
    'lactose',
    'gluten',
    'vegetarian',
    'vegan',
    'kosher',
    'keto',
    'diabetes',
    'dairyfree',
    'lowcarb',
    'allergy',
    'none'
  ];

  const containsAllergy = data.some((r) => {
    return typeof r === 'string' && r.trim().toLowerCase() === 'allergy';
  });

  const cleanedRestrictions = data.map((r) => {
    if (typeof r !== 'string') {
      throw `${variable} values must be strings`;
    }

    const cleaned = r.trim().toLowerCase();

    if (validRestrictions.includes(cleaned)) {
      return cleaned;
    }

    if (containsAllergy && cleaned.length > 0) {
      return cleaned;
    }

    throw `${cleaned} is not a valid restriction`;
  });

  return cleanedRestrictions;
};

const roleHelper = (data) => {
  data = trimStr(data);
  data = data.toLowerCase();

  if (data === 'admin' || data === 'user') {
    return data;
  } else {
    throw 'Role must be either an admin or user'
  }
}

const postNameHelper = (data) => {
  data = trimStr(data);
  if (typeof data !== 'string') throw `${data} must be a string.`;
  if (data.length < 2 || data.length > 35) throw `${data} must be between 2 and 35 characters.`;
  return data;
};


const postAddressHelper = (data) => {
  data = trimStr(data);
  if (typeof data !== 'string') throw `${data} must be a string.`;
  if (!/^\d/.test(data)) throw 'Street address must begin with a number';
  if (/[!@#$%^&*(),.?":{}|<>_\+=\\[\];'/`~]/.test(data)) throw 'Address should not contain special characters.';

  if (data.length < 5) throw 'Street Address should be at least 5 characters long.';

  return data;
};

const avgRatingCalc = (array) => {
  if (!Array.isArray(array) || array.length === 0) return 0;
  const sum = array.reduce((acc, val) => acc + val, 0);
  return sum / array.length;
}

const incidentCounter = (array) => {
  if (!Array.isArray(array) || array.length === 0) return 0;
  return array.length;
}


const userPostFuncs = {
  dataExists,
  isDataString,
  isSpaces,
  trimStr,
  isObjId,
  isArr,
  userPasswordHash, 
  userPasswordCompare,
  dataExists, 
  nameHelper,
  emailHelper,
  passwordHelper,
  restrictionsHelper,
  roleHelper,
  postNameHelper,
  postAddressHelper,
  avgRatingCalc,
  incidentCounter
};

export default userPostFuncs;
