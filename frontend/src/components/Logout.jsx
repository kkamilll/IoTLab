import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Logout = () => {
    const navigate = useNavigate();
 const {logout} = useAuth();
 logout();
 navigate("/");
}
export default Logout;
