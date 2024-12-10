import { useEffect, useState } from "react";
import { categories } from "../data";
import "../styles/Listings.scss";
import ListingCard from "./ListingCard";
import Loader from "./Loader";
import { useDispatch, useSelector } from "react-redux";
import { setListings } from "../redux/state";

const Listings = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const token = useSelector((state) => state.token);

  // Initialize listings state with an empty array
  const listings = useSelector((state) => state.listings) || [];
  const user = useSelector((state) => state.user);

  const getRecommendedListings = async () => {
    try {
      if (!user || user.role === "host") {
        return getFeedListings();
      }

      const response = await fetch(
        `http://localhost:3001/properties/recommended/${user._id}${
          selectedCategory !== "All" ? `?category=${selectedCategory}` : ""
        }`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            token: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch recommendations");
      }
      dispatch(setListings({ listings: data.listings }));
      setLoading(false);
    } catch (err) {
      console.log("Fetching recommended listings failed", err.message);
      getFeedListings();
    }
  };

  const getFeedListings = async () => {
    try {
      const response = await fetch(
        selectedCategory !== "All"
          ? `http://localhost:3001/properties?category=${selectedCategory}`
          : "http://localhost:3001/properties",
        {
          method: "GET",
        }
      );
      const data = await response.json();
      dispatch(setListings({ listings: data }));
      setLoading(false);
    } catch (err) {
      console.log("Fetching feed listings failed", err.message);
    }
  };

  useEffect(() => {
    getRecommendedListings();
  }, [selectedCategory, user]);

  return (
    <>
      <div className="category-list">
        {categories?.map((category, index) => (
          <div
            className={`category ${
              category.label === selectedCategory ? "selected" : ""
            }`}
            key={index}
            onClick={() => setSelectedCategory(category.label)}
          >
            <div className="category_icon">{category.icon}</div>
            <p>{category.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="listings">
          {Array.isArray(listings) &&
            listings.length > 0 &&
            listings.map(
              ({
                _id,
                creator,
                listingPhotoPaths,
                city,
                province,
                country,
                category,
                type,
                price,
              }) => (
                <ListingCard
                  key={_id}
                  listingId={_id}
                  creator={creator}
                  listingPhotoPaths={listingPhotoPaths}
                  city={city}
                  province={province}
                  country={country}
                  category={category}
                  type={type}
                  price={price}
                />
              )
            )}
        </div>
      )}
    </>
  );
};

export default Listings;
