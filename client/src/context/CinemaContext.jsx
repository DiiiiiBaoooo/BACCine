import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CinemaContext = createContext();

export const CinemaProvider = ({ children }) => {
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [cinemas, setCinemas] = useState([]);

  // Fetch available cinemas
  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const response = await axios.get('/api/cinemas');
        if (response.data.success) {
          setCinemas(response.data.cinemas);
          // Set a default cinema if none is selected
          if (response.data.cinemas.length > 0 && !selectedCinema) {
            setSelectedCinema(response.data.cinemas[0]);
            console.log('Set default cinema:', response.data.cinemas[0]);
          }
        } else {
          console.error('Failed to fetch cinemas:', response.data.message);
        }
      } catch (err) {
        console.error('Error fetching cinemas:', err);
      }
    };
    fetchCinemas();
  }, []);

  return (
    <CinemaContext.Provider value={{ selectedCinema, setSelectedCinema, cinemas }}>
      {children}
    </CinemaContext.Provider>
  );
};

export const useCinema = () => useContext(CinemaContext);