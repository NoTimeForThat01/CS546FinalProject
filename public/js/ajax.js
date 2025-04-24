(function ($) {
  // Modal helpers
  function createModal(id, title, formHTML) {
    const modalHTML = `
      <div id="${id}" class="auth-modal" style="display:none;">
        <div class="modal-content">
          <h2>${title}</h2>
          ${formHTML}
          <div class="auth-message"></div>
        </div>
      </div>
    `;
    $('body').append(modalHTML);
  }

  function showModal(modalId) {
    const $modal = $('#' + modalId);
    $modal.show();
    adjustModalPosition($modal);
    $('body').addClass('modal-open');
  }

  function closeModal(modalId) {
    $('#' + modalId).hide();
    $('body').removeClass('modal-open');
  }

  function adjustModalPosition($modal) {
    $modal.find('.modal-content').css({
      'top': '50%',
      'transform': 'translateY(-50%)'
    });
  }

  function showMessage($element, text, type) {
    $element.text(text).removeClass('error success').addClass(type);
  }

  // Validation helpers
  const dataExists = (data) => {
    if (data === undefined) throw 'Data does not exist.';
    return data;
  };

  const isDataString = (data, variable) => {
    if (typeof data !== 'string') throw `${variable} must be a string`;
    return data;
  };

  const isSpaces = (data, variable) => {
    if (data.length === 0) throw `${variable} can't be empty`;
    if (data.trim() === '') throw `${variable} can't be spaces`;
    if (/\s/.test(data)) throw `${variable} can't have spaces`;
    return data;
  };

  const trimStr = (data) => {
    return data.trim();
  };

  const nameHelper = (data, variable) => {
    data = isDataString(data, variable);
    data = isSpaces(data, variable);
    data = trimStr(data);

    if (/\d/.test(data)) throw `${variable} can't have numbers`;
    if (data.length <= 2 || data.length > 25) {
      throw `${variable} has to be more than 2 characters long, with a max of 25.`;
    }
    return data;
  };

  const validateEmail = (email) => {
    email = isDataString(email, 'Email');
    email = trimStr(email).toLowerCase();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) throw 'Email must be in the example@example.com format.';
    return email;
  };

  const validatePassword = (password) => {
    password = isDataString(password, 'Password');
    password = isSpaces(password, 'Password');
    password = trimStr(password);

    if (password.length < 8) throw 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(password)) throw 'Password must have at least one uppercase letter.';
    if (!/\d/.test(password)) throw 'Password must contain at least one number.';
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\\[\];'/`~]/.test(password)) {
      throw 'Password must contain at least one special character.';
    }
    return password;
  };

  const validateUsername = (username) => {
    username = isDataString(username, 'Username');
    username = isSpaces(username, 'Username');
    username = trimStr(username);
    
    if (username.length < 3 || username.length > 20) {
      throw 'Username must be between 3 and 20 characters long.';
    }
    return username;
  };

  const restrictionsHelper = (data, variable) => {
    if (!Array.isArray(data)) throw `${variable} must be an array`;
    
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
      if (typeof r !== 'string') throw `${variable} values must be strings`;
      const cleaned = r.trim().toLowerCase();
      
      if (validRestrictions.includes(cleaned)) return cleaned;
      if (containsAllergy && cleaned.length > 0) return cleaned;
      
      throw `${cleaned} is not a valid restriction`;
    });
    
    if (cleanedRestrictions.length > 1 && cleanedRestrictions.includes('none')) {
      throw 'You cannot select "none" with other restrictions';
    }
    
    return cleanedRestrictions;
  };

  const roleHelper = (data) => {
    data = trimStr(data).toLowerCase();
    if (data === 'admin' || data === 'user') return data;
    throw 'Role must be either an admin or user.';
  };

  $(document).on('change','#restrictionsInput', function () {
    const selectedOptions = $(this).val() || [];
    if (selectedOptions.includes('allergy')) {
      $('#other-allergy-container').show();
    } else {
      $('#other-allergy-container').hide();
      $('#otherAllergyInput').val('');
    }
  });

  // Signup Modal
  if ($('.signup-btn').length) {
    createModal('signupModal', 'Create Your Account', `
      <form id="dynamicSignupForm">
        <div><label>First Name: <input type="text" name="firstNameInput" required></label></div>
        <div><label>Last Name: <input type="text" name="lastNameInput" required></label></div>
        <div><label>Username: <input type="text" name="userNameInput" required></label></div>
        <div><label>Email: <input type="email" name="emailAddressInput" required></label></div>
        <div><label>Password: <input type="password" name="passwordInput" required></label></div>
        <div><label>Confirm Password: <input type="password" name="confirmPasswordInput" required></label></div>
        <div><label>Dietary Restrictions: 
          <select name="restrictionsInput" id="restrictionsInput" multiple>
            <option value="none">None</option>
            <option value="lactose">Lactose Intolerant</option>
            <option value="gluten">Gluten Free</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="kosher">Kosher</option>
            <option value="keto">Keto</option>
            <option value="diabetes">Diabetic</option>
            <option value="dairyfree">Dairy Free</option>
            <option value="lowcarb">Low Carb</option>
            <option value="allergy">Allergies</option>
          </select>
        </label></div>
        <div id="other-allergy-container" style="display:none;">
          <label>Other Allergies (comma separated): 
            <input type="text" name="otherAllergyInput" id="otherAllergyInput">
          </label>
        </div>
        <div><label>Role: 
          <select name="roleInput">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label></div>
        <button type="submit">Register</button>
      </form>
      <p class="switch-auth">Already have an account? <a href="#" id="showLogin">Log in</a></p>
    `);

    $('.signup-btn').on('click', function (e) {
      e.preventDefault();
      showModal('signupModal');
    });
//////////////////////////////////////////////////
    $(document).on('submit', '#dynamicSignupForm', function (e) {
      e.preventDefault();
      const $form = $(this);
      const $messageDiv = $form.parent().find('.auth-message');
      $messageDiv.text('').removeClass('error success');

      try {
        const firstName = nameHelper($form.find('[name="firstNameInput"]').val(), 'First name');
        const lastName = nameHelper($form.find('[name="lastNameInput"]').val(), 'Last name');
        const userName = validateUsername($form.find('[name="userNameInput"]').val());
        const email = validateEmail($form.find('[name="emailAddressInput"]').val());
        const password = validatePassword($form.find('[name="passwordInput"]').val());
        const confirmPassword = $form.find('[name="confirmPasswordInput"]').val();
        const restrictions = $form.find('[name="restrictionsInput"]').val() || [];
        const otherAllergy = $form.find('[name="otherAllergyInput"]').val() || '';
        const role = roleHelper($form.find('[name="roleInput"]').val());

        if (password !== confirmPassword) throw 'Passwords do not match!';

        if (restrictions.length > 1 && restrictions.includes('none')) {
          throw 'You cannot select "none" with other restrictions';
        }

        if (restrictions.includes('allergy')) {
          if (!otherAllergy || otherAllergy.trim() === '') {
            throw 'You must select at least one restriction.';
          }
          
          const otherAllergies = otherAllergy
            .split(',')
            .map(allergy => allergy.trim().toLowerCase());

          restrictions.push(...otherAllergies);
        }

        restrictionsHelper(restrictions, 'Restrictions');

        const formData = {
          firstNameInput: firstName,
          lastNameInput: lastName,
          userNameInput: userName,
          emailAddressInput: email,
          passwordInput: password,
          confirmPasswordInput: confirmPassword, //Fixed bug
          restrictionsInput: restrictions,
          otherAllergyInput: otherAllergy,
          roleInput: role
        };

        $.ajax({
          method: 'POST',
          url: '/register',
          contentType: 'application/json',
          data: JSON.stringify(formData)
        }).then(function (response) {
          if (response.success) {
            showMessage($messageDiv, 'Registration successful! Redirecting...', 'success');
            setTimeout(() => {
              closeModal('signupModal');
              showModal('loginModal');
            }, 1500);
          } else {
            showMessage($messageDiv, response.message || 'Registration failed', 'error');
          }
        }).fail(function (jqXHR) {
          const errorMsg = jqXHR.responseJSON?.message || 'Registration error. Please try again.';
          showMessage($messageDiv, errorMsg, 'error');
        });

      } catch (error) {
        showMessage($messageDiv, error, 'error');
      }
    });
  }

  // Login Modal
  if ($('.login-btn').length) {
    createModal('loginModal', 'Log In', `
      <form id="dynamicLoginForm">
        <div><label>Email: <input type="email" name="emailAddressInput" required></label></div>
        <div><label>Password: <input type="password" name="passwordInput" required></label></div>
        <button type="submit">Log In</button>
      </form>
      <p class="switch-auth">Don't have an account? <a href="#" id="showSignup">Sign up</a></p>
    `);

    $('.login-btn').on('click', function (e) {
      e.preventDefault();
      showModal('loginModal');
    });

    $(document).on('submit', '#dynamicLoginForm', function (e) {
      e.preventDefault();
      const $form = $(this);
      const $messageDiv = $form.parent().find('.auth-message');
      $messageDiv.text('').removeClass('error success');

      try {
        const email = validateEmail($form.find('[name="emailAddressInput"]').val());
        const password = $form.find('[name="passwordInput"]').val();
        
        if (!password) throw 'You must provide a password';

        $.ajax({
          method: 'POST',
          url: '/login',
          contentType: 'application/json',
          data: JSON.stringify({ 
            emailAddressInput: email,
            passwordInput: password 
          })
        }).then(function (response) {
          if (response.success) {
            showMessage($messageDiv, 'Login successful! Redirecting...', 'success');
            setTimeout(() => window.location.href = response.redirect || '/', 1000);
          } else {
            showMessage($messageDiv, response.message || 'Login failed', 'error');
          }
        }).fail(function (jqXHR) {
          const errorMsg = jqXHR.responseJSON?.message || 'Login error. Please try again.';
          showMessage($messageDiv, errorMsg, 'error');
        });

      } catch (error) {
        showMessage($messageDiv, error, 'error');
      }
    });

    // Switch modal links
    $(document).on('click', '#showSignup', function (e) {
      e.preventDefault();
      closeModal('loginModal');
      showModal('signupModal');
    });

    $(document).on('click', '#showLogin', function (e) {
      e.preventDefault();
      closeModal('signupModal');
      showModal('loginModal');
    });
  }

  // Modal click behavior
  $(document).on('click', '.auth-modal', function (e) {
    if (e.target === this) closeModal(this.id);
  });

  $(document).on('click', '.modal-content', function (e) {
    e.stopPropagation();
  });

  // Navigation links
  $(document).on('click', '#login-link', function (e) {
    e.preventDefault();
    $('#main-content').load('/login');
  });

  $(document).on('click', '#register-link', function (e) {
    e.preventDefault();
    $('#login-section').load('/register');
  });

  //Redirect user to home and open login modal
  $(document).ready(function() {

    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('showLogin') === 'true') {
      showModal('loginModal');
      history.replaceState(null, '', '/');
    }
  });

})(window.jQuery);