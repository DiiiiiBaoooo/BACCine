from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
import requests
from datetime import datetime, timedelta
import logging

API_BASE_URL = "http://localhost:3000/api"
logger = logging.getLogger(__name__)

class ActionGetShowtimes(Action):
    def name(self) -> Text:
        return "action_get_showtimes"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        movie_name = tracker.get_slot("movie_name")
        cinema_name = tracker.get_slot("cinema_name")
        date = tracker.get_slot("date")
        
        logger.info(f"Slots - movie: {movie_name}, cinema: {cinema_name}, date: {date}")
        
        if date:
            parsed_date = self.parse_date(date)
        else:
            parsed_date = datetime.now().strftime("%Y-%m-%d")
        
        try:
            if movie_name:
                return self.get_showtimes_by_movie(
                    dispatcher, movie_name, cinema_name, parsed_date
                )
            elif cinema_name:
                return self.get_showtimes_by_cinema(
                    dispatcher, cinema_name, parsed_date
                )
            else:
                dispatcher.utter_message(
                    text="Bạn muốn xem lịch chiếu của phim nào? Hoặc bạn muốn xem lịch chiếu tại rạp nào?"
                )
                return []
                
        except Exception as e:
            logger.error(f"Error in get_showtimes: {str(e)}", exc_info=True)
            dispatcher.utter_message(
                text="Xin lỗi, có lỗi xảy ra khi lấy thông tin lịch chiếu."
            )
        
        return []
    
    def get_showtimes_by_movie(self, dispatcher, movie_name, cinema_name, date):
        try:
            movie_id, movie_info = self.find_movie_id(movie_name)
            
            if not movie_id:
                dispatcher.utter_message(
                    text=f"❌ Không tìm thấy phim '{movie_name}' trong hệ thống.\n"
                         "Vui lòng kiểm tra lại tên phim."
                )
                return []
            
            response = requests.get(
                f"{API_BASE_URL}/showtimes/movies/{movie_id}",
                timeout=5
            )
            
            logger.info(f"API Response status: {response.status_code}")
            
            if response.status_code != 200:
                dispatcher.utter_message(
                    text=f"Không thể lấy thông tin lịch chiếu cho phim '{movie_name}'."
                )
                return []
            
            data = response.json()
            logger.info(f"Response data keys: {data.keys() if isinstance(data, dict) else 'not dict'}")
            
            if not data.get('success'):
                dispatcher.utter_message(text="Không có dữ liệu lịch chiếu.")
                return []
            
            movie_data = data.get('movie', {})
            showtimes = data.get('dateTime', [])
            
            if not showtimes:
                dispatcher.utter_message(
                    text=f"Hiện tại chưa có lịch chiếu cho phim '{movie_name}'."
                )
                return []
            
            if cinema_name:
                cinema_name_lower = cinema_name.lower()
                showtimes = [
                    st for st in showtimes
                    if cinema_name_lower in str(st.get('cinema_name', '')).lower()
                ]
                
                if not showtimes:
                    dispatcher.utter_message(
                        text=f"Phim '{movie_name}' không chiếu tại rạp '{cinema_name}'."
                    )
                    return []
            
            filtered_by_date = []
            for st in showtimes:
                start_time = st.get('start_time', '')
                if start_time:
                    try:
                        st_date = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                        st_date_str = st_date.strftime('%Y-%m-%d')
                        
                        if st_date_str == date:
                            filtered_by_date.append({**st, 'parsed_date': st_date})
                    except Exception as e:
                        logger.warning(f"Cannot parse date: {start_time}")
            
            if not filtered_by_date:
                logger.info(f"No showtimes on {date}, showing all available dates")
                for st in showtimes:
                    start_time = st.get('start_time', '')
                    if start_time:
                        try:
                            st_date = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                            filtered_by_date.append({**st, 'parsed_date': st_date})
                        except:
                            pass
            
            if not filtered_by_date:
                dispatcher.utter_message(
                    text=f"Không tìm thấy lịch chiếu phù hợp."
                )
                return []
            
            self.display_movie_showtimes(
                dispatcher, 
                movie_data, 
                filtered_by_date, 
                cinema_name,
                date
            )
            
            return []
            
        except Exception as e:
            logger.error(f"Error in get_showtimes_by_movie: {str(e)}", exc_info=True)
            raise
    
    def get_showtimes_by_cinema(self, dispatcher, cinema_name, date):
        try:
            cinema_id = self.find_cinema_id(cinema_name)
            
            if not cinema_id:
                dispatcher.utter_message(
                    text=f"❌ Không tìm thấy rạp '{cinema_name}' trong hệ thống."
                )
                return []
            
            response = requests.get(
                f"{API_BASE_URL}/showtimes/datve/{cinema_id}/{date}",
                timeout=5
            )
            
            if response.status_code != 200:
                dispatcher.utter_message(
                    text=f"Không thể lấy thông tin lịch chiếu cho rạp '{cinema_name}'."
                )
                return []
            
            showtimes = response.json()
            
            if isinstance(showtimes, dict):
                showtimes = showtimes.get('data', []) or showtimes.get('showtimes', [])
            
            if not showtimes:
                dispatcher.utter_message(
                    text=f"Rạp '{cinema_name}' chưa có lịch chiếu vào ngày {date}."
                )
                return []
            
            self.display_cinema_showtimes(dispatcher, cinema_name, showtimes, date)
            
            return []
            
        except Exception as e:
            logger.error(f"Error in get_showtimes_by_cinema: {str(e)}", exc_info=True)
            raise
    
    def display_movie_showtimes(self, dispatcher, movie_data, showtimes, cinema_filter, date):
        title = movie_data.get('title', 'N/A')
        runtime = movie_data.get('runtime', 'N/A')
        genres = movie_data.get('genres', [])
        vote_avg = movie_data.get('vote_average', 'N/A')
        
        message = f"🎬 **{title}**\n"
        message += f"⏱️ Thời lượng: {runtime} phút\n"
        if genres:
            message += f"🎭 Thể loại: {', '.join(genres)}\n"
        if vote_avg != 'N/A':
            message += f"⭐ Đánh giá: {vote_avg}/10\n"
        message += "\n📅 **LỊCH CHIẾU:**\n\n"
        
        grouped_by_cinema = {}
        for st in showtimes:
            cinema = st.get('cinema_name', 'Rạp không xác định')
            if cinema not in grouped_by_cinema:
                grouped_by_cinema[cinema] = []
            grouped_by_cinema[cinema].append(st)
        
        for cinema, times in grouped_by_cinema.items():
            times.sort(key=lambda x: x.get('parsed_date', datetime.now()))
        
        for cinema, times in grouped_by_cinema.items():
            message += f"🏢 **{cinema}**\n"
            
            for st in times[:10]:
                showtime_id = st.get('id', 'N/A')
                room = st.get('room_name', 'N/A')
                parsed_date = st.get('parsed_date')
                
                if parsed_date:
                    time_str = parsed_date.strftime('%H:%M')
                    date_str = parsed_date.strftime('%d/%m')
                else:
                    time_str = 'N/A'
                    date_str = 'N/A'
                
                message += f"   • {date_str} - {time_str} | Phòng {room} | ID: {showtime_id}\n"
            
            message += "\n"
        
        message += "💡 **Để đặt vé:**\n"
        message += "Vui lòng nhớ **ID suất chiếu** (ví dụ: ID: 5)\n"
        message += "Sau đó bạn có thể xem ghế trống hoặc đặt vé ngay!"
        
        dispatcher.utter_message(text=message)
    
    def display_cinema_showtimes(self, dispatcher, cinema_name, showtimes, date):
        message = f"🏢 **Lịch chiếu tại {cinema_name}**\n"
        message += f"📅 Ngày {date}\n\n"
        
        grouped_by_movie = {}
        for st in showtimes:
            movie = st.get('movie_title', '') or st.get('title', 'Phim không xác định')
            if movie not in grouped_by_movie:
                grouped_by_movie[movie] = []
            grouped_by_movie[movie].append(st)
        
        for movie, times in grouped_by_movie.items():
            message += f"🎬 **{movie}**\n"
            
            for st in times[:8]:
                showtime_id = st.get('id', 'N/A')
                show_time = st.get('show_time', '') or st.get('time', 'N/A')
                room = st.get('room_name', 'N/A')
                price = st.get('ticket_price', '')
                
                message += f"   • {show_time} | Phòng {room} | ID: {showtime_id}"
                if price:
                    message += f" | {price} VND"
                message += "\n"
            
            message += "\n"
        
        message += "💡 Để đặt vé, hãy nhớ ID suất chiếu bạn muốn xem!"
        
        dispatcher.utter_message(text=message)
    
    def find_movie_id(self, movie_name):
        try:
            response = requests.get(f"{API_BASE_URL}/movies", timeout=5)
            
            if response.status_code != 200:
                return None, None
            
            movies_data = response.json()
            
            if isinstance(movies_data, dict):
                movies = movies_data.get('data', []) or movies_data.get('movies', [])
            elif isinstance(movies_data, list):
                movies = movies_data
            else:
                return None, None
            
            movie_name_lower = movie_name.lower()
            
            for movie in movies:
                if not isinstance(movie, dict):
                    continue
                
                title = str(movie.get('title', '') or movie.get('movie_name', '')).lower()
                
                if title == movie_name_lower:
                    movie_id = movie.get('movie_id') or movie.get('id')
                    return movie_id, movie
            
            for movie in movies:
                if not isinstance(movie, dict):
                    continue
                
                title = str(movie.get('title', '') or movie.get('movie_name', '')).lower()
                
                if movie_name_lower in title or title in movie_name_lower:
                    movie_id = movie.get('movie_id') or movie.get('id')
                    return movie_id, movie
            
            return None, None
            
        except Exception as e:
            logger.error(f"Error finding movie: {str(e)}")
            return None, None
    
    def find_cinema_id(self, cinema_name):
        try:
            response = requests.get(f"{API_BASE_URL}/cinemas", timeout=5)
            
            if response.status_code != 200:
                return None
            
            cinemas_data = response.json()
            
            if isinstance(cinemas_data, dict):
                cinemas = cinemas_data.get('cinemas', []) or cinemas_data.get('data', [])
            elif isinstance(cinemas_data, list):
                cinemas = cinemas_data
            else:
                return None
            
            cinema_name_lower = cinema_name.lower()
            
            for cinema in cinemas:
                if not isinstance(cinema, dict):
                    continue
                
                name = str(cinema.get('cinema_name', '') or cinema.get('name', '')).lower()
                
                if cinema_name_lower in name or name in cinema_name_lower:
                    return cinema.get('id') or cinema.get('cinema_id')
            
            return None
            
        except Exception as e:
            logger.error(f"Error finding cinema: {str(e)}")
            return None
    
    def parse_date(self, date_str):
        if not date_str or not isinstance(date_str, str):
            return datetime.now().strftime("%Y-%m-%d")
        
        today = datetime.now()
        date_str = str(date_str).strip().lower()
        
        if date_str in ["hôm nay", "hom nay", "today"]:
            return today.strftime("%Y-%m-%d")
        elif date_str in ["ngày mai", "ngay mai", "tomorrow"]:
            return (today + timedelta(days=1)).strftime("%Y-%m-%d")
        
        date_formats = ["%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y"]
        for fmt in date_formats:
            try:
                parsed = datetime.strptime(date_str, fmt)
                return parsed.strftime("%Y-%m-%d")
            except ValueError:
                continue
        
        return today.strftime("%Y-%m-%d")


class ActionGetAvailableSeats(Action):
    def name(self) -> Text:
        return "action_get_available_seats"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        showtime_id = tracker.get_slot("showtime_id")
        
        if not showtime_id:
            dispatcher.utter_message(
                text="❓ Bạn chưa cung cấp mã suất chiếu.\n\n"
                     "📌 Vui lòng xem lịch chiếu trước, sau đó cho tôi biết **ID suất chiếu** bạn muốn xem.\n"
                     "Ví dụ: 'Xem ghế trống suất 5' hoặc 'Kiểm tra ghế ID 7'"
            )
            return []
        
        try:
            response = requests.get(
                f"{API_BASE_URL}/showtimes/seats-status/{showtime_id}",
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if not data.get('success'):
                    dispatcher.utter_message(
                        text="❌ Không thể lấy thông tin ghế. Vui lòng thử lại."
                    )
                    return []
                
                summary = data.get('summary', {})
                room_info = data.get('roomInfo', {})
                available_seats = data.get('availableSeats', [])
                available_by_type = data.get('availableByType', {})
                occupied_seats = data.get('occupiedSeats', [])
                
                logger.info(f"Showtime {showtime_id}: {summary.get('available')} available, {summary.get('booked') + summary.get('reserved')} occupied")
                
                message = f"🎫 **Suất chiếu ID: {showtime_id}**\n"
                message += f"🏢 Phòng: {room_info.get('room_name', 'N/A')}\n\n"
                
                message += f"📊 **Tình trạng ghế:**\n"
                message += f"• Tổng số ghế: {summary.get('total', 0)}\n"
                message += f"• ✅ Còn trống: **{summary.get('available', 0)} ghế**\n"
                message += f"• ❌ Đã đặt: {summary.get('booked', 0) + summary.get('reserved', 0)} ghế\n\n"
                
                if summary.get('available', 0) > 0:
                    message += "🪑 **GHẾ CÒN TRỐNG:**\n\n"
                    
                    for type_name, seats in available_by_type.items():
                        emoji = self.get_seat_type_emoji(type_name)
                        message += f"{emoji} **{type_name.capitalize()}** ({len(seats)} ghế):\n"
                        
                        seat_numbers = [s.get('seat_number', '') for s in seats]
                        seat_numbers = [s for s in seat_numbers if s]
                        
                        if len(seat_numbers) > 30:
                            display = ", ".join(seat_numbers[:30])
                            message += f"   {display}\n"
                            message += f"   ... và {len(seat_numbers) - 30} ghế khác\n"
                        else:
                            display = ", ".join(seat_numbers)
                            message += f"   {display}\n"
                        message += "\n"
                    
                    message += "💡 **Để đặt vé:**\n"
                    message += f"Nói: 'Đặt vé suất {showtime_id}, ghế A1 A2'\n"
                    message += "(Thay A1, A2 bằng ghế bạn muốn từ danh sách trên)"
                    
                else:
                    message += "😢 **Rất tiếc, suất chiếu này đã HẾT GHẾ!**\n\n"
                    message += "Vui lòng chọn suất chiếu khác."
                
                dispatcher.utter_message(text=message)
                
            elif response.status_code == 404:
                dispatcher.utter_message(
                    text=f"❌ Không tìm thấy suất chiếu ID {showtime_id}.\n"
                         "Vui lòng kiểm tra lại ID suất chiếu."
                )
            elif response.status_code == 400:
                dispatcher.utter_message(
                    text=f"❌ Mã suất chiếu '{showtime_id}' không hợp lệ."
                )
            else:
                dispatcher.utter_message(
                    text=f"❌ Lỗi khi lấy thông tin ghế (HTTP {response.status_code})."
                )
                
        except requests.exceptions.Timeout:
            dispatcher.utter_message(text="⏱️ Timeout khi kết nối API. Vui lòng thử lại.")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error in get seats: {str(e)}")
            dispatcher.utter_message(text="❌ Lỗi kết nối API. Vui lòng kiểm tra backend server.")
        except Exception as e:
            logger.error(f"Error in get seats: {str(e)}", exc_info=True)
            dispatcher.utter_message(text="❌ Có lỗi xảy ra khi lấy thông tin ghế.")
        
        return []
    
    def get_seat_type_emoji(self, type_name):
        type_map = {
            'standard': '🪑',
            'normal': '🪑',
            'vip': '⭐',
            'couple': '💑',
            'sweetbox': '💑'
        }
        return type_map.get(type_name.lower(), '🪑')


class ActionCreateBooking(Action):
    def name(self) -> Text:
        return "action_create_booking"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        showtime_id = tracker.get_slot("showtime_id")
        seat_numbers = tracker.get_slot("seat_numbers")
        user_id = tracker.get_slot("user_id") or "guest_user"
        logger.info(f"Retrieved user_id: {user_id} (type: {type(user_id)})")
        # Lấy từ latest message nếu slot trống
        if not showtime_id or not seat_numbers:
            latest_message = tracker.latest_message.get('text', '')
            logger.info(f"Latest message: {latest_message}")
            
            if not showtime_id:
                import re
                showtime_match = re.search(r'suất\s+(\d+)', latest_message, re.IGNORECASE)
                if showtime_match:
                    showtime_id = showtime_match.group(1)
                    logger.info(f"Extracted showtime_id: {showtime_id}")
            
            if not seat_numbers:
                seat_numbers = self.extract_seat_numbers(latest_message)
                logger.info(f"Extracted seats: {seat_numbers}")
        
        if not showtime_id:
            dispatcher.utter_message(
                text="❌ Thiếu **mã suất chiếu**.\n"
                     "Vui lòng nói lại với format: 'Đặt vé suất [ID], ghế [A1 A2]'"
            )
            return []
        
        if not seat_numbers or (isinstance(seat_numbers, list) and len(seat_numbers) == 0):
            dispatcher.utter_message(
                text="❌ Bạn chưa chọn **ghế ngồi**.\n"
                     "Vui lòng nói lại: 'Đặt vé suất " + str(showtime_id) + ", ghế A1 A2'"
            )
            return []
        
        # Đảm bảo seat_numbers là list
        if isinstance(seat_numbers, str):
            seat_numbers = [s.strip() for s in seat_numbers.replace(',', ' ').split()]
        
        try:
            # ========================================
            # BƯỚC 1: Lấy thông tin ghế trước (để validate showtime tồn tại)
            # ========================================
            seat_response = requests.get(
                f"{API_BASE_URL}/showtimes/seats-status/{showtime_id}",
                timeout=5
            )
            
            if seat_response.status_code != 200:
                dispatcher.utter_message(
                    text=f"❌ Không thể lấy thông tin ghế cho suất chiếu ID {showtime_id}"
                )
                return []
            
            seat_data = seat_response.json()
            if not seat_data.get('success'):
                dispatcher.utter_message(text="❌ Không thể lấy thông tin ghế")
                return []
            
            # Lấy danh sách ghế available
            available_seats = seat_data.get('availableSeats', [])
            
            # Thử lấy cinema_id từ roomInfo hoặc các field khác
            room_info = seat_data.get('roomInfo', {})
            cinema_id = (
                seat_data.get('cinema_id') or 
                seat_data.get('cinemaId') or 
                seat_data.get('cinema_cluster_id') or
                room_info.get('cinema_id') or
                room_info.get('cinema_cluster_id')
            )
            
            logger.info(f"Seat data keys: {seat_data.keys()}")
            logger.info(f"Room info: {room_info}")
            logger.info(f"Extracted cinema_id: {cinema_id}")
            
            # Nếu không tìm thấy cinema_id, thử query từ showtimes/all
            if not cinema_id:
                logger.info("Cinema ID not found in seat data, trying /showtimes/all")
                
                showtime_response = requests.get(
                    f"{API_BASE_URL}/showtimes/all",
                    timeout=5
                )
                
                if showtime_response.status_code == 200:
                    all_showtimes = showtime_response.json()
                    
                    logger.info(f"All showtimes response type: {type(all_showtimes)}")
                    
                    # Parse response
                    showtimes_list = []
                    if isinstance(all_showtimes, list):
                        showtimes_list = all_showtimes
                    elif isinstance(all_showtimes, dict):
                        showtimes_list = (
                            all_showtimes.get('data', []) or 
                            all_showtimes.get('showtimes', []) or
                            all_showtimes.get('dateTime', [])
                        )
                    
                    logger.info(f"Showtimes list length: {len(showtimes_list)}")
                    
                    # Tìm showtime với showtime_id
                    showtime_info = next((st for st in showtimes_list if st.get('id') == int(showtime_id)), None)
                    
                    if showtime_info:
                        cinema_id = (
                            showtime_info.get('cinema_id') or 
                            showtime_info.get('cinemaId') or 
                            showtime_info.get('cinema_cluster_id')
                        )
                        logger.info(f"Found showtime info: {showtime_info.keys()}")
                        logger.info(f"Extracted cinema_id from showtime: {cinema_id}")
            
            # Nếu vẫn không có cinema_id, dùng giá trị mặc định từ context
            # hoặc yêu cầu user cung cấp
            if not cinema_id:
                # Thử lấy từ conversation context (cinema được chọn trước đó)
                cinema_name = tracker.get_slot("cinema_name")
                if cinema_name:
                    logger.info(f"Trying to find cinema_id from name: {cinema_name}")
                    cinema_id = self.find_cinema_id_from_name(cinema_name)
                    logger.info(f"Found cinema_id from name: {cinema_id}")
            
            if not cinema_id:
                dispatcher.utter_message(
                    text="❌ Không thể xác định rạp chiếu.\n\n"
                         "Vui lòng thử lại bằng cách:\n"
                         "1. Xem lịch chiếu phim tại rạp trước\n"
                         "2. Sau đó đặt vé với ID suất chiếu\n\n"
                         "Ví dụ: 'Lịch chiếu tại BAC Quang Trung' → sau đó 'Đặt vé suất 7, ghế A1 A2'"
                )
                return []
            
            logger.info(f"Final cinema_id: {cinema_id} for showtime {showtime_id}")
            
            # ========================================
            # BƯỚC 2: Lấy thông tin showtime để có date
            # ========================================
            # Cần date để lấy giá vé từ /ticket-prices/getprice/:cinemaId/:date
            showtime_date = None
            
            # Thử lấy từ available_seats (có thể có start_time)
            if available_seats and len(available_seats) > 0:
                # Seats có thể có thông tin showtime
                pass
            
            # Hoặc query lại từ API showtimes
            try:
                showtime_detail_response = requests.get(
                    f"{API_BASE_URL}/showtimes/all",
                    timeout=5
                )
                
                if showtime_detail_response.status_code == 200:
                    all_st = showtime_detail_response.json()
                    st_list = []
                    
                    if isinstance(all_st, dict):
                        st_list = all_st.get('showtimes', []) or all_st.get('data', [])
                    elif isinstance(all_st, list):
                        st_list = all_st
                    
                    # Tìm showtime
                    st_info = next((s for s in st_list if str(s.get('id')) == str(showtime_id)), None)
                    
                    if st_info:
                        start_time = st_info.get('start_time') or st_info.get('show_time')
                        if start_time:
                            try:
                                # Parse ISO date: "2025-10-11T23:10:00.000Z"
                                dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                                showtime_date = dt.strftime('%Y-%m-%d')
                                logger.info(f"Extracted showtime date: {showtime_date}")
                            except:
                                pass
            except Exception as e:
                logger.warning(f"Could not get showtime date: {e}")
            
            # Fallback to today if can't find date
            if not showtime_date:
                showtime_date = datetime.now().strftime('%Y-%m-%d')
                logger.info(f"Using today as fallback date: {showtime_date}")
            
            # ========================================
            # BƯỚC 3: Lấy giá vé từ ticket-prices API
            # ========================================
            ticket_prices_map = {}
            
            try:
                price_response = requests.get(
                    f"{API_BASE_URL}/ticket-prices/getprice/{cinema_id}/{showtime_date}",
                    timeout=5
                )
                
                logger.info(f"Ticket prices API status: {price_response.status_code}")
                
                if price_response.status_code == 200:
                    price_data = price_response.json()
                    logger.info(f"Price data: {price_data}")
                    
                    # Parse response (có thể là list hoặc dict)
                    prices = []
                    if isinstance(price_data, dict):
                        prices = price_data.get('prices', []) or price_data.get('data', [])
                    elif isinstance(price_data, list):
                        prices = price_data
                    
                    # Map seat_type → price
                    for price_item in prices:
                        seat_type = (
                            price_item.get('seat_type') or 
                            price_item.get('seat_type_name') or
                            price_item.get('type')
                        )
                        base_price = price_item.get('base_price') or price_item.get('price')
                        
                        if seat_type and base_price:
                            ticket_prices_map[seat_type.lower()] = float(base_price)
                    
                    logger.info(f"Ticket prices map: {ticket_prices_map}")
                else:
                    logger.warning(f"Could not get ticket prices: HTTP {price_response.status_code}")
            except Exception as e:
                logger.error(f"Error getting ticket prices: {e}")
            
            # Nếu không lấy được giá, dùng giá mặc định
            if not ticket_prices_map:
                ticket_prices_map = {
                    'standard': 50000,
                    'normal': 50000,
                    'vip': 80000,
                    'couple': 150000,
                    'sweetbox': 150000
                }
                logger.warning(f"Using default prices: {ticket_prices_map}")
            
            # ========================================
            # BƯỚC 4: Chuẩn bị tickets array với đúng format
            # ========================================
            tickets = []
            for seat_number in seat_numbers:
                # Tìm seat trong available_seats
                seat_info = next((s for s in available_seats if s.get('seat_number') == seat_number), None)
                
                if not seat_info:
                    dispatcher.utter_message(
                        text=f"❌ Ghế **{seat_number}** không khả dụng hoặc đã được đặt!"
                    )
                    return []
                
                # Lấy seat_type từ seat_info
                seat_type = (
                    seat_info.get('seat_type') or 
                    seat_info.get('type') or 
                    seat_info.get('seat_type_name') or
                    'standard'
                ).lower()
                
                logger.info(f"Seat {seat_number}: type = {seat_type}")
                
                # Lấy ticket_price từ map theo seat_type
                ticket_price = ticket_prices_map.get(seat_type)
                
                # Fallback nếu không tìm thấy
                if not ticket_price:
                    ticket_price = ticket_prices_map.get('standard', 50000)
                    logger.warning(f"Price not found for type {seat_type}, using default: {ticket_price}")
                
                # Ensure ticket_price is number
                ticket_price = float(ticket_price)
                
                # Backend expects seat_id to be seat_number (A1, A2, etc)
                tickets.append({
                    "seat_id": seat_number,  # seat_number như A1, A2
                    "ticket_price": ticket_price  # Phải là number
                })
            
            logger.info(f"Prepared tickets: {tickets}")
            
            # Validate tickets trước khi gửi
            for ticket in tickets:
                if not ticket.get('seat_id'):
                    dispatcher.utter_message(text="❌ Lỗi: seat_id bị thiếu")
                    return []
                if not ticket.get('ticket_price') or not isinstance(ticket['ticket_price'], (int, float)):
                    dispatcher.utter_message(
                        text=f"❌ Lỗi: Không lấy được giá vé cho ghế {ticket.get('seat_id')}\n"
                             f"ticket_price = {ticket.get('ticket_price')} (type: {type(ticket.get('ticket_price'))})"
                    )
                    return []
            
            # ========================================
            # BƯỚC 3: Chuẩn bị dữ liệu booking với đầy đủ trường
            # ========================================
            booking_data = {
                "cinema_id": cinema_id,
                "user_id": user_id,
                "showtime_id": int(showtime_id),
                "tickets": tickets,
                "services": [],
                "payment_method": "qr code",  # Mặc định QR code
                "status": "pending"  # Mặc định pending
            }
            
            logger.info(f"Creating booking: {booking_data}")
            
            # ========================================
            # BƯỚC 5: Gọi API tạo booking
            # ========================================
            response = requests.post(
                f"{API_BASE_URL}/bookings/create-booking",
                json=booking_data,
                timeout=10
            )
            
            logger.info(f"Booking response status: {response.status_code}")
            
            if response.status_code == 201 or response.status_code == 200:
                result = response.json()
                
                if not result.get('success'):
                    error_msg = result.get('message', 'Lỗi không xác định')
                    dispatcher.utter_message(
                        text=f"❌ **Đặt vé thất bại!**\n\nLý do: {error_msg}"
                    )
                    return []
                
                data = result.get('data', {})
                order_id = data.get('order_id')
                
                if order_id:
                    seats_display = ', '.join(seat_numbers) if isinstance(seat_numbers, list) else seat_numbers
                    grand_total = data.get('grand_total', 0)
                    
                    message = "✅ **ĐẶT VÉ THÀNH CÔNG!**\n\n"
                    message += f"📋 **Mã đơn hàng:** {order_id}\n"
                    message += f"🎬 **Suất chiếu:** ID {showtime_id}\n"
                    message += f"🪑 **Ghế đã đặt:** {seats_display}\n"
                    message += f"💰 **Tổng tiền:** {grand_total:,} VND\n\n"
                    message += "⏰ Vui lòng **thanh toán trong 15 phút** để giữ vé!\n\n"
                    message += "💳 Bạn có thể hỏi: 'Thanh toán như thế nào?' để được hướng dẫn."
                    
                    dispatcher.utter_message(text=message)
                    return [
                        SlotSet("order_id", order_id),
                        SlotSet("grand_total", float(grand_total)),  # Add this line
                        SlotSet("showtime_id", None),
                        SlotSet("seat_numbers", None)
                    ]
                else:
                    dispatcher.utter_message(
                        text="✅ Đặt vé thành công nhưng không nhận được mã đơn hàng."
                    )
            else:
                try:
                    error_data = response.json()
                    error_msg = error_data.get('message', '') or error_data.get('error', 'Lỗi không xác định')
                except:
                    error_msg = f"HTTP {response.status_code}"
                
                logger.error(f"Booking failed: {error_msg}")
                logger.error(f"Response body: {response.text}")
                
                dispatcher.utter_message(
                    text=f"❌ **Đặt vé thất bại!**\n\n"
                         f"Lý do: {error_msg}\n\n"
                         f"Có thể:\n"
                         f"• Ghế đã được đặt\n"
                         f"• Suất chiếu không còn khả dụng\n"
                         f"• Mã ghế không đúng"
                )
                
        except requests.exceptions.Timeout:
            dispatcher.utter_message(text="⏱️ Timeout khi đặt vé. Vui lòng thử lại.")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error in booking: {str(e)}")
            dispatcher.utter_message(text="❌ Lỗi kết nối API khi đặt vé.")
        except Exception as e:
            logger.error(f"Error in booking: {str(e)}", exc_info=True)
            dispatcher.utter_message(
                text=f"❌ Có lỗi xảy ra khi đặt vé: {str(e)}"
            )
        
        return []
    
    def extract_seat_numbers(self, text):
        """Extract seat numbers từ text"""
        import re
        
        # Tìm pattern: ghế A1 A2, ghế A1, A2, etc
        # Pattern matches: A1, B2, C10, V1, I4, etc
        seat_pattern = r'\b([A-Z]\d+)\b'
        seats = re.findall(seat_pattern, text.upper())
        
        logger.info(f"Extracted seats from '{text}': {seats}")
        return seats if seats else []
    
    def find_cinema_id_from_name(self, cinema_name):
        """Tìm cinema_id từ tên rạp"""
        try:
            response = requests.get(f"{API_BASE_URL}/cinemas", timeout=5)
            
            if response.status_code != 200:
                return None
            
            cinemas_data = response.json()
            
            if isinstance(cinemas_data, dict):
                cinemas = cinemas_data.get('cinemas', []) or cinemas_data.get('data', [])
            elif isinstance(cinemas_data, list):
                cinemas = cinemas_data
            else:
                return None
            
            cinema_name_lower = cinema_name.lower()
            
            for cinema in cinemas:
                if not isinstance(cinema, dict):
                    continue
                
                name = str(cinema.get('cinema_name', '') or cinema.get('name', '')).lower()
                
                if cinema_name_lower in name or name in cinema_name_lower:
                    return cinema.get('id') or cinema.get('cinema_id')
            
            return None
            
        except Exception as e:
            logger.error(f"Error finding cinema: {str(e)}")
            return None

class ActionRedirectToPayment(Action):
    def name(self) -> Text:
        return "action_redirect_to_payment"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        order_id = tracker.get_slot("order_id")
        grand_total = tracker.get_slot("grand_total")
        
        if not order_id or not grand_total:
            dispatcher.utter_message(
                text="❌ Thiếu thông tin đơn hàng.\n"
                     "Bạn có thể đặt vé mới bằng cách nói: 'Đặt vé phim [tên phim]'"
            )
            return []
        
        # Tạo URL thanh toán cố định
        payment_url = "http://localhost:5173/qr-payment"
        
        message = "💳 **HƯỚNG DẪN THANH TOÁN**\n\n"
        message += f"🔗 Vui lòng truy cập link sau để thanh toán:\n"
        message += f"<a href='{payment_url}' target='_blank'>Link thanh toán</a>\n\n"
        message += f"📌 **Thông tin thanh toán:**\n"
        message += f"• Mã đơn hàng: {order_id}\n"
        message += f"• Tổng tiền: {grand_total:,} VND\n"
        message += "• Phương thức: QR Code (VNPay, Momo, ZaloPay) hoặc chuyển khoản ngân hàng\n\n"
        message += "⏰ Thời gian giữ vé: **15 phút**"
        
        dispatcher.utter_message(
            text=message,
            custom={
                "bookingData": {
                    "order_id": order_id,
                    "grand_total": float(grand_total),
                    "payment_url": payment_url
                }
            }
        )
        
        return []

class ActionGetCinemaInfo(Action):
    def name(self) -> Text:
        return "action_get_cinema_info"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        cinema_name = tracker.get_slot("cinema_name")
        
        try:
            response = requests.get(f"{API_BASE_URL}/cinemas", timeout=5)
            
            if response.status_code == 200:
                cinemas_data = response.json()
                
                if isinstance(cinemas_data, dict):
                    cinemas = cinemas_data.get('cinemas', []) or cinemas_data.get('data', [])
                elif isinstance(cinemas_data, list):
                    cinemas = cinemas_data
                else:
                    dispatcher.utter_message(text="Định dạng dữ liệu không hợp lệ.")
                    return []
                
                cinemas = [c for c in cinemas if isinstance(c, dict)]
                
                if cinema_name:
                    cinema_name_lower = cinema_name.lower()
                    cinemas = [
                        c for c in cinemas
                        if cinema_name_lower in str(c.get('cinema_name', '') or c.get('name', '')).lower()
                    ]
                
                if cinemas:
                    message = "🎬 **THÔNG TIN RẠP CHIẾU PHIM**\n\n"
                    
                    for cinema in cinemas[:5]:
                        name = cinema.get('cinema_name', '') or cinema.get('name', 'N/A')
                        address = cinema.get('address', 'N/A')
                        phone = cinema.get('cinema_phone', '') or cinema.get('phone', 'N/A')
                        cinema_id = cinema.get('id') or cinema.get('cinema_id', 'N/A')
                        
                        message += f"🏢 **{name}**\n"
                        message += f"📍 Địa chỉ: {address}\n"
                        message += f"☎️ Hotline: {phone}\n"
                        message += f"🆔 ID: {cinema_id}\n\n"
                    
                    message += "💡 Bạn có thể hỏi: 'Lịch chiếu tại [tên rạp]' để xem lịch chiếu!"
                    
                    dispatcher.utter_message(text=message)
                else:
                    dispatcher.utter_message(
                        text="❌ Không tìm thấy rạp phù hợp.\n"
                             "Vui lòng thử lại với tên rạp khác."
                    )
            else:
                dispatcher.utter_message(text="Không thể lấy thông tin rạp.")
                
        except Exception as e:
            logger.error(f"Error in cinema info: {str(e)}")
            dispatcher.utter_message(text="Có lỗi xảy ra.")
        
        return []


class ActionGetMovieInfo(Action):
    def name(self) -> Text:
        return "action_get_movie_info"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        movie_name = tracker.get_slot("movie_name")
        
        try:
            response = requests.get(f"{API_BASE_URL}/movies", timeout=5)
            
            if response.status_code == 200:
                movies_data = response.json()
                
                if isinstance(movies_data, dict):
                    movies = movies_data.get('data', []) or movies_data.get('movies', [])
                elif isinstance(movies_data, list):
                    movies = movies_data
                else:
                    dispatcher.utter_message(text="Định dạng dữ liệu không hợp lệ.")
                    return []
                
                movies = [m for m in movies if isinstance(m, dict)]
                
                if movie_name:
                    movie_name_lower = movie_name.lower()
                    movies = [
                        m for m in movies
                        if movie_name_lower in str(m.get('title', '') or m.get('movie_name', '')).lower()
                    ]
                
                if movies:
                    message = "🎬 **THÔNG TIN PHIM**\n\n"
                    
                    for movie in movies[:3]:
                        title = movie.get('title', '') or movie.get('movie_name', 'N/A')
                        release = movie.get('release_date', 'N/A')
                        duration = movie.get('duration', '') or movie.get('runtime', 'N/A')
                        genre = movie.get('genre', '') or movie.get('genres', [])
                        if isinstance(genre, list):
                            genre = ', '.join(genre)
                        desc = str(movie.get('description', '') or movie.get('overview', ''))
                        vote_avg = movie.get('vote_average', '')
                        movie_id = movie.get('movie_id', '') or movie.get('id', '')
                        
                        message += f"🎬 **{title}**\n"
                        
                        if release != 'N/A':
                            try:
                                release_date = datetime.fromisoformat(release.replace('Z', '+00:00'))
                                release = release_date.strftime('%d/%m/%Y')
                            except:
                                pass
                            message += f"📅 Khởi chiếu: {release}\n"
                        
                        if duration != 'N/A':
                            message += f"⏱️ Thời lượng: {duration} phút\n"
                        
                        if genre:
                            message += f"🎭 Thể loại: {genre}\n"
                        
                        if vote_avg:
                            message += f"⭐ Đánh giá: {vote_avg}/10\n"
                        
                        if movie_id:
                            message += f"🆔 ID: {movie_id}\n"
                        
                        if desc and len(desc) > 10:
                            desc_short = desc[:200] + "..." if len(desc) > 200 else desc
                            message += f"📝 Mô tả: {desc_short}\n"
                        
                        message += "\n"
                    
                    message += "💡 Bạn có thể hỏi: 'Lịch chiếu phim [tên phim]' để xem suất chiếu!"
                    
                    dispatcher.utter_message(text=message)
                else:
                    dispatcher.utter_message(
                        text="❌ Không tìm thấy phim phù hợp.\n"
                             "Vui lòng thử lại với tên phim khác."
                    )
            else:
                dispatcher.utter_message(text="Không thể lấy thông tin phim.")
                
        except Exception as e:
            logger.error(f"Error in movie info: {str(e)}")
            dispatcher.utter_message(text="Có lỗi xảy ra.")
        
        return []