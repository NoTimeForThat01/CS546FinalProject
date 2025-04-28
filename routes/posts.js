import {Router} from 'express';
const router = Router();
import postFunctions from '../data/posts.js';
import userFunctions from '../data/users.js';
import xss from 'xss';

router.route('/').get(async (req, res) => {
    try {
      res.render('postlanding');
    } catch (e) {
      return res.status(500).render('error', {
        error: 'GET/',
        statusCode: 500,
        message: e instanceof TypeError ? 'Internal Server Error' : e});
    }
  });


router.route('/viewposts').get(async (req, res) => {
    try {
      const diet = req.query.diet;
      
      const posts = await postFunctions.filterPosts(diet);
      res.render('posts', { posts: posts });
    }
    catch (e) {
      return res.status(500).render('error', {
        error: 'GET /posts',
        statusCode: 500,
        message: e instanceof TypeError ? 'Internal Server Error' : e
      });
    }
})

router.route('/createpost').get(async (req, res) => {
  try {
    if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'user')) {
      return res.status(403).render('error', {
        error: 'Access Denied',
        statusCode: 403,
        message: 'You must be logged in to create a new restaurant.'
      });
    }
    return res.render('newpost');
  }
  catch(e) {
    return res.status(500).render('error', {
      error: 'GET /createpost',
      statusCode: 500,
      message: e instanceof TypeError ? 'Internal Server Error' : e
    });
  }
})

router.route('/createpost').post(async (req, res) => {
  try{
    const sanitizedInput = {
      name: xss(req.body.name),
      address: xss(req.body.address),
      cuisine: xss(req.body.cuisine),
      diet: xss(req.body.diet)
    };
  if (!sanitizedInput.name || !sanitizedInput.address || !sanitizedInput.cuisine || !sanitizedInput.diet) {
    return res.status(400).render('error', {
      error: 'Validation Error',
      statusCode: 400,
      message: 'Name, address, and cuisine are required fields.'
    });
  }

  const result = await postFunctions.createPost(
    sanitizedInput.name,
    sanitizedInput.address,
    sanitizedInput.cuisine,
    sanitizedInput.diet,
    0, 
    0, 
    0,
    [],
    []  
  );

  if(result.insertedPost) {
    return res.redirect('/posts');
  }
  else {
    return res.status(500).render('error', {
      error: 'Create Post Error',
      message: 'Could not create post.',
      statusCode: 500
    });
  }
} catch (e) {
  return res.status(500).render('error', {
    error: 'POST /createpost',
    statusCode: 500,
    message: e
  });
}
})

router.route('/searchpost').post(async (req, res) => {
    //implement POST route
})

router
.route('/:postId')
.get(async (req, res)=> {
    //implement GET/userId route
})
router.route('/:id/delete').post(async (req, res) => {
    try {
      const id = req.params.id;
      const deletePost = await postFunctions.deletePostById(id);
      res.render('postlanding');
    }
    catch(e) {
      return res.status(500).render('error', {
        error: 'DELETE /:id/delete',
        statusCode: 500,
        message: e instanceof TypeError ? 'Internal Server Error' : e
      });
    }
})
router.route('/:postId/updatepost').post(async (req, res) => {
    try{
      const id = xss(req.params.postId);
      const sanitizedInput = { 
        name: xss(req.body.name),
        address: xss(req.body.address),
        cuisine: xss(req.body.cuisine),
        diet: xss(req.body.diet)
      };
      const updatedPost = await postFunctions.updatePost(
        id,
        sanitizedInput.name,
        sanitizedInput.address,
        sanitizedInput.cuisine,
        sanitizedInput.diet
      );

      return res.render('postlanding', { post: updatedPost });
    }
    catch(e) {
      return res.status(500).render('error', {
        error: 'PUT /:postId',
        statusCode: 500,
        message: e instanceof TypeError ? 'Internal Server Error' : e
      });
    }
})

router.route('/:id/postedit').get(async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).render('error', {
        error: 'Access Denied',
        statusCode: 403,
        message: 'You must be an admin to edit restaurant information.'
      });
    }

    const id = xss(req.params.id); 
    const post = await postFunctions.getPostById(id);

    if (!post) {
      return res.status(400).render('error', {
        error: 'Validation Error',
        statusCode: 400,
        message: 'Could not find post.'
      });
    }

    res.render('postedit', { post: post });
  }
  catch(e) {
    return res.status(500).render('error', {
      error: 'GET /posts/:id/postedit',
      statusCode: 500,
      message: e instanceof TypeError ? 'Internal Server Error' : e
    });
  }
})

router.route('/:id/rate').get(async (req, res) => {
  try{
    const id = xss(req.params.id);
    const post = await postFunctions.getPostById(id);
    res.render('rate',  { post: post } );
  }
  catch (e) {
    return res.status(500).render('error', {
      error: 'GET /posts/:id/rate',
      statusCode: 500,
      message: e instanceof TypeError ? 'Internal Server Error' : e
    });
  }
})

router.route('/:postId/rate').post(async (req, res) => {
  try{
    if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'user')) {
      return res.status(403).render('error', {
        error: 'Access Denied',
        statusCode: 403,
        message: 'You must be logged in to leave a rating.'
      });
    }

    const postId = xss(req.params.postId);

    const sanitizedInput = {
      qualRating: xss(req.body.qualRating),
      safetyRating: xss(req.body.safetyRating),
      accessRating: xss(req.body.accessRating)
    };

    const result = await postFunctions.postRating(postId, sanitizedInput.qualRating, sanitizedInput.safetyRating, sanitizedInput.accessRating);

    if (result.success) {
      return res.redirect('/posts');
    } else {
      return res.status(500).render('error', {
        error: 'Rating Error',
        statusCode: 500,
        message: 'Could not update ratings.'
      });
    }
  }
  catch (e) {
    return res.status(500).render('error', {
      error: 'POST /posts/:postId/rate',
      statusCode: 500,
      essage: e instanceof TypeError ? 'Internal Server Error' : e
    });
  }
})

export default router;