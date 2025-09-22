import express from "express"
import { addPromotion, deletePromotion, getAllPromotions, updatePromotion ,getPromotionStatistics, getKM} from "../controller/promotions.js";


const promotionRoute = express.Router();

promotionRoute.get("/",getAllPromotions);
promotionRoute.post('/add',addPromotion);
promotionRoute.delete(`/delete/:id`,deletePromotion)
promotionRoute.put('/update/:id',updatePromotion)
promotionRoute.get('/statistics',getPromotionStatistics)
promotionRoute.get('/km',getKM)
export default promotionRoute;