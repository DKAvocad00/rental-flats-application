import { useState } from "react";
import "../styles/ListingCard.scss";
import {
  ArrowForwardIos,
  ArrowBackIosNew,
  Favorite,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setWishList, updateUserPreferences } from "../redux/state";
import { showNotification } from "../redux/state";

const ListingCard = ({
  listingId,
  creator,
  customerFirstName,
  customerLastName,
  customerEmail,
  listingPhotoPaths,
  city,
  province,
  country,
  category,
  type,
  price,
  startDate,
  endDate,
  totalPrice,
  booking,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);

  const trackListingView = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `http://localhost:3001/users/${user._id}/track-view`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: `Bearer ${token}`,
          },
          body: JSON.stringify({ listingId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to track view");
      }

      // Update Redux state with new user preferences
      dispatch(
        updateUserPreferences({
          lastViewedListings: data.user.lastViewedListings,
          preferredCategories: data.user.preferredCategories,
          preferredLocations: data.user.preferredLocations,
          viewHistory: data.user.viewHistory,
          pricePreferences: data.user.pricePreferences,
        })
      );
    } catch (err) {
      console.log("Failed to track listing view", err.message);
    }
  };

  const handleListingClick = async () => {
    await trackListingView();
    navigate(`/properties/${listingId}`);
  };

  const goToPrevSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex(
      (prevIndex) =>
        (prevIndex - 1 + listingPhotoPaths.length) % listingPhotoPaths.length
    );
  };

  const goToNextSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex + 1) % listingPhotoPaths.length);
  };

  /* ADD TO WISHLIST */
  const wishList = user?.wishList || [];
  const isLiked = wishList?.find((item) => item?._id === listingId);

  const patchWishList = async (e) => {
    e.stopPropagation();
    if (user?._id !== creator._id) {
      try {
        const response = await fetch(
          `http://localhost:3001/users/${user?._id}/${listingId}`,
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
          dispatch(setWishList(data.wishList));
          // Also track this interaction for recommendations
          await trackListingView();
          dispatch(
            showNotification({
              message: data.message,
              type: "info",
            })
          );
        } else {
          dispatch(
            showNotification({
              message: data.error || "Failed patching wish list",
              type: "error",
            })
          );
        }
      } catch (err) {
        dispatch(
          showNotification({
            message: err.message || "Failed to update wishlist",
            type: "error",
          })
        );
      }
    }
  };

  return (
    <div className="listing-card" onClick={handleListingClick}>
      <div className="slider-container">
        <div
          className="slider"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {listingPhotoPaths?.map((photo, index) => (
            <div key={index} className="slide">
              <img
                src={`http://localhost:3001/${photo?.replace("public", "")}`}
                alt={`photo ${index + 1}`}
              />
              <div className="prev-button" onClick={goToPrevSlide}>
                <ArrowBackIosNew sx={{ fontSize: "15px" }} />
              </div>
              <div className="next-button" onClick={goToNextSlide}>
                <ArrowForwardIos sx={{ fontSize: "15px" }} />
              </div>
            </div>
          ))}
        </div>
        <h3>
          {city}, {province}, {country}
        </h3>
        <p>{category}</p>

        {!booking ? (
          <>
            <p>{type}</p>
            <p>
              <span>${price}</span> per night
            </p>
          </>
        ) : (
          <>
            <p>
              {customerFirstName} {customerLastName} - {customerEmail}
            </p>
            <p>
              {startDate} - {endDate}
            </p>
            <p>
              <span>${totalPrice}</span> total
            </p>
          </>
        )}
      </div>

      {user && user.role === "guest" && (
        <button
          className="favorite"
          onClick={patchWishList}
          disabled={!user || user.role === "host"}
        >
          {isLiked ? (
            <Favorite sx={{ color: "red" }} />
          ) : (
            <Favorite sx={{ color: "white" }} />
          )}
        </button>
      )}
    </div>
  );
};

export default ListingCard;
