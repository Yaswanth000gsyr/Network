import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        const res = await axios.get(`${API_URL}/profile/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data.user);
        setPosts(res.data.posts);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load profile");
        if (err.response?.status === 401) navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, navigate]);

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  const handleDeletePost = async (postId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(posts.filter((post) => post._id !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-600">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center text-red-600">
        {error}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-600">
        User not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 flex flex-col items-center">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-xl mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mr-4">
              {getInitials(user.name)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-blue-700">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          <Link
                to="/users/me"
                className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                >
            Edit Profile
        </Link>
        </div>
        {user.bio && <p className="text-gray-700">{user.bio}</p>}
        <Link to="/" className="text-blue-600 mt-4 inline-block hover:underline">
          ← Back to Feed
        </Link>
      </div>

      <div className="w-full max-w-xl">
        <h3 className="text-xl font-semibold text-blue-700 mb-4">
          {user.name}'s Posts
        </h3>
        {posts.length === 0 ? (
          <p className="text-gray-500">No posts yet.</p>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="bg-white p-4 rounded shadow mb-4">
              <h4 className="text-lg font-bold mb-2">{post.title}</h4>
              <p className="text-gray-700 mb-2">{post.content}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => handleDeletePost(post._id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;
