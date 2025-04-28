
import { Router } from 'express';
import { createReview } from '../data/reviews.js';
import postFunctions from '../data/posts.js';
import userFunctions from '../data/users.js';
import xss from 'xss';

const router = Router();

router.post('/:postId', async (req, res) => {
  try {
    //needs to be authenticated to leave a review
    if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'user')) {
      return res.status(403).render('error', {
        error: 'Access Denied',
        statusCode: 403,
        message: 'You must be logged in to leave a review.'
      });
    }
    
    const user = req.session.user;

    const reviewUser = await userFunctions.getUserById(user._id);
    const restaurant = await postFunctions.getPostById(req.params.postId);
    
    const sanitizedInput = {
      comment: xss(req.body.comment)
    };

    const { entityId, comment } = req.body;

    await createReview( reviewUser._id, restaurant._id, sanitizedInput.comment);
    res.redirect(`/posts`);
  } catch (e) {
    res.status(400).render('error', { error: e.toString() });
  }
});

export default router;
