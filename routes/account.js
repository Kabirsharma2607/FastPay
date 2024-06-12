const express = require("express");
const mongoose = require("mongoose");
const { authMiddleware } = require("../middleware");
const { Account } = require("../db");
const accountRouter = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
accountRouter.get("/balance", authMiddleware, async (req, res) => {
  const body = req.body;
  //console.log(body);
  const account = await Account.findOne({
    userId: req.userId,
  });
  //console.log(account);
  return res.status(200).json({
    balance: account.balance,
  });
});

accountRouter.post("/transfer", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();

  session.startTransaction();

  const { amount, to } = req.body;
  // console.log(req.userId);
  const account = await Account.findOne({
    userId: req.userId,
  }).session(session);
  //console.log(account);
  if (!account) {
    await session.abortTransaction();
    return res.status(400).json({
      message: "No account",
    });
  }
  if (!account || account.balance < amount) {
    await session.abortTransaction();
    return res.status(400).json({
      message: "Insufficient balance",
    });
  }

  const toAccount = await Account.findOne({
    userId: to,
  }).session(session);

  if (!toAccount) {
    await session.abortTransaction();
    return res.status(400).json({
      message: "Account does not exist",
    });
  }

  await Account.updateOne(
    {
      userId: req.userId,
    },
    {
      $inc: {
        balance: -amount,
      },
    }
  ).session(session);

  await Account.updateOne(
    {
      userId: to,
    },
    {
      $inc: {
        balance: amount,
      },
    }
  ).session(session);

  await session.commitTransaction();

  return res.status(200).json({
    message: "Transfer successful",
  });
});

module.exports = accountRouter;
