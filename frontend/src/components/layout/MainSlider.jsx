// src/components/MainSlider.jsx
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Autoplay } from "swiper/modules";
import { useLanguage } from "../../context/LanguageContext";

const MainSlider = ({ materials }) => {
  const { t } = useLanguage();

  return (
    <section className="w-full py-10 bg-slate-50 dark:bg-slate-900/50 transition-colors duration-300">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="mb-6 flex items-center justify-between gap-4 text-white">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400 dark:text-slate-550 font-semibold">
              {t("welcome.latestMaterials")}
            </p>
          </div>
        </div>

        {materials.length > 0 ? (
          <Swiper
            modules={[Navigation, Autoplay]}
            navigation
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            loop
            // ZMIENIONO: border-slate-200 zamiast białego borderu
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
