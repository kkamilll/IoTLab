import React, { useEffect, useState } from "react";
import { NavLink } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
    const menuItems = [
        {name:"Dashboard", path: "/admin-dashboard", isParent:true},
        {name:"Categories", path: "/admin-dashboard/categories", isParent:false},
        {name:"Products", path: "/admin-dashboard/products", isParent:false},
        {name:"Orders", path: "/admin-dashboard/orders", isParent:false},
        {name:"Users", path: "/admin-dashboard/users", isParent:false},
        {name:"Profile", path: "/admin-dashboard/profile", isParent:false},
        {name:"Notes", path: "/admin-dashboard/notes", isParent:false},
        {name:"Logout", path: "/logout", isParent:false},
    ];

    const customerItems = [
        {name:"Products", path: "/customer-dashboard", isParent:true},
        {name:"Orders", path: "/customer-dashboard/orders", isParent:false},
        {name:"Profile", path: "/customer-dashboard/profile", isParent:false},
        {name:"Logout", path: "/logout", isParent:false},
    ];

    const {user} = useAuth();
    const [menuLinks,setMenuLinks] = useState(customerItems);

    useEffect(() => {
        if(user && user.role === "admin"){
            setMenuLinks(menuItems);
        }
    }, [user]);

    return (
        <div className="flex flex-col h-screen fixed w-16 md:w-64 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-950 text-white shadow-lg">
            <div className="h-16 flex items-center justify-center border-b border-blue-700">
                <span className="hidden md:block text-2xl font-extrabold tracking-wide drop-shadow-lg">Inventory MS</span>
                <span className="md:hidden text-2xl font-extrabold tracking-wide drop-shadow-lg">IMS</span>
            </div>

            <nav className="flex-grow overflow-y-auto mt-4">
                <ul className="space-y-2 px-2">
                    {menuLinks.map((item) => (
                        <li key={item.name}>
                            <NavLink 
                                end={item.isParent}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center p-3 rounded-lg transition-colors duration-200
                                    ${
                                        isActive 
                                        ? 'bg-blue-700 font-semibold shadow-md' 
                                        : 'hover:bg-blue-700/70'
                                    }`
                                }
                            >
                                <span className="ml-4 md:ml-0 md:ml-4 text-lg">{item.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;
