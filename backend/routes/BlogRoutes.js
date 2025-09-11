import express from "express"
import {  createPost, getPostsInCine } from "../controller/Blog.js";

const BlogRoute = express.Router();

BlogRoute.get("/:cinema_id",getPostsInCine)
BlogRoute.post("/:cinema_id",createPost)


export default BlogRoute