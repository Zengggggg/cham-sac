/**
* Anh em Twobars: Giang Dam, Louis, Antonie was here
* All our efforts are for a brighter future, where we can freely eat bread and drink bubble tea without worrying about someone stealing it.
* Updated by Louis on 2026-06-16
*/
import express from 'express';

const router = express.Router();

router.get('/status', (req, res) => {
    res.status(200).json({ message: 'API HerDays is running' });
});

export default router;