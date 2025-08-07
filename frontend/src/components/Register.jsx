import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "https://network-jgkl.onrender.com";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", bio: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/register`, form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">Create Account</h2>
        {error && <div className="text-red-500">{error}</div>}
        <input
          name="name"
          placeholder="Name"
          onChange={handleChange}
          value={form.name}
          required
          className="border border-gray-300 rounded w-full p-2 focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          onChange={handleChange}
          value={form.email}
          required
          className="border border-gray-300 rounded w-full p-2 focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
          value={form.password}
          required
          className="border border-gray-300 rounded w-full p-2 focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          name="bio"
          placeholder="Bio"
          onChange={handleChange}
          value={form.bio}
          className="border border-gray-300 rounded w-full p-2 focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 w-full font-semibold"
        >
          Register
        </button>
        <div className="text-sm mt-2">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Login
          </a>
        </div>
      </form>
    </div>
  );
};

export default Register;
