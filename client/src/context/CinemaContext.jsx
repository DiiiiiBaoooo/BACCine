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
          const list = response.data.cinemas;
          setCinemas(list);
  
          // Nếu chưa chọn rạp thì set mặc định là cái đầu tiên
          if (list.length > 0 && !selectedCinema) {
            setSelectedCinema(list[0].id); // ✅ chỉ lưu id
            console.log('Set default cinema:', list[0].id);
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