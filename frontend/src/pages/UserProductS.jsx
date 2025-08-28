
import React, { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ProductView from "../components/ProductsView";
const UserProductS = () => {

  return(
    <div>
      <div className="flex">
        <Sidebar/>
        <div className='flex-1 ml-16 md:ml-64 bg-gray-100 min-h-screen'>
            <ProductView/>
        </div>
      </div>
    </div>
  )
}
export default UserProductS;
