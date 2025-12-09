import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { login } from "../lib/api";

const useLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    mutate: loginMutation,
    isPending,
    error,
  } = useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      // Hiển thị toast thành công
      toast.success(data.message || "Đăng nhập thành công!", {
        position: "top-right",
        autoClose: 2000,
      });

      // Invalidate để refetch authUser
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });

      // Kiểm tra role để điều hướng
      const user = data.user;
      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "manager") {
        navigate("/manager");
      } else if (user.role === "employee") {
        navigate("/employee");
      } else {
        navigate("/");
      }
    },
    onError: (error) => {
      // Hiển thị toast lỗi
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message || 
        "Đăng nhập thất bại!";
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    },
  });

  return { error, isPending, loginMutation };
};

export default useLogin;