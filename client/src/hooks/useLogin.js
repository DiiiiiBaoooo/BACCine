import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
      // invalidate để refetch authUser
      
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });

      // kiểm tra role + isUpdateProfile để điều hướng
      const user = data.user; // backend nên trả { user, token }
      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "manager") {
        navigate("/manager");
      }
    },
  });

  return { error, isPending, loginMutation };
};

export default useLogin;
