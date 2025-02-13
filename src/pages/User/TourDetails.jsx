import React, { useState, useRef, useEffect, useContext } from 'react';
import '../../styles/tour-details.css';
import { Container, Row, Col, Form, ListGroup, Card, CardBody, CardTitle, CardText, Button } from 'reactstrap';
import { useNavigate, useParams } from 'react-router-dom';
import calculateAvgRating from '../../utils/avgRating';
import avatar from '../../assets/images/avatar.jpg';
import Booking from '../../components/Booking/Booking';
import useFetch from '../../hooks/useFetch';
import { BASE_URL } from '../../utils/config';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import Swal from 'sweetalert2';

const TourDetails = () => {
   const { id } = useParams();
   const reviewMsgRef = useRef('');
   const [tourRating, setTourRating] = useState(null);
   const { user } = useContext(AuthContext);

   // Fetch tour data from database
   const { data: tour, loading, error } = useFetch(`${BASE_URL}/tours/${id}`);
   const [bookings, setBookings] = useState([]);
   const [roomCategories, setRoomCategories] = useState([]);
   const { photo, title, desc, reviews, city, address, distance, maxGroupSize } = tour || {};

   const { totalRating, avgRating } = calculateAvgRating(reviews);
   const [reviewObj, setReviewObj] = useState(null)
   const hotelId = id;

   // Fetch room categories based on the hotel ID
   useEffect(() => {
      if (!hotelId) return;

      const fetchData = async () => {
         try {
            const responseRC = await axios.get(`${BASE_URL}/roomCategory/hotel/${hotelId}`, { withCredentials: true });
            setRoomCategories(responseRC.data);
         } catch (error) {
            console.error("Error fetching room categories:", error);
         }
      };

      fetchData();
   }, [hotelId]);

   const options = { day: 'numeric', month: 'long', year: 'numeric' };
   const navigate = useNavigate();

   const submitHandler = async e => {
      // e.preventDefault(); // Prevent the default behavior of form submission

      const reviewText = reviewMsgRef.current.value;

      try {
         if (!user || !user._id) {
            Swal.fire({
               icon: 'error',
               title: 'You must be logged in to submit a review',
               showConfirmButton: true,
               confirmButtonText: 'Log in',
               confirmButtonColor: '#3085d6',
               timer: 1500
            });
            return;
         }

         const reviewData = {
            username: user?.username,
            reviewText,
            rating: tourRating,
         };
         console.log(reviewData);

         const res = await fetch(`${BASE_URL}/review/${hotelId}`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(reviewData)
         });

         const result = await res.json();
         if (!res.ok) {
            return Swal.fire({
               icon: 'error',
               title: result.message,
               confirmButtonText: 'OK',
               confirmButtonColor: '#d33',
               timer: 1500
            });
         }

         Swal.fire({
            icon: 'success',
            title: 'Review submitted successfully',
            showConfirmButton: true,
            confirmButtonText: 'OK',
            confirmButtonColor: '#3085d6',
            timer: 1500
         });

         navigate(`/tours/${hotelId}`);
      } catch (error) {
         Swal.fire({
            icon: 'error',
            title: 'An error occurred',
            text: error.message,
            confirmButtonText: 'OK',
            confirmButtonColor: '#d33',
            timer: 1500
         });
      }
   };

   useEffect(() => {
      const fetchData = async () => {
         if (!user) {
            return; // Do not fetch if user is not logged in
         }
         try {
            const bookingsResponse = await axios.get(`${BASE_URL}/booking`, {
               withCredentials: true,
            });

            setBookings(bookingsResponse.data.data.filter(b => id === b.hotelId._id));

         } catch (error) {
            console.error("Error fetching bookings:", error);
         }
      };

      fetchData();
      window.scrollTo(0, 0); // Only run this once when the component is mounted
   }, [user, id]);

   // Check if the current user has a completed booking for the tour
   const userCanReview = bookings.some(booking => booking.userId === user?._id && booking.status === 'confirmed');

   return (
      <section>
         <Container>
            {loading && <h4 className='text-center pt-5'>LOADING.........</h4>}
            {error && <h4 className='text-center pt-5'>{error}</h4>}
            {
               !loading && !error && tour &&
               <Row>
                  <Col lg='6'>
                     <div className="tour__content">
                        <img src={photo} alt="" />

                        <div className="tour__info">
                           <h2>{title}</h2>
                           <div className="d-flex align-items-center gap-5">
                              <span className="tour__rating d-flex align-items-center gap-1">
                                 <i className='ri-star-fill' style={{ color: 'var(--secondary-color)' }}></i> {avgRating === 0 ? null : avgRating}
                                 {avgRating === 0 ? ('Not rated') : (<span>({reviews?.length})</span>)}
                              </span>

                              <span><i className='ri-map-pin-fill'></i> {address}</span>
                           </div>
                           <div className="tour__extra-details">
                              <span><i className='ri-map-pin-2-line'></i> {city}</span>
                              <span><i className='ri-map-pin-time-line'></i> {distance} km</span>
                           </div>
                           <h5>Description</h5>
                           <p>{desc}</p>
                        </div>

                        {/* ============ Room Category Section START ============ */}
                        <div className="room-category-section mt-5">
                           <h4>Room Categories</h4>
                           <Row className="room-category-list">
                              {roomCategories.length > 0 ? (
                                 roomCategories.map((category, index) => (
                                    <Col lg="4" md="6" sm="12" key={index} className="mb-3" >
                                       <Card style={{ height: "300px" }}>
                                          <CardBody>
                                             <CardTitle tag="h5">{category.roomName}</CardTitle>
                                             <CardText>
                                                <strong>Price: </strong> {category.roomPrice} $
                                                <br />
                                                <strong>Max Occupancy: </strong>  {category.maxOccupancy} persons
                                                <br />
                                                <strong>Description: </strong> {category.description}
                                             </CardText>
                                          </CardBody>
                                       </Card>
                                    </Col>
                                 ))
                              ) : (
                                 <p>No room categories available for this hotel.</p>
                              )}
                           </Row>
                        </div>
                        {/* ============ Room Category Section END ============ */}

                        {/* ============ TOUR REVIEWS SECTION START ============ */}
                        <div className="tour__reviews mt-4">
                           <h4>Reviews ({reviews?.length} reviews)</h4>

                           {userCanReview ? (
                              <Form onSubmit={submitHandler}>
                                 <div className="d-flex align-items-center gap-3 mb-4 rating__group">
                                    <span onClick={() => setTourRating(1)}>1 <i className='ri-star-s-fill'></i></span>
                                    <span onClick={() => setTourRating(2)}>2 <i className='ri-star-s-fill'></i></span>
                                    <span onClick={() => setTourRating(3)}>3 <i className='ri-star-s-fill'></i></span>
                                    <span onClick={() => setTourRating(4)}>4 <i className='ri-star-s-fill'></i></span>
                                    <span onClick={() => setTourRating(5)}>5 <i className='ri-star-s-fill'></i></span>
                                 </div>

                                 <div className="review__input">
                                    <input type="text" ref={reviewMsgRef} placeholder='Share your thoughts' required />
                                    <button className='btn primary__btn text-white' type='submit'>
                                       Submit Review
                                    </button>
                                 </div>
                              </Form>
                           ) : (
                              <p>You need to complete a booking for this hotel before leaving a review.</p>
                           )}

                           <ListGroup className='user__reviews'>
                              {reviews?.map((review) => (
                                 <div className="review__item" key={review._id}>
                                    <img src={avatar} alt="" />

                                    <div className="w-100">
                                       <div className="d-flex align-items-center justify-content-between">
                                          <div>
                                             <h5>{review.username}</h5>
                                             <p>{new Date(review.createdAt).toLocaleDateString("en-US", options)}</p>
                                          </div>
                                          <span className='d-flex align-items-center'>
                                             {review.rating} <i className='ri-star-s-fill'></i>
                                          </span>
                                       </div>

                                       <h6>{review.reviewText}</h6>
                                    </div>
                                 </div>
                              ))}
                           </ListGroup>
                        </div>
                        {/* ============ TOUR REVIEWS SECTION END ============ */}
                     </div>
                  </Col>

                  {/* ============ BOOKING SECTION ============ */}
                  <Col lg='6'>
                     <Booking tour={tour} />
                  </Col>
               </Row>
            }
         </Container>
      </section>
   );
};

export default TourDetails;
