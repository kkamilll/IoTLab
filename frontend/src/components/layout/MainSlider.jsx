// src/components/MainSlider.jsx
import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Autoplay } from "swiper/modules";
import { useLanguage } from "../../context/LanguageContext";
import NavArrowBtn from "./NavArrowBtn";

const MainSlider = ({ materials }) => {
  const { t } = useLanguage();
  const [swiperInstance, setSwiperInstance] = useState(null);

  return (
    <section className="w-full py-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-8">
        <h2 className="text-2xl sm:text-3xl font-black mb-8 text-center tracking-tight text-slate-900 dark:text-white">
          {t("welcome.latestMaterials")}
        </h2>

        {materials.length > 0 ? (
          <div className="relative group">
            {/* Standardized Left Arrow */}
            <NavArrowBtn
              direction="left"
              onClick={() => swiperInstance?.slidePrev()}
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20"
              ariaLabel="Previous slide"
              title={t("welcome.previous") || "Poprzedni slajd"}
            />

            {/* Standardized Right Arrow */}
            <NavArrowBtn
              direction="right"
              onClick={() => swiperInstance?.slideNext()}
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20"
              ariaLabel="Next slide"
              title={t("welcome.next") || "Następny slajd"}
            />

            <Swiper
              modules={[Autoplay]}
              onSwiper={setSwiperInstance}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              loop={materials.length > 1}
              className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
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
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm transition-colors duration-300 font-medium">
            {t("welcome.noMaterials")}
          </div>
        )}
      </div>
    </section>
  );
};

export default MainSlider;
