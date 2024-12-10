import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Loader from "../components/Loader";
import { showNotification } from "../redux/state";
import {
  Person,
  Home,
  Assessment,
  Block,
  CheckCircle,
  Delete,
} from "@mui/icons-material";
import "../styles/AdminDashboard.scss";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    totalBookings: 0,
    categoryStats: {},
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);
  const currentUser = useSelector((state) => state.user);

  // Redirect if not admin
  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/");
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:3001/admin/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          token: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users);
      }
    } catch (err) {
      console.log("Error fetching users:", err);
    }
  };

  const fetchListings = async () => {
    try {
      const response = await fetch("http://localhost:3001/admin/listings", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          token: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setListings(data.listings);
      }
    } catch (err) {
      console.log("Error fetching listings:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("http://localhost:3001/admin/stats", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          token: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (err) {
      console.log("Error fetching stats:", err);
    }
  };

  const toggleUserBlock = async (userId) => {
    try {
      const response = await fetch(
        `http://localhost:3001/admin/users/${userId}/toggle-block`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            token: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        fetchUsers();
        dispatch(showNotification({ message: data.message, type: "info" }));
      }
    } catch (err) {
      console.log("Error toggling user block:", err);
    }
  };

  const deleteListing = async (listingId) => {
    try {
      const response = await fetch(
        `http://localhost:3001/admin/listings/${listingId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            token: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        fetchListings();
        dispatch(showNotification({ message: data.message, type: "info" }));
      }
    } catch (err) {
      console.log("Error deleting listing:", err);
    }
  };

  const changeUserRole = async (userId, newRole) => {
    try {
      const response = await fetch(
        `http://localhost:3001/admin/users/${userId}/change-role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            token: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        fetchUsers();
        dispatch(
          showNotification({
            message: data.message,
            type: "info",
          })
        );
      } else {
        dispatch(
          showNotification({
            message: data.error || "Failed to change user role",
            type: "error",
          })
        );
      }
    } catch (err) {
      console.log("Error changing user role:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchUsers(), fetchListings(), fetchStats()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <Loader />;

  return (
    <>
      <Navbar />
      <div className="admin-dashboard">
        <div className="sidebar">
          <div
            className={`sidebar-item ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <Person /> Users
          </div>
          <div
            className={`sidebar-item ${
              activeTab === "listings" ? "active" : ""
            }`}
            onClick={() => setActiveTab("listings")}
          >
            <Home /> Listings
          </div>
          <div
            className={`sidebar-item ${activeTab === "stats" ? "active" : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            <Assessment /> Statistics
          </div>
        </div>

        <div className="content">
          {activeTab === "users" && (
            <div className="users-section">
              <h2>Users Management</h2>
              <div className="users-grid">
                {users.map((user) => (
                  <div key={user._id} className="user-card">
                    <img
                      src={`http://localhost:3001/${user.profileImagePath.replace(
                        "public",
                        ""
                      )}`}
                      alt={user.firstName}
                    />
                    <div className="user-info">
                      <h3>
                        {user.firstName} {user.lastName}
                      </h3>
                      <p>Email: {user.email}</p>
                      <div className="role-control">
                        <label>Role: </label>
                        <select
                          value={user.role}
                          onChange={(e) =>
                            changeUserRole(user._id, e.target.value)
                          }
                          disabled={user._id === currentUser?._id}
                        >
                          <option value="guest">Guest</option>
                          <option value="host">Host</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <button
                        onClick={() => toggleUserBlock(user._id)}
                        className={user.isBlocked ? "unblock" : "block"}
                        disabled={user._id === currentUser?._id}
                      >
                        {user.isBlocked ? <CheckCircle /> : <Block />}
                        {user.isBlocked ? "Unblock" : "Block"} User
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "listings" && (
            <div className="listings-section">
              <h2>Listings Management</h2>
              <div className="listings-grid">
                {listings.map((listing) => (
                  <div key={listing._id} className="listing-card">
                    <img
                      src={`http://localhost:3001/${listing.listingPhotoPaths[0].replace(
                        "public",
                        ""
                      )}`}
                      alt={listing.title}
                    />
                    <div className="listing-info">
                      <h3>{listing.title}</h3>
                      <p>Category: {listing.category}</p>
                      <p>
                        Location: {listing.city}, {listing.country}
                      </p>
                      <p>Price: ${listing.price}</p>
                      <button
                        onClick={() => deleteListing(listing._id)}
                        className="delete"
                      >
                        <Delete /> Delete Listing
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "stats" && (
            <div className="stats-section">
              <h2>Platform Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Users</h3>
                  <p>{stats.totalUsers}</p>
                </div>
                <div className="stat-card">
                  <h3>Total Listings</h3>
                  <p>{stats.totalListings}</p>
                </div>
                <div className="stat-card">
                  <h3>Total Bookings</h3>
                  <p>{stats.totalBookings}</p>
                </div>
              </div>

              <div className="category-stats">
                <h3>Popular Categories</h3>
                <div className="category-chart">
                  {Object.entries(stats.categoryStats).map(
                    ([category, count]) => (
                      <div key={category} className="category-bar">
                        <div
                          className="bar"
                          style={{
                            width: `${(count / stats.totalListings) * 100}%`,
                          }}
                        >
                          {category}: {count}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AdminDashboard;
