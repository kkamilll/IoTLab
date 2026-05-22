// src/components/MainSlider.jsx
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Autoplay } from "swiper/modules";

const MainSlider = ({ materials }) => {
  return (
    <section className="w-full py-10 bg-slate-950/95">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-4 text-white">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Featured Slides
            </p>
            <h2 className="text-3xl font-bold">Latest Materials</h2>
          </div>
        </div>

        {materials.length > 0 ? (
          <Swiper
            modules={[Navigation, Autoplay]}
            navigation
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            loop
            className="rounded-3xl overflow-hidden shadow-2xl border border-white/10"
          >
            {materials
              .slice()
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((mat) => (
                <SwiperSlide key={mat._id}>
                  {mat.link ? (
                    <a
                      href={mat.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-full"
                    >
                      <img
                        src={`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/${mat.path}`}
                        alt={mat.filename || "slide"}
                        className="h-[28rem] w-full object-cover"
                      />
                    </a>
                  ) : (
                    <img
                      src={`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/${mat.path}`}
                      alt={mat.filename || "slide"}
                      className="h-[28rem] w-full object-cover"
                    />
                  )}
                </SwiperSlide>
              ))}
          </Swiper>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-12 text-center text-slate-300 shadow-inner">
            No materials available yet.
          </div>
        )}
      </div>
    </section>
  );
};

export default MainSlider;
