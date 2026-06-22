import React, { createContext, useContext, useState, useEffect } from "react";
import pl from "../locales/pl.json";
import en from "../locales/en.json";

const LanguageContext = createContext();

const translations = { pl, en };

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("language") || "pl";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const t = (key, options = {}) => {
    let fallback = key;
    let params = {};
    if (typeof options === "string") {
      fallback = options;
    } else if (typeof options === "object" && options !== null) {
      params = options;
      if (options.defaultValue) fallback = options.defaultValue;
    }

    const keys = key.split(".");
    let value = translations[language];
    for (const k of keys) {
      if (value === undefined || value === null) return fallback;
      value = value[k];
    }
    
    if (value === undefined || value === null) return fallback;

    if (typeof value === "string") {
      let str = value;
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        str = str.replace(`{${paramKey}}`, paramVal);
      });
      return str;
    }
    return value || fallback;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
