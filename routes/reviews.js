
import { Router } from 'express';
import { createReview, getReviewsByEntityId } from '../data/reviews.js';

const router = Router();

router.get('/:entityId', async (req, res) => {
  try {
    const reviews = await getReviewsByEntityId(req.params.entityId);
    res.render('reviews', { reviews });
  } catch (e) {
    res.status(500).render('error', { error: e.toString() });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, entityId, rating, comment } = req.body;
    await createReview(userId, entityId, parseInt(rating), comment);
    res.redirect(`/reviews/${entityId}`);
  } catch (e) {
    res.status(400).render('error', { error: e.toString() });
  }
});

export default router;
