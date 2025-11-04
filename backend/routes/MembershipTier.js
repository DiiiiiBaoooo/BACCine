import express from "express"
import { addMembershipTier, deleteTier, getAllMembershipTiers, getFortuneHistory, getMembership, registerMembership, spinFortune, updateMembershipTier } from "../controller/Memberships.js"

const membershiptiersRoute = express.Router()

membershiptiersRoute.get('/',getAllMembershipTiers)
membershiptiersRoute.post('/add',addMembershipTier)
membershiptiersRoute.post('/register/:user_id',registerMembership)

membershiptiersRoute.put('/update/:id',updateMembershipTier)
membershiptiersRoute.get("/:user_id",getMembership)
membershiptiersRoute.delete('/delete/:id',deleteTier)
membershiptiersRoute.post('/spin/:user_id',spinFortune)
membershiptiersRoute.get('/history/:user_id',getFortuneHistory)
export default membershiptiersRoute;