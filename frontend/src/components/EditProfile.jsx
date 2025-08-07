// src/components/EditProfile.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "https://network-jgkl.onrender.com";

const EditProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", bio: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFormData({
          name: res.data.name,
          email: res.data.email,
          bio: res.data.bio || "",
        });
      } catch (err) {
        console.error("Failed to fetch user:", err);
        navigate("/login");
      }
    };

    fetchUser();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const res = await axios.put(`${API_URL}/api/users/me`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Profile updated successfully.");
      setTimeout(() => navigate(`/profile/${res.data._id}`), 1000);
    } catch (err) {
      setMessage(err.response?.data?.error || "Update failed");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-blue-600">Edit Profile</h2>
        <label className="block mb-2 font-semibold">Name:</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded mb-4"
        />

        <label className="block mb-2 font-semibold">Email:</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded mb-4"
        />

        <label className="block mb-2 font-semibold">Bio:</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-4"
          rows={4}
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Save Changes
        </button>

        {message && <p className="mt-4 text-center text-green-600">{message}</p>}
      </form>
    </div>
  );
};

export default EditProfile;
