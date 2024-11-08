import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/').get((req, res) => res.redirect('/login'))
router.route('/login').get((req, res) => res.render('login'))
router.route('/profile').get(verifyJWT, (req, res) => res.render('profile'))
router.route('/register').get((req, res) => res.render('register'))
router.route('/forgot-password').get((req, res) => res.render('forgot-password'))

export default router   