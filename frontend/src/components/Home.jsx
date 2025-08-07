import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Post from "./Post";

const API_URL = "http://localhost:5000";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem("token");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/posts`);
      setPosts(res.data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await axios.get(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchUser();
  }, [fetchPosts, fetchUser]);

  const handlePost = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      await axios.post(
        `${API_URL}/api/posts`,
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContent("");
      fetchPosts();
      setError("");
    } catch (err) {
      console.error("Failed to create post:", err);
      setError(
        err.response?.data?.error || "Failed to post. Please log in or try again."
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center py-10">
      <div className="w-full max-w-xl flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-600">Networx</h1>
        {getToken() && (
          <div className="flex items-center space-x-4">
            {user && (
              <Link to={`/profile/${user.id}`}>
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold">
                  {getInitials(user.name)}
                </div>
              </Link>
            )}
            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <form
        onSubmit={handlePost}
        className="bg-white rounded-lg shadow p-6 w-full max-w-xl mb-8"
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full border border-gray-300 rounded p-2 mb-4 focus:ring-blue-500"
          rows={3}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 w-full font-semibold"
        >
          Post
        </button>
        {error && (
          <div className="text-red-500 text-sm mt-2">{error}</div>
        )}
      </form>

      <div className="w-full max-w-xl space-y-4">
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-500">No posts yet.</div>
        ) : (
          posts.map((post) => <Post key={post._id} post={post} />)
        )}
      </div>
    </div>
  );
};

export default Home;
