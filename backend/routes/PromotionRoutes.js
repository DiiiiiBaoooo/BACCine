import express from "express"
import { addPromotion, deletePromotion, getAllPromotions, updatePromotion ,getPromotionStatistics, getKM, applyPromotion} from "../controller/promotions.js";


const promotionRoute = express.Router();

promotionRoute.get("/",getAllPromotions);
promotionRoute.post('/add',addPromotion);
promotionRoute.delete(`/delete/:id`,deletePromotion)
promotionRoute.put('/update/:id',updatePromotion)
promotionRoute.get('/statistics',getPromotionStatistics)
promotionRoute.get('/km',getKM)
promotionRoute.post('/apply/:user_id',applyPromotion)
export default promotionRoute;