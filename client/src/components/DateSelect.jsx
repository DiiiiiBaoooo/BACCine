import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const DateSelect = ({ dateTime, id, selectedCinema }) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  // Extract unique dates from dateTime array
  const uniqueDates = Array.isArray(dateTime)
    ? [...new Set(dateTime.map((show) => new Date(show.start_time).toISOString().split('T')[0]))]
    : [];

  const onBookHandler = () => {
    if (!selected) {
      return toast.error('Please select a date');
    }
    navigate(`/movies/${id}/${encodeURIComponent(selectedCinema)}/${selected}`);
    window.scrollTo(0, 0);
  };

  return (
    <div id="dateSelect" className="pt-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative p-8 bg-primary/10 border border-primary/20 rounded-lg">
        <div className="">
          <p className="text-lg font-semibold">Choose Date</p>
          {uniqueDates.length === 0 ? (
            <p className="text-gray-400 mt-5">No showtimes available for this cinema.</p>
          ) : (
            <div className="flex items-center gap-6 text-sm mt-5">
              <ChevronLeftIcon width={28} />
              <span className="grid grid-cols-3 md:flex flex-wrap md:wrap-w-lg gap-4">
                {uniqueDates.map((date) => (
                  <button
                    key={date}
                    onClick={() => setSelected(date)}
                    className={`flex flex-col items-center justify-center h-14 w-14 aspect-square rounded cursor-pointer ${
                      selected === date ? 'bg-primary text-white' : 'border border-primary/70'
                    }`}
                  >
                    <span>{new Date(date).getDate()}</span>
                    <span>{new Date(date).toLocaleDateString('en-US', { month: 'short' })}</span>
                  </button>
                ))}
              </span>
              <ChevronRightIcon width={28} />
            </div>
          )}
        </div>
        <button
          onClick={onBookHandler}
          className="bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer"
        >
          Book Now
        </button>
      </div>
    </div>
  );
};

export default DateSelect;