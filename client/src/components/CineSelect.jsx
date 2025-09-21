import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { toast } from 'react-toastify';

const CineSelect = ({ id, onSelectCinema }) => {
  const [cinemas, setCinemas] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  // Fetch cinemas for the movie
  const fetchCinemas = async () => {
    try {
      const { data } = await axios.get(`/api/showtimes/cinemas/${id}`);
      if (data.success) {
        setCinemas(data.cinemas);
      } else {
        setError('Failed to load cinemas.');
        toast.error('Failed to load cinemas.');
      }
    } catch (error) {
      console.error('Error fetching cinemas:', error.response || error.message);
      setError('An error occurred while fetching cinemas.');
      toast.error('An error occurred while fetching cinemas.');
    }
  };

  useEffect(() => {
    if (id) {
      fetchCinemas();
    } else {
      setError('Invalid movie ID.');
      toast.error('Invalid movie ID.');
    }
  }, [id]);

  const handleCinemaSelect = (cinemaId, cinemaName) => {
    setSelected(cinemaId);
    onSelectCinema({ id: cinemaId, name: cinemaName });
  };

  return (
    <div id="cineSelect" className="pt-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative p-8 bg-primary/10 border border-primary/20 rounded-lg">
        <div className="">
          <p className="text-lg font-semibold">Choose Cinema</p>
          {error ? (
            <p className="text-red-500 mt-5">{error}</p>
          ) : cinemas.length === 0 ? (
            <p className="text-gray-400 mt-5">No cinemas available for this movie.</p>
          ) : (
            <div className="flex items-center gap-6 text-sm mt-5">
              <ChevronLeftIcon width={28} />
              <span className="grid grid-cols-3 md:flex flex-wrap md:wrap-w-lg gap-4">
                {cinemas.map((cinema) => (
                  <button
                    key={cinema.id}
                    onClick={() => handleCinemaSelect(cinema.id, cinema.name)}
                    className={`flex items-center justify-center h-14 w-32 rounded cursor-pointer p-2 transition-colors ${
                      selected === cinema.id ? 'bg-primary text-white' : 'border border-primary/70 hover:bg-primary/5'
                    }`}
                  >
                    <span className="text-sm">{cinema.name}</span>
                  </button>
                ))}
              </span>
              <ChevronRightIcon width={28} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CineSelect;