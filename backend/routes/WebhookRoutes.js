import express from 'express'
import { handleSepayWebhook } from '../controller/Webhook.js'

const  webhookrouter = express.Router()

webhookrouter.post('/sepay',handleSepayWebhook)
export default webhookrouter