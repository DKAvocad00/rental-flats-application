import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import CreateListing from "./pages/CreateListing";
import ListingDetails from "./pages/ListingDetails";
import TripList from "./pages/TripList";
import WishList from "./pages/WishList";
import PropertyList from "./pages/PropertyList";
import ReservationList from "./pages/ReservationList";
import CategoryPage from "./pages/CategoryPage";
import SearchPage from "./pages/SearchPage";
import Notification from "./components/Notification";
import { useSelector } from "react-redux";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const ProtectedRoute = ({ children, allowedRoles }) => {
    const user = useSelector((state) => state.user);
    if (!user) {
      return <Navigate to="/login" />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/" />;
    }

    return children;
  };

  return (
    <div>
      <Notification />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/create-listing"
            element={
              <ProtectedRoute allowedRoles={["host"]}>
                <CreateListing />
              </ProtectedRoute>
            }
          />

          <Route path="/properties/:listingId" element={<ListingDetails />} />
          <Route
            path="/properties/category/:category"
            element={<CategoryPage />}
          />
          <Route path="/properties/search/:search" element={<SearchPage />} />

          {/* Protected User Routes */}
          <Route
            path="/:userId/trips"
            element={
              <ProtectedRoute allowedRoles={["guest"]}>
                <TripList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:userId/wishList"
            element={
              <ProtectedRoute allowedRoles={["guest"]}>
                <WishList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:userId/properties"
            element={
              <ProtectedRoute allowedRoles={["host"]}>
                <PropertyList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:userId/reservations"
            element={
              <ProtectedRoute allowedRoles={["host"]}>
                <ReservationList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
