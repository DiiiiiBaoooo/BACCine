import { axiosInstance } from "./axios";
export const login =async (loginData)=>{
    const response = await axiosInstance.post("/auth/login",loginData);
    return response.data;
}
export const getAuthUser = async ()=>{
    try {
        const res = await axiosInstance.get("/auth/me");
        return res.data;
    } catch (error) {
      console.log("error in getauth user",error);
      
      return null
    }
  }

  export const completeOnboarding = async (userData)=>{
    const res= await axiosInstance.post("/auth/onboarding",userData);
    return res.data;
}