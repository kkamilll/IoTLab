import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";


const Root = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    useEffect(() => {
        if(user){
            if (user.role==="admin")
            {
               navigate("/home-admin");
            }
            else if (user.role==="customer")
            {
                navigate("/home");
            }
            else{
                navigate("/login")
            }
        } else{
            navigate("/login")
        }
    }, [user,navigate])

    return null;

}

export default Root;