import React, { useState } from "react";
import axios from "axios";

const API_URL = "https://network-jgkl.onrender.com";

const Post = ({ post, currentUser, onDelete }) => {
  const [reactions, setReactions] = useState({
    like: post.reactions?.filter((r) => r.type === "like").length || 0,
    love: post.reactions?.filter((r) => r.type === "love").length || 0,
    fire: post.reactions?.filter((r) => r.type === "fire").length || 0,
  });

  const handleReaction = async (type) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to react");
        return;
      }
      const res = await axios.post(
        `${API_URL}/posts/${post._id}/react`,
        { type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const reactionsArray = res.data.reactions;
      setReactions({
        like: reactionsArray.filter((r) => r.type === "like").length,
        love: reactionsArray.filter((r) => r.type === "love").length,
        fire: reactionsArray.filter((r) => r.type === "fire").length,
      });
    } catch (err) {
      console.error("Failed to react:", err);
      alert(err.response?.data?.error || "Failed to react");
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm("Are you sure you want to delete this post?");
    if (!confirm) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/posts/${post._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onDelete?.(post._id); // trigger deletion in parent
    } catch (err) {
      console.error("Delete failed:", err);
      alert(err.response?.data?.error || "Failed to delete post");
    }
  };

  const handleEdit = () => {
    alert("Edit feature coming soon! (You can plug in a modal or redirect here)");
  };

  return (
    <div className="post border p-4 rounded shadow mb-4 bg-white">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-lg">{post.author?.name || "Unknown Author"}</h4>
        {currentUser === post.author?._id && (
          <div className="space-x-2">
            <button onClick={handleEdit} className="text-blue-500 hover:underline text-sm">
              Edit
            </button>
            <button onClick={handleDelete} className="text-red-500 hover:underline text-sm">
              Delete
            </button>
          </div>
        )}
      </div>
      <p className="my-2">{post.content}</p>
      <span className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleString()}</span>
      <div className="mt-3 flex gap-4">
        <button
          onClick={() => handleReaction("like")}
          className="hover:text-blue-500 focus:outline-none"
        >
          👍 {reactions.like}
        </button>
        <button
          onClick={() => handleReaction("love")}
          className="hover:text-pink-500 focus:outline-none"
        >
          ❤️ {reactions.love}
        </button>
        <button
          onClick={() => handleReaction("fire")}
          className="hover:text-orange-500 focus:outline-none"
        >
          🔥 {reactions.fire}
        </button>
      </div>
    </div>
  );
};

export default Post;
