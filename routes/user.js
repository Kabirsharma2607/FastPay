const express = require("express");
const zod = require("zod");
const { User, Account } = require("../db");
const JWT_SECRET = process.env.JWT_SECRET;
const jwt = require("jsonwebtoken");
const { authMiddleware } = require("../middleware");
const { hashPassword } = require("../utils");

const userRouter = express.Router();

const userZod = zod.object({
  username: zod.string().email(),
  password: zod.string(),
  firstName: zod.string(),
  lastName: zod.string(),
});

const signinZod = zod.object({
  username: zod.string().email(),
  password: zod.string(),
});

const updateZod = zod.object({
  password: zod.string().optional(),
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
});

userRouter.post("/signup", async (req, res) => {
  const body = req.body;
  const { success } = userZod.safeParse(body);

  if (!success) {
    return res.status(411).json({
      message: "Email already used / Inorrect Inputs",
    });
  }

  const existingUser = await User.findOne({
    username: body.username,
  });

  if (existingUser) {
    return res.status(411).json({
      message: "User Already Exists",
    });
  }
  const newPassword = await hashPassword(body.password, "abcdefg");

  console.log(newPassword);
  console.log();
  const user = await User.create({
    username: body.username,
    password: newPassword,
    firstName: body.firstName,
    lastName: body.lastName,
  });

  const userId = user._id;

  const token = jwt.sign(
    {
      userId,
    },
    JWT_SECRET
  );

  const newAccount = await Account.create({
    userId,
    balance: 1 + Math.random() * 10000,
  });

  return res.status(200).json({
    message: "User created successfully",
    token: token,
  });
});

userRouter.post("/signin", async (req, res) => {
  const body = req.body;
  const { success } = signinZod.safeParse(body);
  if (!success) {
    return res.status(411).json({
      message: "Invalid data has been sent",
    });
  }

  const comparePassword = await hashPassword(body.password, "abcdefg");

  const user = await User.findOne({
    username: body.username,
    password: body.password,
  });

  if (!user) {
    return res.status(411).json({
      message: "User doesn't exist",
    });
  }

  const token = jwt.sign(
    {
      userId: user._id,
    },
    JWT_SECRET
  );

  return res.status(200).json({
    success: true,
    token: token,
  });
});

userRouter.put("/", authMiddleware, async (req, res) => {
  const body = req.body;
  const { success } = updateZod.safeParse(body);
  if (!success) {
    return res.status(411).json({
      message: "Error wrong inputs",
    });
  }

  const updated = await User.updateOne(req.body, {
    id: req.userId,
  });

  if (!updated) {
    return res.status(411).json({
      message: "Internal error",
    });
  }
  return res.status(200).json({
    message: "Details updated successfully",
  });
});

userRouter.get("/bulk", authMiddleware, async (req, res) => {
  const filter = req.query.filter || "";
  //console.log(req.body.username);
  const users = await User.find({
    $or: [
      {
        firstName: {
          $regex: filter,
        },
      },
      {
        lastName: {
          $regex: filter,
        },
      },
    ],
  });

  const allUsers = users.map((user) => ({
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    _id: user._id,
  }));
  console.log(allUsers);
  return res.json({
    users: allUsers,
  });
});

userRouter.get("/userinfo", authMiddleware, async (req, res) => {
  try {
    const { userId } = req;
    if (!userId) {
      return res.status(411).json({
        message: "User not found.",
      });
    }
    console.log(userId);
    const currentUser = await User.findById(userId).select("-password");
    return res.json(currentUser);
  } catch (error) {
    console.log(error.message);
    return res.status(411).send(error);
  }
});

module.exports = userRouter;
