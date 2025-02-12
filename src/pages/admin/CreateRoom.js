import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Row, Col, Card, Alert } from 'react-bootstrap';
import '../../styles/tourStyle.css';

function CreateRoom() {
    const [formData, setFormData] = useState({
        roomName: '',
        hotelId: '',
        roomPrice: '',
        maxOccupancy: '',
        quantity: '',
        description: '',
    });

    const [hotels, setHotels] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const fileInput = useRef(null);

    const navigate = useNavigate();

    // Fetch hotels khi component mount
    useEffect(() => {
        const fetchHotels = async () => {
            const token = localStorage.getItem("accessToken");
            try {
                const response = await fetch("http://localhost:8000/api/v1/tours", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();

                if (data.success && Array.isArray(data.data)) {
                    setHotels(data.data);
                } else {
                    setError("Invalid data format");
                }
            } catch (error) {
                setError("Error fetching hotels.");
            }
        };

        fetchHotels();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        // Kiểm tra các trường bắt buộc
        if (!formData.roomName || !formData.hotelId || !formData.roomPrice || !formData.maxOccupancy || !formData.quantity || !formData.description) {
            setError("All fields are required.");
            return;
        }

        const token = localStorage.getItem("accessToken");
        const roomData = new FormData();
        roomData.append('roomName', formData.roomName);
        roomData.append('hotelId', formData.hotelId);
        roomData.append('roomPrice', formData.roomPrice);
        roomData.append('maxOccupancy', formData.maxOccupancy);
        roomData.append('quantity', formData.quantity);
        roomData.append('description', formData.description);

        if (fileInput.current.files[0]) {
            roomData.append('file', fileInput.current.files[0]);
        }

        setIsLoading(true);
        try {
            const response = await fetch("http://localhost:8000/api/v1/roomCategory", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: roomData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(`Failed to create room category: ${errorData.message || "Unknown error"}`);
                setIsLoading(false);
                return;
            }

            const result = await response.json();
            if (result.success) {
                setSuccess("Room created successfully!");
                setTimeout(() => {
                    navigate('/room-management');
                }, 2000);
            } else {
                setError(`Failed to create room category: ${result.message || "Unknown error"}`);
            }
        } catch (error) {
            setError(`Error creating room: ${error.message}`);
        }
        setIsLoading(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    return (
        <div className="container mt-5">
            <h2 className="title text-center mb-4">Create Room</h2>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Card className="p-4 shadow-sm">
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="formRoomName">
                                <Form.Label>Room Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="roomName"
                                    value={formData.roomName}
                                    onChange={handleInputChange}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="formHotel">
                                <Form.Label>Hotel</Form.Label>
                                <Form.Control
                                    as="select"
                                    name="hotelId"
                                    value={formData.hotelId}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select a hotel</option>
                                    {hotels.map((hotel) => (
                                        <option key={hotel._id} value={hotel._id}>
                                            {hotel.title}
                                        </option>
                                    ))}
                                </Form.Control>
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="formRoomPrice">
                                <Form.Label>Room Price ($)</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="roomPrice"
                                    value={formData.roomPrice}
                                    onChange={handleInputChange}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="formMaxOccupancy">
                                <Form.Label>Max Occupancy</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="maxOccupancy"
                                    value={formData.maxOccupancy}
                                    onChange={handleInputChange}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="formQuantity">
                                <Form.Label>Quantity</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="formDescription">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="formPhoto">
                                <Form.Label>Photo</Form.Label>
                                <Form.Control type="file" name="file" ref={fileInput} />
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="text-center">
                        <Button variant="primary" type="submit" className="px-5" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Room"}
                        </Button>
                    </div>
                </Card>
            </Form>
        </div>
    );
}

export default CreateRoom;