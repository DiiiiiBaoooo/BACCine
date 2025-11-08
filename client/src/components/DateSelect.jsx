import { parseISO, format } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const DateSelect = ({ dateTime, movieId, cinemaId, cinemaName }) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  // Extract unique dates, treating start_time as UTC
  const uniqueDates = Array.isArray(dateTime)
    ? [...new Set(dateTime.map((show) => format(parseISO(show.start_time), 'yyyy-MM-dd')))]
    : [];

  const onBookHandler = () => {
    if (!selected) {
      return toast.error('Please select a date');
    }
    const url = `/movies/${movieId}/${cinemaId}/${selected}`;
    navigate(url);
    window.scrollTo(0, 0);
  };

  return (
    <div id="dateSelect" className="pt-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative p-8 bg-primary/10 border border-primary/20 rounded-lg">
        <div>
          <p className="text-lg font-semibold">Chọn ngày</p>
          {uniqueDates.length === 0 ? (
            <p className="text-gray-400 mt-5">Không có suất chiếu nào</p>
          ) : (
            <div className="flex items-center gap-6 text-sm mt-5">
              <ChevronLeftIcon width={28} />
              <span className="grid grid-cols-3 md:flex flex-wrap md:wrap-w-lg gap-4">
                {uniqueDates.map((date) => {
                  const dateObj = parseISO(date); // Parse as UTC
                  return (
                    <button
                      key={date}
                      onClick={() => setSelected(date)}
                      className={`flex flex-col items-center justify-center h-14 w-14 aspect-square rounded cursor-pointer transition-colors ${
                        selected === date ? 'bg-primary text-white' : 'border border-primary/70 hover:bg-primary/5'
                      }`}
                    >
                      <span className="font-medium">{format(dateObj, 'd')}</span>
                      <span className="text-xs">{format(dateObj, 'MMM')}</span>
                    </button>
                  );
                })}
              </span>
              <ChevronRightIcon width={28} />
            </div>
          )}
        </div>
        <button
          onClick={onBookHandler}
          disabled={!selected}
          className={`px-8 py-2 mt-6 rounded transition-all ${
            selected 
              ? 'bg-primary text-white hover:bg-primary/90 cursor-pointer' 
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
        >
          Đặt vé ngay
        </button>
      </div>
    </div>
  );
};

export default DateSelect;