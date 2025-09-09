import User from './models/User.js'
import connectDB from './config/db.js';

const register = async () => {
    try{
        await connectDB();
        const newUser = new User({
            name: "admin",
            email: "admin@gmail.com",
            password: "admin",
            address: "admin address",
            role: "admin"
        })
        await newUser.save();
        console.log("Admin user created succesfully");
    }
    catch(error){
        console.log(error);
    }
}
register();