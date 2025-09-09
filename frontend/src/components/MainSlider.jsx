// src/components/MainSlider.jsx
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Autoplay } from "swiper/modules";

const MainSlider = ({ materials }) => {
  return (
    <section className="relative flex flex-col justify-center items-center overflow-hidden">
      {materials.length > 0 && (
        <Swiper
          modules={[Navigation, Autoplay]}
          navigation
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          loop
          className="w-full"
        >
          {materials
            .slice()
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((mat) => (
              <SwiperSlide key={mat._id}>
                {mat.link ? (
                  <a href={mat.link} target="_blank" rel="noopener noreferrer">
                    <img
                      src={`${import.meta.env.VITE_API_IP}:${import.meta.env.VITE_API_PORT}/api/${mat.path}`}
                      alt={mat.filename || "slide"}
                      className="w-full h-[25vh] sm:h-[35vh] md:h-[50vh] lg:h-[60vh] object-cover"
                    />
                  </a>
                ) : (
                  <img
                    src={`${import.meta.env.VITE_API_IP}:${import.meta.env.VITE_API_PORT}/api/${mat.path}`}
                    alt={mat.filename || "slide"}
                    className="w-full h-[25vh] sm:h-[35vh] md:h-[50vh] lg:h-[60vh] object-cover"
                  />
                )}
              </SwiperSlide>
            ))}
        </Swiper>
      )}
    </section>
  );
};

export default MainSlider;
