import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import express from "express";
import userRoutes from "../routes/userRoutes.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import authMiddleware from "../middleware/authMiddleware.js";

// Mock middleware auth (autoryzacja)
jest.mock("../middleware/authMiddleware.js", () => (req, res, next) => {
  req.user = { _id: "64f000000000000000000001" }; // przykładowe ID
  next();
});

let mongoServer;
const app = express();
app.use(express.json());
app.use("/users", userRoutes);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
  await Product.deleteMany({});
});

describe("User Controller Full CRUD", () => {
  it("should create a user", async () => {
    const res = await request(app).post("/users/create").send({
      name: "Jan",
      email: "jan@example.com",
      password: "123456",
      role: "lecturer",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);

    const userInDb = await User.findOne({ email: "jan@example.com" });
    expect(userInDb).not.toBeNull();
  });

  it("should get all users", async () => {
    await User.create({ name: "Jan", email: "jan@example.com", password: "123456", role: "lecturer" });
    const res = await request(app).get("/users");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThan(0);
  });

  it("should get current user profile", async () => {
    const user = await User.create({ _id: "64f000000000000000000001", name: "Jan", email: "jan@example.com", password: "123456", role: "lecturer" });
    const res = await request(app).get("/users/profile");
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe(user.email);
  });

  it("should update current user profile", async () => {
    await User.create({ _id: "64f000000000000000000001", name: "Jan", email: "jan@example.com", password: "123456", role: "lecturer" });
    const res = await request(app).put("/users/profile").send({ name: "Janek" });
    expect(res.statusCode).toBe(200);
    expect(res.body.user.name).toBe("Janek");
  });

  it("should update any user (admin)", async () => {
    const user = await User.create({ name: "Jan", email: "jan@example.com", password: "123456", role: "lecturer" });
    const res = await request(app).put(`/users/${user._id}`).send({ name: "Admin Updated", role: "admin" });
    expect(res.statusCode).toBe(200);
    expect(res.body.user.name).toBe("Admin Updated");
    expect(res.body.user.role).toBe("admin");
  });

  it("should delete a user", async () => {
    const user = await User.create({ name: "Jan", email: "jan@example.com", password: "123456", role: "lecturer" });
    const res = await request(app).delete(`/users/${user._id}`);
    expect(res.statusCode).toBe(200);

    const deletedUser = await User.findById(user._id);
    expect(deletedUser).toBeNull();
  });

  it("should not delete user with products", async () => {
    const user = await User.create({ name: "Jan", email: "jan@example.com", password: "123456", role: "lecturer" });
    await Product.create({ name: "Test Product", owner: user._id });

    const res = await request(app).delete(`/users/${user._id}`);
    expect(res.statusCode).toBe(400);

    // Upewniamy się, że błąd zwraca właściwe message
    expect(res.body.message).toMatch(/associated products/);
  });
});
