import React, { useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";

const Login = () => {
    return (
        <div className="flex flex-col items-center h-screen justify-center bg-gradient-to-b from-blue-600 from-50% to-gray-100 to-50% space-y-6">
            <h2 className="text-3l text-white">Inventory Managment System</h2>
            <div className="border shadow-lg p-6 w-80 bg-white">
                <h2 className="text-2xl font-bold mb-4">Login</h2>
                <form>
                    <div className="mb-4">
                        <label className="block text-gray-700">Email</label>
                        <input type="email" className="w-full px-3 py-2 border" name="email" required placeholder="Enter Email" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Password</label>
                        <input type="password" className="w-full px-3 py-2 border" name="password" required placeholder="Enter Password" />
                    </div>
                    <div className="mb-4">
                        <button type="submit" className="w-full bg-blue-600 text-white py-2">Login</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;