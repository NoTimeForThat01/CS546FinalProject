import { Router } from 'express';
const router = Router();
import userFunctions from '../data/users.js';
import userHelpers from '../validation.js';
const { createUser, loginUser, getUserById } = userFunctions; 

router.route('/').get(async (req, res) => {
  try {
    const user = req.session.user;

    if (!user) {
      return res.render('home', {isNotAuthenticated: true});
    } else {
      return res.render('home', {isNotAuthenticated: false});
    }
  } catch (e) {
    return res.status(500).render('error', {
      error: true,
      statusCode: 500,
      message: e instanceof TypeError ? 'Internal Server Error' : e
    });
  }
});

router
  .route('/register')
  .get(async (req, res) => {
    try {
      return res.redirect('/'); //redirect to home so no backend handlebars needed
    } catch (e) {
      return res.status(500).render('error', {
        error: true,
        statusCode: 500,
        message: e instanceof TypeError ? 'Internal Server Error' : e
      });
    }
  })
  .post(async (req, res) => {
    try {
      const registerdUser = req.body;

      //console.log('user.js:', registerdUser);

      if (!registerdUser || Object.keys(registerdUser).length === 0) {
        return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
      }

      try {
        registerdUser.firstNameInput = userHelpers.nameHelper(registerdUser.firstNameInput, 'First Name');
        registerdUser.lastNameInput = userHelpers.nameHelper(registerdUser.lastNameInput, 'Last Name');
        registerdUser.userNameInput = userHelpers.nameHelper(registerdUser.userNameInput, 'Username');
        registerdUser.emailAddressInput = userHelpers.emailHelper(registerdUser.emailAddressInput, 'Email');
        registerdUser.passwordInput = userHelpers.passwordHelper(registerdUser.passwordInput, 'Password');

        if (registerdUser.confirmPasswordInput !== registerdUser.passwordInput) {
          return res.status(400).json({ success: false, message: 'Passwords do not match.' });
        }

        if (!Array.isArray(registerdUser.restrictionsInput)) {
          throw 'Restrictions input must be an array.';
        }

        if (registerdUser.restrictionsInput.length > 1 && registerdUser.restrictionsInput.includes('none')) {
          throw 'You cannot select "none" with other restrictions';
        }

        if (registerdUser.restrictionsInput.includes('allergy')) {
          if (!registerdUser.otherAllergyInput || registerdUser.otherAllergyInput.trim() === '') {
            throw 'You must select at least one restriction';
          }
        
          const otherAllergies = registerdUser.otherAllergyInput
          .split(',')
          .map(a => a.trim().toLowerCase())
          .filter(a => a.length > 0);
      
          registerdUser.restrictionsInput.push(...otherAllergies);
        }
        
        registerdUser.restrictionsInput = userHelpers.restrictionsHelper(registerdUser.restrictionsInput);

        registerdUser.roleInput = userHelpers.roleHelper(registerdUser.roleInput);
      } catch (e) {
        return res.status(400).json({ success: false, message: e});
      }

      const newUser = await userFunctions.createUser(
        registerdUser.firstNameInput,
        registerdUser.lastNameInput,
        registerdUser.userNameInput,
        registerdUser.emailAddressInput,
        registerdUser.passwordInput,
        registerdUser.restrictionsInput,
        registerdUser.roleInput
      );

      if (newUser.insertedUser === true) {
        return res.json({ success: true });
      } else {
        return res.status(400).json({ success: false, message: 'Email is already registered.' });
      }
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Internal Server Error:' + e });
    }
  });

router
  .route('/login')
  .get(async (req, res) => {
    try {
      return res.redirect('/'); //redirect to home so no backend handlebars needed
    } catch (e) {
      return res.status(500).render('error', {
        error: true,
        statusCode: 500,
        message: e instanceof TypeError ? 'Internal Server Error' : e
      });
    }
  })
  .post(async (req, res) => {
    try {
      const logedInUser = req.body;

      if (!logedInUser || Object.keys(logedInUser).length === 0) {
        return res.status(400).json({ success: false, message: 'All fields must be filled' });
      }

      try {
        logedInUser.emailAddressInput = userHelpers.emailHelper(logedInUser.emailAddressInput, 'Email');
        logedInUser.passwordInput = userHelpers.passwordHelper(logedInUser.passwordInput, 'Password');
      } catch (e) {
        return res.status(400).json({ success: false, message: e });
      }

      const newUserLogin = await userFunctions.loginUser(
        logedInUser.emailAddressInput,
        logedInUser.passwordInput
      );

      if (newUserLogin === false) {
        return res.status(400).json({ success: false, message: 'Either the email address or password is invalid' });
      }

      req.session.user = newUserLogin;

      if (req.session.user.role === 'admin') {
        return res.json({ success:true, redirect: '/admin' });
      } else if (req.session.user.role === 'user') {
        return res.json({ success:true, redirect: '/profile' });
      }
      
    } catch (e) {
      return res.status(500).json({ success: false, message: e instanceof TypeError ? 'Internal Server Error' : e });
    }
  });

router.route('/profile').get(async (req, res) => {
  try {
    const user = req.session.user;

    if (user) {
      const currentTime = new Date().toUTCString();

      return res.render('profile', {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        emailAddress: user.emailAddress,
        reviews: user.reviews,
        comments: user.comments,
        restrictions: user.restrictions,
        otherAllergy: user.otherAllergy,
        currentTime,
        role: user.role,
        isAdmin: user.role === 'admin'
      });
    }
  } catch (e) {
    return res.status(500).render('error', {
      error: true,
      statusCode: 500,
      message: e instanceof TypeError ? 'Internal Server Error' : e
    });
  }
});

router.route('/profile/:id').get(async (req, res) => {
  try {
    const id = req.params.id;
    const user = req.session.user;

    if (user.role === 'admin') {
      const currentTime = new Date().toUTCString();

      const getUser = await userFunctions.getUserById(id);

      try {
        userHelpers.dataExists(id);
        userHelpers.isDataString(id);
        userHelpers.isSpaces(id);
      } catch (e) {
        return res.status(400).render('error', {error: true, statusCode: 400, message: e});
      }

      return res.render('profile', {
        _id: getUser._id,
        firstName: getUser.firstName,
        lastName: getUser.lastName,
        userName: getUser.userName,
        emailAddress: getUser.emailAddress,
        reviews: getUser.reviews,
        comments: getUser.comments,
        restrictions: getUser.restrictions,
        otherAllergy: getUser.otherAllergy,
        currentTime,
        role: getUser.role,
        isAdmin: user.role === 'admin',
        banOps: true
      });
    } else {
      return res.status(403).render('error', {
        error: true,
        statusCode: 403,
        message: 'Unauthorized: Must be an admin to see user profiles'})
    }
  } catch (e) {
    return res.status(500).render('error', {
      error: true,
      statusCode: 500,
      message: e instanceof TypeError ? 'Internal Server Error' : e
    });
  }
});

router.route('/profile/banned/:id').get(async (req, res) => {
  try {
    const id = req.params.id;
    const user = req.session.user;

    if (user.role === 'admin') {
      const currentTime = new Date().toUTCString();

      const getUser = await userFunctions.getBannedUserById(id);

      try {
        userHelpers.dataExists(id);
        userHelpers.isDataString(id);
        userHelpers.isSpaces(id);
      } catch (e) {
        return res.status(400).render('error', {error: true, statusCode: 400, message: e});
      }

      return res.render('profile', {
        _id: getUser._id,
        firstName: getUser.firstName,
        lastName: getUser.lastName,
        userName: getUser.userName,
        emailAddress: getUser.emailAddress,
        reviews: getUser.reviews,
        comments: getUser.comments,
        restrictions: getUser.restrictions,
        otherAllergy: getUser.otherAllergy,
        currentTime,
        role: getUser.role,
        isAdmin: user.role === 'admin',
        banOps: true,
        banned: true
      });
    } else {
      return res.status(403).render('error', {
        error: true,
        statusCode: 403,
        message: 'Unauthorized: Must be an admin to see user profiles'})
    }
  } catch (e) {
    return res.status(500).render('error', {
      error: true,
      statusCode: 500,
      message: e instanceof TypeError ? 'Internal Server Error' : e
    });
  }
});

//TODO:implemetns ban
router.route('/admin/ban/:id').post(async (req, res) => {
  try{
    const id = req.params.id;
    const user = req.session.user;

    if (user.role === 'admin') {

      try {
        userHelpers.dataExists(id);
        userHelpers.isDataString(id);
        userHelpers.isSpaces(id);
      } catch (e) {
        return res.status(400).render('error', {error: true, statusCode: 400, message: e});
      }

      const banUser = await userFunctions.banUserById(id);

      if (banUser.banned === true) {
        req.session.message = {type: 'success', text: 'User successfully banned'};
        return res.redirect('/admin');
      } else {
        req.session.message = {type: 'error', text: 'Could not ban user, check ban lint'};
        return res.redirect('/admin');
      }

    } else {
      return res.status(403).render('error', {
        error: true,
        statusCode: 403,
        message: 'Unauthorized: Must be an admin to see user profiles'})
    }
  } catch (e) {
    return res.status(500).render('error', {
      error: true,
      statusCode: 500,
      message: e
      //instanceof TypeError ? 'Internal Server Error' : e 
    });
  }
});

//TODO:implement unban
router.route('/admin/unban/:id').post(async (req, res) => {
  try{
    const id = req.params.id;
    const user = req.session.user;

    if (user.role === 'admin') {

      try {
        userHelpers.dataExists(id);
        userHelpers.isDataString(id);
        userHelpers.isSpaces(id);
      } catch (e) {
        return res.status(400).render('error', {error: true, statusCode: 400, message: e});
      }

      const unbanUser = await userFunctions.unbanUser(id);

      if (unbanUser.unbanned === true) {
        req.session.message = {type: 'success', text: 'User successfully unbanned'};
        return res.redirect('/admin');
      } else {
        req.session.message = {type: 'error', text: 'Could not ban user, check ban lint'};
        return res.redirect('/admin');
      }

    } else {
      return res.status(403).render('error', {
        error: true,
        statusCode: 403,
        message: 'Unauthorized: Must be an admin to see user profiles'})
    }
  } catch (e) {
    return res.status(500).render('error', {
      error: true,
      statusCode: 500,
      message: e instanceof TypeError ? 'Internal Server Error' : e
    });
  }
});

router.route('/admin').get(async (req, res) => {
  try {
    const user = req.session.user;
    const message = req.session.message;

    if (user.role === 'admin') {
      const currentTime = new Date().toUTCString();

      let allUsers = await userFunctions.getAllUsers();
      const userList = allUsers.map(u => ({
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        userName: u.userName,
        emailAddress: u.emailAddress,
        reviews: u.reviews,
        comments: u.comments,
        restrictions: u.restrictions,
        otherAllergy: u.otherAllergy,
        role: u.role
      }));

      const banList = await userFunctions.checkBanList();
      const userBanList = banList.map(b => ({
        _id: b._id,
        userName: b.userName,
        emailAddress: b.emailAddress,
        role: b.role
      }));

      req.session.message = null; //clear before sending to client

      return res.render('admin', {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        emailAddress: user.emailAddress,
        reviews: user.reviews,
        comments: user.comments,
        restrictions: user.restrictions,
        otherAllergy: user.otherAllergy,
        currentTime,
        role: user.role,
        isAdmin: user.role === 'admin',
        allusers: userList,
        banList: userBanList,
        message: message
      });
    }

    return res.status(403).render('error', {error: true, statusCode: 403, message: 'You do not have access to this page'});
  } catch (e) {
    return res.status(500).render('error', {
      error: true,
      statusCode: 500,
      message: e instanceof TypeError ? 'Internal Server Error' : e
    });
  }
});

router.route('/error').get(async (req, res) => {
  try {
    return res.render('error');
  } catch (e) {
    return res.status(500).render('error', {
      error: true,
      statusCode: 500,
      message: e instanceof TypeError ? 'Internal Server Error' : e
    });
  }
});

router.route('/logout').get(async (req, res) => {
  try {
    req.session.destroy();
    return res.render('logout');
  } catch (e) {
    return res.status(500).render('error', {
      error: true,
      statusCode: 500,
      message: e instanceof TypeError ? 'Internal Server Error' : e
    });
  }
});

export default router;