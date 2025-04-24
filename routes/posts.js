import {Router} from 'express';
const router = Router();
import postFunctions from '../data/posts.js';

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
      const posts = await postFunctions.getAllPosts();
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
  const { name, address, cuisine, diet} = req.body;

  if (!name || !address || !cuisine || !diet) {
    return res.status(400).render('error', {
      error: 'Validation Error',
      statusCode: 400,
      message: 'Name, address, and cuisine are required fields.'
    });
  }

  const result = await postFunctions.createPost(
    name,
    address,
    cuisine,
    diet,
    0, 
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
.delete(async (req, res) => {
    //implement DELETE/userId
})
.put(async (req, res) => {
    //implement PUT/userId
})

router.route('/:postId/rate').get(async (req, res) => {
  try{
    const id = req.params.postId;
    const post = await postFunctions.getPostById(id);
    res.render('rate', { post });
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
    const postId = req.params.postId;
    const { qualRating, safetyRating, accessRating} = req.body;

  if (!qualRating || !safetyRating || !accessRating) {
    return res.status(400).render('error', {
      error: 'Validation Error',
      statusCode: 400,
      message: 'All ratings are required fields.'
    });
  }

  if (qualRating < 1 || qualRating > 5 || safetyRating < 1|| safetyRating > 5 || accessRating < 1 || accessRating > 5) {
    return res.status(400).render('error', {
      error: 'Validation Error',
      statusCode: 400,
      message: 'Rating must be between 1 and 5.'
    });
  }

  const result = await postFunctions.postRating(postId, qualRating, safetyRating, accessRating);

    if (result.success) {
      return res.redirect(`/posts/${postId}`); // Redirect to the post page
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
      message: e instanceof TypeError ? 'Internal Server Error' : e
    });
  }
})

export default router;