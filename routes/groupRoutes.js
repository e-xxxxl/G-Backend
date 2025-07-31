const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Four color groups
const GROUPS = ["Red", "Blue", "Green", "Yellow"];
const MAX_PER_GROUP = 6;
const MIN_PER_GROUP = 4;

// Utility: Assign to a random group that is not full
const assignGroup = async () => {
  const counts = await User.aggregate([
    { $group: { _id: "$group", count: { $sum: 1 } } }
  ]);

  const groupCounts = GROUPS.reduce((acc, group) => {
    const found = counts.find((c) => c._id === group);
    acc[group] = found ? found.count : 0;
    return acc;
  }, {});

  const eligibleGroups = GROUPS.filter(
    (group) => groupCounts[group] < MAX_PER_GROUP
  );

  if (eligibleGroups.length === 0) {
    return null; // All groups are full
  }

  const randomIndex = Math.floor(Math.random() * eligibleGroups.length);
  return eligibleGroups[randomIndex];
};

// POST /api/join - Join a random group
router.post("/join", async (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Valid name is required" });
  }

  try {
    const existingUser = await User.findOne({ name: name.trim() });
    if (existingUser) {
      return res.status(400).json({ error: "You have already joined a group" });
    }

    const group = await assignGroup();
    if (!group) {
      return res.status(400).json({ error: "All groups are full" });
    }

    const user = await User.create({ name: name.trim(), group });

    res.status(201).json({ group, message: `Assigned to ${group} group` });
  } catch (err) {
    console.error("Join error:", err);
    res.status(500).json({ error: "Server error, please try again later" });
  }
});

// GET /api/groups - Get all users grouped by color
router.get("/groups", async (req, res) => {
  try {
    const users = await User.find().select("name group").lean();

    const groups = GROUPS.reduce((acc, group) => {
      acc[group] = users
        .filter((user) => user.group === group)
        .map((user) => user.name);
      return acc;
    }, {});

    res.json({ groups });
  } catch (err) {
    console.error("Fetch groups error:", err);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

module.exports = router;
