import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// --------------------- Models ---------------------
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    bio: { type: String },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        type: { type: String, enum: ["like", "love", "fire"], required: true },
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Post = mongoose.model("Post", postSchema);

// --------------------- Middleware ---------------------
function auth(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// --------------------- MongoDB ---------------------
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// --------------------- Auth Routes ---------------------
app.post("/register", async (req, res) => {
  const { name, email, password, bio } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, bio });
    res.status(201).json({ message: "User registered" });
  } catch (err) {
    res.status(400).json({ error: "Email already exists" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, bio: user.bio },
  });
});

app.get("/api/users/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("name email bio");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ id: user._id, name: user.name, email: user.email, bio: user.bio });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.put("/api/users/me", auth, async (req, res) => {
  const { name, email, bio, profilePicture } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.name = name || user.name;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.profilePicture = profilePicture || user.profilePicture;

    await user.save();
    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});


// --------------------- Post Routes ---------------------
app.post("/api/posts", auth, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "Content required" });

  try {
    const post = await Post.create({ content, author: req.userId });
    const populatedPost = await Post.findById(post._id).populate("author", "name");
    res.status(201).json(populatedPost);
  } catch (err) {
    res.status(500).json({ error: "Failed to create post" });
  }
});

app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("author", "name")
      .populate("reactions.user", "name");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

app.delete("/api/posts/:postId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Post.findByIdAndDelete(req.params.postId);
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});

app.post("/api/posts/:postId/react", auth, async (req, res) => {
  const { postId } = req.params;
  const { type } = req.body;
  const userId = req.userId;

  if (!["like", "love", "fire"].includes(type)) {
    return res.status(400).json({ error: "Invalid reaction type" });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const existingReaction = post.reactions.find(
      (r) => r.user.toString() === userId && r.type === type
    );

    if (existingReaction) {
      // Remove reaction if it already exists
      post.reactions = post.reactions.filter(
        (r) => !(r.user.toString() === userId && r.type === type)
      );
    } else {
      // Remove previous reaction from user
      post.reactions = post.reactions.filter((r) => r.user.toString() !== userId);
      post.reactions.push({ user: userId, type });
    }

    await post.save();
    const updatedPost = await Post.findById(postId)
      .populate("author", "name")
      .populate("reactions.user", "name");
    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ error: "Failed to react" });
  }
});

// --------------------- Profile Route ---------------------
app.get("/api/profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("name email bio");
    if (!user) return res.status(404).json({ error: "User not found" });

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate("author", "name")
      .populate("reactions.user", "name");

    res.json({ user, posts });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.put("/api/posts/:postId", auth, async (req, res) => {
  const { content } = req.body;
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.author.toString() !== req.userId)
      return res.status(403).json({ error: "Unauthorized" });

    post.content = content;
    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate("author", "name")
      .populate("reactions.user", "name");

    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ error: "Failed to edit post" });
  }
});


// --------------------- Server ---------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
