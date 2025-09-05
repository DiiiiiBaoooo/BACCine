import express from "express"
import { facebookLogin, login, logout, signup, updateProfile } from "../controller/Auth.js";
import { protectRoute } from "../middleware/protectRoute.js";

import { googleLogin } from "../controller/Auth.js";

const AuthRoute = express.Router();

AuthRoute.post('/signup',signup)
AuthRoute.post("/login",login)
AuthRoute.post("/logout",logout)
AuthRoute.post("/google",googleLogin)
AuthRoute.post("/facebook", facebookLogin);
AuthRoute.post("/onboarding", protectRoute ,updateProfile)
AuthRoute.get("/me",protectRoute,(req,res)=>{
    res.status(200).json({success:true,user:req.user})
})
export default AuthRoute