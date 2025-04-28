import { Router } from 'express';
import { ObjectId } from 'mongodb';
const router = Router();
import userFunctions from '../data/users.js';
import userHelpers from '../validation.js';
import { reviews } from '../config/mongoCollections.js';
import xss from 'xss';

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

      if (!registerdUser || Object.keys(registerdUser).length === 0) {
        return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
      }

      try {
        registerdUser.firstNameInput = xss(userHelpers.nameHelper(registerdUser.firstNameInput, 'First Name'));
        registerdUser.lastNameInput = xss(userHelpers.nameHelper(registerdUser.lastNameInput, 'Last Name'));
        registerdUser.userNameInput = xss(userHelpers.nameHelper(registerdUser.userNameInput, 'Username'));
        registerdUser.emailAddressInput = xss(userHelpers.emailHelper(registerdUser.emailAddressInput, 'Email'));
        registerdUser.passwordInput = xss(userHelpers.passwordHelper(registerdUser.passwordInput, 'Password'));

        if (registerdUser.confirmPasswordInput !== registerdUser.passwordInput) {
          return res.status(400).json({ success: false, message: 'Passwords do not match.' });
        }

        if (!Array.isArray(registerdUser.restrictionsInput)) {
          throw 'Restrictions input must be an array.';
        }

        if (registerdUser.restrictionsInput.length > 1 && registerdUser.restrictionsInput.includes('none')) {
          throw 'You cannot select "none" with other restrictions.';
        }

        if (registerdUser.restrictionsInput.includes('allergy')) {
          if (!registerdUser.otherAllergyInput || registerdUser.otherAllergyInput.trim() === '') {
            throw 'You must select at least one restriction.';
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
        message: e instanceof TypeError ? 'Internal Server Error.' : e
      });
    }
  })
  .post(async (req, res) => {
    try {
      const logedInUser = req.body;

      if (!logedInUser || Object.keys(logedInUser).length === 0) {
        return res.status(400).json({ success: false, message: 'All fields must be filled.' });
      }

      try {
        logedInUser.emailAddressInput = xss(userHelpers.emailHelper(logedInUser.emailAddressInput, 'Email'));
        logedInUser.passwordInput = xss(userHelpers.passwordHelper(logedInUser.passwordInput, 'Password'));
      } catch (e) {
        return res.status(400).json({ success: false, message: e });
      }

      const newUserLogin = await userFunctions.loginUser(
        logedInUser.emailAddressInput,
        logedInUser.passwordInput
      );

      if (newUserLogin === false) {
        return res.status(400).json({ success: false, message: 'Either the email address or password is invalid.' });
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

      const getUser = await userFunctions.getUserById(user._id);

      return res.render('profile', {
        _id: getUser._id,
        firstName: xss(getUser.firstName),
        lastName: xss(getUser.lastName),
        userName: xss(getUser.userName),
        emailAddress: xss(getUser.emailAddress),
        reviews: getUser.reviews,
        comments: getUser.comments,
        restrictions: getUser.restrictions,
        otherAllergy: xss(getUser.otherAllergy),
        currentTime,
        role: xss(getUser.role),
        isAdmin: getUser.role === 'admin'
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

    if (id === user._id.toString()) {
      return res.redirect('/profile');
    }

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
        firstName: xss(getUser.firstName),
        lastName: xss(getUser.lastName),
        userName: xss(getUser.userName),
        emailAddress: xss(getUser.emailAddress),
        reviews: getUser.reviews,
        comments: getUser.comments,
        restrictions: getUser.restrictions,
        otherAllergy: xss(getUser.otherAllergy),
        currentTime,
        role: xss(getUser.role),
        isAdmin: user.role === 'admin',
        banOps: true
      });
    } else {
      return res.status(403).render('error', {
        error: true,
        statusCode: 403,
        message: 'Unauthorized: Must be an admin to see user profiles.'})
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
.route('/profile/edit/:id')
.get(async (req, res) => {

  try {
    const id = req.params.id;
    const user = req.session.user;

    if(user.role === 'admin') {
      res.render('profile', {isAdmin: true});
    } else if (user.role === 'user') {
      res.render('profile', {isAdmin: false});
    }

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
    const id = req.params.id;
    const user = req.session.user;

    if (!user) {
      return res.status(403).render('error', { error: true, message: 'You must be logged in to edit your profile.' });
    }

    const formData = req.body;
    const currentUser = await userFunctions.getUserById(id);

    if (!currentUser) {
      return res.status(404).render('error', { error: true, statusCode: 404, message: 'User not found' });
    }

    const firstNameInput = xss(formData.firstNameInput?.trim());
    const lastNameInput = xss(formData.lastNameInput?.trim());
    const userNameInput = xss(formData.userNameInput?.trim());
    const emailAddressInput = xss(formData.emailAddressInput?.trim());
    const passwordInput = xss(formData.passwordInput?.trim());
    const confirmPasswordInput = xss(formData.confirmPasswordInput?.trim());
    let restrictions = formData.restrictionsInput || currentUser.restrictions;
    let role = formData.roleInput || currentUser.role;

    if (typeof restrictions === 'string') {
      restrictions = [restrictions];
    }

    try {
      const validatedFirst = userHelpers.nameHelper(firstNameInput || currentUser.firstName, 'First Name');
      const validatedLast = userHelpers.nameHelper(lastNameInput || currentUser.lastName, 'Last Name');
      const validatedUser = userHelpers.nameHelper(userNameInput || currentUser.userName, 'Username');
      const validatedEmailAddress = userHelpers.emailHelper(emailAddressInput || currentUser.emailAddress, 'Email');

      let finalPassword = currentUser.password;
      let newPassword = true;

      if (passwordInput || confirmPasswordInput) {
        if (passwordInput !== confirmPasswordInput) {
          return res.status(400).render('error', { error: true, message: 'Passwords do not match.' });
        }
        const validatedPassword = userHelpers.passwordHelper(passwordInput, 'Password');
        finalPassword = validatedPassword;
        newPassword = false;
      }

      if (restrictions.includes('allergy')) {
        const other = xss(formData.otherAllergyInput?.trim());
        if (!other) throw 'Please specify other allergies.';
        const otherAllergies = other
          .split(',')
          .map(a => a.trim().toLowerCase())
          .filter(a => a.length > 0);
        restrictions = [...new Set([...restrictions, ...otherAllergies])];
      }

      restrictions = userHelpers.restrictionsHelper(restrictions);

      if (user.role !== 'admin') {
        role = currentUser.role;
      } else {
        role = userHelpers.roleHelper(role);
      }

      const updatedUser = await userFunctions.updateUser(
        id,
        validatedFirst,
        validatedLast,
        validatedUser,
        validatedEmailAddress,
        finalPassword,
        newPassword,
        restrictions,
        role
      );

      if (updatedUser.updatedUser === true) {
        req.session.user = updatedUser.updateInfo;
        return res.redirect('/profile');
      } else {
        return res.status(400).render('error', {
          error: true,
          statusCode: 400,
          message: 'Could not update profile.'
        });
      }

    } catch (e) {
      return res.status(400).render('error', { error: true, message: e });
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
        message: 'Unauthorized: Must be an admin to see user profiles.'})
    }
  } catch (e) {
    return res.status(500).render('error', {
      error: true,
      statusCode: 500,
      message: e instanceof TypeError ? 'Internal Server Error' : e
    });
  }
});

router.route('/admin/ban/:id').post(async (req, res) => {
  try{
    const id = xss(req.params.id);
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
        req.session.message = {type: 'success', text: 'User successfully banned.'};
        return res.redirect('/admin');
      } else {
        req.session.message = {type: 'error', text: 'Could not ban user, check ban list.'};
        return res.redirect('/admin');
      }

    } else {
      return res.status(403).render('error', {
        error: true,
        statusCode: 403,
        message: 'Unauthorized: Must be an admin to see user profiles.'})
    }
  } catch (e) {
    return res.status(500).render('error', {
      error: true,
      statusCode: 500,
      message: e instanceof TypeError ? 'Internal Server Error' : e 
    });
  }
});


router.route('/admin/unban/:id').post(async (req, res) => {
  try{
    const id = xss(req.params.id);
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
        req.session.message = {type: 'success', text: 'User successfully unbanned.'};
        return res.redirect('/admin');
      } else {
        req.session.message = {type: 'error', text: 'Could not unban user, check user list.'};
        return res.redirect('/admin');
      }

    } else {
      return res.status(403).render('error', {
        error: true,
        statusCode: 403,
        message: 'Unauthorized: Must be an admin to see user profiles.'})
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

      const userList = allUsers
      .filter(u => u._id.toString() !== user._id.toString())
      .map(u => ({
        _id: xss(u._id),
        firstName: xss(u.firstName),
        lastName: xss(u.lastName),
        userName: xss(u.userName),
        emailAddress: xss(u.emailAddress),
        reviews: xss(u.reviews),
        comments: xss(u.comments),
        restrictions: xss(u.restrictions),
        otherAllergy: xss(u.otherAllergy),
        role: xss(u.role)
      }));

      const banList = await userFunctions.checkBanList();
      const userBanList = banList.map(b => ({
        _id: xss(b._id),
        userName: xss(b.userName),
        emailAddress: xss(b.emailAddress),
        role: xss(b.role)
      }));

      req.session.message = null; //clear before sending to client

      return res.render('admin', {
        _id: xss(user._id),
        firstName: xss(user.firstName),
        lastName: xss(user.lastName),
        userName: xss(user.userName),
        emailAddress: xss(user.emailAddress),
        reviews: xss(user.reviews),
        comments: xss(user.comments),
        restrictions: xss(user.restrictions),
        otherAllergy: xss(user.otherAllergy),
        currentTime,
        role: xss(user.role),
        isAdmin: user.role === 'admin',
        allusers: userList,
        banList: userBanList,
        message: message
      });
    }

    return res.status(403).render('error', {error: true, statusCode: 403, message: 'You do not have access to this page.'});
  } catch (e) {
    return res.status(500).render('error', {
      error: true,
      statusCode: 500,
      message: e instanceof TypeError ? 'Internal Server Error' : e
    });
  }
});

router.route('/profile/delete/:id').post(async (req, res) => { //Could not use .delete, so using .post
  try{
    const id = xss(req.params.id);
    const user = req.session.user;

    if (user) {

      try {
        userHelpers.dataExists(id);
        userHelpers.isDataString(id);
        userHelpers.isSpaces(id);
      } catch (e) {
        return res.status(400).render('error', {error: true, statusCode: 400, message: e});
      }

      if (user.role === 'user') {
        const deleteProfile = await userFunctions.deleteUserById(id);   

        if (deleteProfile.deleted === true) {
          req.session.destroy();
          return res.render('logout', {deletedProfile: true});
        } else {
          return res.status(500).render('error', {error: true, statusCode: 500, message: 'Could not delete your account.'});
        }

      } else if (user.role === 'admin') {

        if (id === user._id){
          const deleteProfile = await userFunctions.deleteUserById(id);   

          if(deleteProfile.deleted === true) {
            req.session.destroy();
            return res.render('logout', {deletedProfile: true});
          }
        } else if(id !== user._id){

          const deleteProfile = await userFunctions.deleteUserById(id); 

          if(deleteProfile.deleted === true) {
            req.session.message = {type: 'success', text: `User with id ${deleteProfile.id} was deleted`};
            return res.redirect('/admin');
          }

        } else {
          return res.status(500).render('error', {error: true, statusCode: 500, message: 'Could not delete your account.'});
        }
      }
    }

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