import React, { useEffect, useState } from "react";
import { NavLink } from 'react-router';
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
const ProductView = () => {

    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/categories/private`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.success) {
                setCategories(res.data.categories);
            }
        } catch (err) {
            console.error("Błąd pobierania kategorii:", err);
        }
    };

  const handleSearch = (e) => setSearchTerm(e.target.value.toLowerCase());


    useEffect(() => {
        fetchCategories();
    }, []);


    return (
        <div className="flex">
            <h1> TESTTTT </h1>
            <div>
                <input
                    type="text"
                    placeholder="Search"
                    className="border border-gray-300 p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1"
                    onChange={handleSearch}
                />
            </div>

            <table className="w-full border-separate border-spacing-2">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Number</th>
                        <th>Category</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td> FIRST</td>
                        <td> 5</td>
                        <td> LED's</td>
                    </tr>
                </tbody>

            </table>
        </div>


    );
}

export default ProductView

