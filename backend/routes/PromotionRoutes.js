import express from "express"
import { addPromotion, deletePromotion, getAllPromotions, updatePromotion ,getPromotionStatistics} from "../controller/promotions.js";


const promotionRoute = express.Router();

promotionRoute.get("/",getAllPromotions);
promotionRoute.post('/add',addPromotion);
promotionRoute.delete(`/delete/:id`,deletePromotion)
promotionRoute.put('/update/:id',updatePromotion)
promotionRoute.get('/statistics',getPromotionStatistics)

export default promotionRoute;