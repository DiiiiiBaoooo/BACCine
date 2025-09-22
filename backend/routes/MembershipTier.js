import express from "express"
import { addMembershipTier, deleteTier, getAllMembershipTiers, getMembership, registerMembership, updateMembershipTier } from "../controller/Memberships.js"

const membershiptiersRoute = express.Router()

membershiptiersRoute.get('/',getAllMembershipTiers)
membershiptiersRoute.post('/add',addMembershipTier)
membershiptiersRoute.post('/register/:user_id',registerMembership)

membershiptiersRoute.put('/update/:id',updateMembershipTier)
membershiptiersRoute.get("/:user_id",getMembership)
membershiptiersRoute.delete('/delete/:id',deleteTier)
export default membershiptiersRoute;