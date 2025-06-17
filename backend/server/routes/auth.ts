import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { CustomError } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { z } from "zod";

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(2, "Username must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["FREELANCER", "CLIENT"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const { name, username, email, password, role } = req.body;

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      const error = new Error("User already exists") as CustomError;
      error.statusCode = 400;
      throw error;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        role: role || "FREELANCER",
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        freelancerProfile: true,
        clientProfile: true,
      },
    });

    // Create token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "30d",
    });

    // Calculate token expiration
    const tokenExpiration = new Date();
    tokenExpiration.setDate(tokenExpiration.getDate() + 30);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          profile:user.role || "FREELANCER"
        },
        token,
        tokenExpiration: tokenExpiration.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        email: true,
        password: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        freelancerProfile: true,
        clientProfile: true,
      },
    });

    if (!user) {
      const error = new Error("Invalid credentials") as CustomError;
      error.statusCode = 401;
      throw error;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const error = new Error("Invalid credentials") as CustomError;
      error.statusCode = 401;
      throw error;
    }

    // Create token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "30d",
    });

    // Calculate token expiration
    const tokenExpiration = new Date();
    tokenExpiration.setDate(tokenExpiration.getDate() + 30);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          profile:
            user.role === "FREELANCER"
              ? user.freelancerProfile
              : user.clientProfile,
        },
        token,
        tokenExpiration: tokenExpiration.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
