import express from 'express'
import { handleEventPaymentWebhook, handleSepayWebhook, handleVideoPurchaseWebhook } from '../controller/Webhook.js'

const  webhookrouter = express.Router()

webhookrouter.post('/sepay',handleSepayWebhook)
webhookrouter.post('/phim',handleVideoPurchaseWebhook)
webhookrouter.post('/event',handleEventPaymentWebhook)


export default webhookrouter