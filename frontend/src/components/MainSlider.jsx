import React, { useEffect, useState } from "react";
import { NavLink } from 'react-router';
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Autoplay } from "swiper/modules";
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';

import { Link } from "react-router-dom";

import slide_1 from '../assets/slide_1.jpg';
import slide_2 from '../assets/slide_2.jpg';
import slide_3 from '../assets/slide_3.jpg';
import slide_4 from '../assets/slide_4.jpg';

const MainSlider = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const data_temp = [
        {
            name: "TOM_1",
            text: "asdfghjklaasdfghjklaasdfghjklaasdfghjklaasdfghjkla",
            link: "https://www.w3schools.com/js/js_date_methods.asp",
            image: slide_1,
        },
        {
            name: "TOM_2",
            text: "asdfghjklaasdfghjklaasdfghjklaasdfghjklaasdfghjkla", //50 cahr
            link: "https://www.w3schools.com/js/js_date_methods.asp",
            image: slide_2,
        },
        {
            name: "TOM_3",
            text: "asdfghjklaasdfghjklaasdfghjklaasdfghjklaasdfghjkla", //50 cahr
            link: "https://www.w3schools.com/js/js_date_methods.asp",
            image: slide_3,
        },
        {
            name: "TOM_4",
            text: "asdfghjklaasdfghjklaasdfghjklaasdfghjklaasdfghjkla", //50 cahr
            link: "https://www.w3schools.com/js/js_date_methods.asp",
            image: slide_4,
        }
    ];

    return (
        <div>
            <Swiper
                className="bg-transparent"
                spaceBetween={0}
                slidesPerView={1}
                modules={[Pagination, Navigation, Autoplay]}
                pagination={{ clickable: true }}
                navigation
                // loop ={true}
                autoplay={{ delay: 2000 }}

            >
                {data_temp.map((d) => (
                    <SwiperSlide
                        className="w-full h-full mx-auto bg-transparent"
                    >
                        <div>
                            <Link to={d.link}>
                                <img src={d.image}></img>
                            </Link>

                        </div>

                    </SwiperSlide>
                ))}

            </Swiper>
        </div>
    );
}

export default MainSlider; 