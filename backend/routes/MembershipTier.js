import express from "express"
import { addMembershipTier, deleteTier, getAllMembershipTiers, updateMembershipTier } from "../controller/Memberships.js"

const membershiptiersRoute = express.Router()

membershiptiersRoute.get('/',getAllMembershipTiers)
membershiptiersRoute.post('/add',addMembershipTier)
membershiptiersRoute.put('/update/:id',updateMembershipTier)
membershiptiersRoute.delete('/delete/:id',deleteTier)
export default membershiptiersRoute;