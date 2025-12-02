import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: "Bookmarks route works" });
});

export default router;