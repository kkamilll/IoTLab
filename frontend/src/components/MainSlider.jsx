import React, { useEffect, useState } from "react";
import { NavLink } from 'react-router';
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { Pagination } from "swiper/modules";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Autoplay } from "swiper/modules";

const MainSlider = ({ materials }) => {
    return (
        <section className="relative flex flex-col justify-center items-center min-h-[60vh] bg-gradient-to-b from-blue-900 to-blue-700 overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          {materials.length > 0 && (
            <Swiper
              modules={[Navigation, Autoplay]}
              navigation
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              loop
              className="w-full h-full"
            >
              {materials
                .slice()
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((mat) => (
                  <SwiperSlide key={mat._id}>
                    {mat.link ? (
                      <a href={mat.link} target="_blank" rel="noopener noreferrer">
                        <img
                          src={`http://localhost:3500/${mat.path}`}
                          alt={mat.filename || "slide"}
                          className="w-full h-[60vh] object-cover rounded-xl"
                        />
                      </a>
                    ) : (
                      <img
                        src={`http://localhost:3500/${mat.path}`}
                        alt={mat.filename || "slide"}
                        className="w-full h-[60vh] object-cover rounded-xl"
                      />
                    )}
                  </SwiperSlide>
                ))}
            </Swiper>
          )}
        </div>
      </section>
    );
}

export default MainSlider; 