import express from "express"
import {  getAuthUser, login, logout, signup, updateProfile } from "../controller/Auth.js";
import { protectRoute } from "../middleware/protectRoute.js";

import { googleLogin } from "../controller/Auth.js";

const AuthRoute = express.Router();

AuthRoute.post('/signup',signup)
AuthRoute.post("/login",login)
AuthRoute.post("/logout",logout)
AuthRoute.post("/google",googleLogin)
AuthRoute.post("/onboarding", protectRoute ,updateProfile)
AuthRoute.get("/me", protectRoute, getAuthUser );
  
export default AuthRoute