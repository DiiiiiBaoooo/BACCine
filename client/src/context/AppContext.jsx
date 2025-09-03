import React from 'react'
import { createContext, useContext,useEffect, useState } from 'react'
import axios from "axios"
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;
export const AppContext=createContext();
export const AppProvider = ({children}) =>{
    const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL
    const {getToken} = useAuth()

}

export default AppContext