// context/CinemaContext.js
import { createContext, useContext, useState } from "react";

const CinemaContext = createContext();

export const CinemaProvider = ({ children }) => {
  const [selectedCinema, setSelectedCinema] = useState(null);

  return (
    <CinemaContext.Provider value={{ selectedCinema, setSelectedCinema }}>
      {children}
    </CinemaContext.Provider>
  );
};

export const useCinema = () => useContext(CinemaContext);
