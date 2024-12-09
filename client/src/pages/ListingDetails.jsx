import { useEffect, useState } from "react";
import "../styles/ListingDetails.scss";
import { useNavigate, useParams } from "react-router-dom";
import { facilities } from "../data";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DateRange } from "react-date-range";
import { eachDayOfInterval, addDays, parse } from "date-fns";
import Loader from "../components/Loader";
import { useSelector, useDispatch } from "react-redux";
import { setWishList } from "../redux/state";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Favorite } from "@mui/icons-material";

const ListingDetails = () => {
  const [loading, setLoading] = useState(true);

  const { listingId } = useParams();
  const [listing, setListing] = useState(null);

  const [bookedRanges, setBookedRanges] = useState([]);

  const getListingDetails = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/properties/${listingId}`,
        {
          method: "GET",
        }
      );

      const data = await response.json();
      setListing(data);
      setLoading(false);
    } catch (err) {
      console.log("Fetch Listing Details Failed", err.message);
    }
  };

  const getBookedDates = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/bookings/${listingId}/bookings`,
        {
          method: "GET",
        }
      );

      const bookings = await response.json();

      // Function to parse 'dd.MM.yyyy' to Date object using date-fns
      const parseDate = (dateStr) => parse(dateStr, "dd.MM.yyyy", new Date());

      // Process bookings into an array of Date objects
      const disabledDatesArray = [];
      bookings.forEach((booking) => {
        const start = parseDate(booking.startDate);
        const end = parseDate(booking.endDate);
        let currentDate = new Date(start);

        while (currentDate <= end) {
          disabledDatesArray.push(new Date(currentDate));
          currentDate = addDays(currentDate, 1);
        }
      });

      setBookedRanges(disabledDatesArray);
    } catch (err) {
      console.log("Fetch Booked Dates Failed", err.message);
    }
  };

  useEffect(() => {
    getListingDetails();
    getBookedDates();
  }, [listingId]);

  /* BOOKING CALENDAR */
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const handleSelect = (ranges) => {
    // Update the selected date range when user makes a selection
    setDateRange([ranges.selection]);
  };

  const start = new Date(dateRange[0].startDate);
  const end = new Date(dateRange[0].endDate);
  const dayCount = Math.round(end - start) / (1000 * 60 * 60 * 24); // Calculate the difference in day unit

  /* SUBMIT BOOKING */
  const customerId = useSelector((state) => state?.user?._id);
  const user = useSelector((state) => state?.user);

  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const bookingForm = {
        customerId,
        listingId,
        hostId: listing.creator._id,
        startDate: dateRange[0].startDate.toLocaleDateString(),
        endDate: dateRange[0].endDate.toLocaleDateString(),
        totalPrice: listing.price * dayCount,
      };

      const response = await fetch("http://localhost:3001/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingForm),
      });

      if (response.ok) {
        navigate(`/${customerId}/trips`);
      }
    } catch (err) {
      console.log("Submit Booking Failed.", err.message);
    }
  };

  const handleBookingClick = () => {
    if (!user) {
      navigate("/login");
    } else {
      handleSubmit();
    }
  };

  /* ADD TO WISHLIST */
  const wishList = user?.wishList || [];

  const isLiked = wishList?.find((item) => item?._id === listingId);

  const dispatch = useDispatch();

  const patchWishList = async () => {
    if (user?._id !== listing.creator._id) {
      const response = await fetch(
        `http://localhost:3001/users/${user?._id}/${listingId}`,
        {
          method: "PATCH",
          header: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      dispatch(setWishList(data.wishList));
    } else {
      return;
    }
  };

  return loading ? (
    <Loader />
  ) : (
    <>
      <Navbar />
      <div className="listing-details">
        <div className="title">
          <h1>{listing.title}</h1>
          <div
            className="save"
            onClick={(e) => {
              e.stopPropagation();
              patchWishList();
            }}
            disabled={!user}
          >
            {isLiked ? (
              <Favorite sx={{ color: "red" }} />
            ) : (
              <Favorite sx={{ color: "white" }} />
            )}
          </div>
        </div>

        <div className="photos">
          {listing.listingPhotoPaths?.map((item) => (
            <img
              src={`http://localhost:3001/${item.replace("public", "")}`}
              alt="listing photo"
            />
          ))}
        </div>

        <h2>
          {listing.type} in {listing.city}, {listing.province},{" "}
          {listing.country}
        </h2>
        <p>
          {listing.guestCount} guests - {listing.bedroomCount} bedroom(s) -{" "}
          {listing.bedCount} bed(s) - {listing.bathroomCount} bathroom(s)
        </p>
        <hr />

        <div className="profile">
          <img
            src={`http://localhost:3001/${listing.creator.profileImagePath.replace(
              "public",
              ""
            )}`}
          />
          <h3>
            Hosted by {listing.creator.firstName} {listing.creator.lastName}
          </h3>
        </div>
        <hr />

        <h3>Description</h3>
        <p>{listing.description}</p>
        <hr />

        <h3>{listing.highlight}</h3>
        <p>{listing.highlightDesc}</p>
        <hr />

        <div className="booking">
          <div>
            <h2>What this place offers?</h2>
            <div className="amenities">
              {listing.amenities?.map((item, index) => (
                <div className="facility" key={index}>
                  <div className="facility_icon">
                    {
                      facilities.find((facility) => facility.name === item)
                        ?.icon
                    }
                  </div>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2>How long do you want to stay?</h2>
            <div className="date-range-calendar">
              <DateRange
                ranges={dateRange}
                onChange={handleSelect}
                disabledDates={bookedRanges}
                minDate={new Date()}
              />
              {dayCount > 1 ? (
                <h2>
                  ${listing.price} x {dayCount} nights
                </h2>
              ) : (
                <h2>
                  ${listing.price} x {dayCount} night
                </h2>
              )}

              <h2>Total price: ${listing.price * dayCount}</h2>
              <p>Start Date: {dateRange[0].startDate.toLocaleDateString()}</p>
              <p>End Date: {dateRange[0].endDate.toLocaleDateString()}</p>

              <button
                className="button"
                type="button"
                onClick={handleBookingClick}
              >
                BOOKING
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ListingDetails;
