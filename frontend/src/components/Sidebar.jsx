import React, { useEffect, useState } from "react";
import { NavLink } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
    const menuItems = [
        {name:"Dashboard", path: "/admin-dashboard", isParent:true},
        {name:"Categories", path: "/admin-dashboard/categories", isParent:false},
        {name:"Products", path: "/admin-dashboard/products", isParent:false},
        {name:"Suppliers", path: "/admin-dashboard/suppliers", isParent:false},
        {name:"Orders", path: "/admin-dashboard/orders", isParent:false},
        {name:"Users", path: "/admin-dashboard/users", isParent:false},
        {name:"Profile", path: "/admin-dashboard/profile", isParent:false},
        {name:"Logout", path: "/admin-dashboard/logout", isParent:false},
    ];

    const customerItems = [
        {name:"Products", path: "/customer-dashboard", isParent:true},
        {name:"Orders", path: "/customer-dashboard/orders", isParent:false},
        {name:"Profile", path: "/customer-dashboard/profile", isParent:false},
        {name:"Logout", path: "/customer-dashboard/logout", isParent:false},
    ];

    const {user} = useAuth();
    const [menuLinks,setMenuLinks]=useState(customerItems);

   useEffect(() => {
        if(user && user.role === "admin"){
            setMenuLinks(menuItems);
        }
     }, []);

    return (
        <div className='flex flex-col h-screen bg-black text-white w-16 md:w-64 fixed'>
            <div className='h-16 flex items-center justify-center'>
                <span className='hidden md:block text-xl font-bold'>Inventory MS</span>
                <span className='md:hidden text-xl font-bold'>IMS</span>
            </div>
        
            <div>
                <ul className='space-y-2 p-2'>
                    {menuLinks.map((item) => (
                        <li key={item.name}>
                            <NavLink 
                            end={item.isParent}
                            className={({isActive}) => (isActive ? "bg-gray-700" : "") + " flex items-center p-2 rounded-md hover:bg-gray-700 transition duration-200"}
                            to={item.path} >
                                <span className='ml-4 md:ml-0 md:ml-4'>{item.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Sidebar;
