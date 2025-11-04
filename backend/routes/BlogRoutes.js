import express from "express"
import {  createPost, getAllPosts, getBlog, getPostsInCine, updatePost } from "../controller/Blog.js";

const BlogRoute = express.Router();

BlogRoute.get("/:cinema_id",getPostsInCine)
BlogRoute.get("/:cinema_id/:post_id",getBlog)
BlogRoute.get("/",getAllPosts)

BlogRoute.put("/:id", updatePost)
BlogRoute.post("/:cinema_id",createPost)


export default BlogRoute