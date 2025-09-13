import express from "express"
import {  createPost, getBlog, getPostsInCine, updatePost } from "../controller/Blog.js";

const BlogRoute = express.Router();

BlogRoute.get("/:cinema_id",getPostsInCine)
BlogRoute.get("/:cinema_id/:post_id",getBlog)
BlogRoute.put("/:id", updatePost)
BlogRoute.post("/:cinema_id",createPost)


export default BlogRoute