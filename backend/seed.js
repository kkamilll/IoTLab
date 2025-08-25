import bcrypt from "bcrypt"; 
import User from './models/User.js'
import connectDB from './config/db.js';

const register = async () => {
    try{
        await connectDB();
        const hashPassword = await bcrypt.hash("admin",10);
        const newUser = new User({
            name: "admin",
            email: "admin@gmail.com",
            password: "admin",
            address: "admin address",
            role: "admin"
        })
        await newUser.save();
        console.log("Admin user created succesfully");

        // const admin = await User.findOne({ email: "admin@gmail.com" });
        // console.log("Stored hash:", admin.password);

        // const test = await bcrypt.compare("admin", admin.password);
        // console.log("Compare result:", test);

        // (async () => {
        //     const hash = await bcrypt.hash("admin", 10);
        //     console.log("Hash:", hash);

        //     const match = await bcrypt.compare("admin", hash);
        //     console.log("Compare:", match); // should be true
        // })();
    }
    catch(error){
        console.log(error);
    }
}
register();