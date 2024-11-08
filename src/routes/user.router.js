import { Router } from "express";
import {
    loginUser,
    logoutUser,
    registerUser,
    changeCurrentPassword,
    getCurrentUser,
    forgotPassword,
    newPassword,
    getAllUsers,
    userActivationToggle,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { tokenCheckMiddleware } from "../middlewares/tokenCheck.middleware.js";
import { Admincheck } from "../middlewares/adminCheck.middleware.js";


const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/forgot-password").post(forgotPassword)
router.route("/new-password").get((req, res) => {
    const { token } = req.query
    res.render("new-password", { token })
}).post(tokenCheckMiddleware, newPassword)

//secured routes
router.route("/all-users").get(verifyJWT, Admincheck, getAllUsers)
router.route("/activation-toggle").post(verifyJWT, Admincheck, userActivationToggle)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)



export default router