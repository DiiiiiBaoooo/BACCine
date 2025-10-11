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
        
        # Parse date if needed
        if date:
            date = self.parse_date(date)
        else:
            date = datetime.now().strftime("%Y-%m-%d")
        
        # Call backend API
        try:
            # Get cinema ID first if cinema_name provided
            cinema_id = None
            if cinema_name:
                try:
                    cinemas_response = requests.get(f"{API_BASE_URL}/cinemas", timeout=5)
                    logger.info(f"Cinemas API status: {cinemas_response.status_code}")
                    
                    if cinemas_response.status_code == 200:
                        cinemas_data = cinemas_response.json()
                        logger.info(f"Cinemas data type: {type(cinemas_data)}")
                        
                        # Handle response format: {success: true, cinemas: [...]}
                        if isinstance(cinemas_data, dict):
                            if 'cinemas' in cinemas_data:
                                cinemas = cinemas_data['cinemas']
                            elif 'data' in cinemas_data:
                                cinemas = cinemas_data['data']
                            else:
                                cinemas = [cinemas_data]
                        elif isinstance(cinemas_data, list):
                            cinemas = cinemas_data
                        else:
                            logger.error(f"Unexpected cinemas data type: {type(cinemas_data)}")
                            cinemas = []
                        
                        logger.info(f"Found {len(cinemas)} cinemas")
                        
                        for cinema in cinemas:
                            if not isinstance(cinema, dict):
                                logger.warning(f"Cinema item is not dict: {type(cinema)}")
                                continue
                            
                            # Try multiple field names
                            cinema_name_field = (
                                cinema.get('cinema_name', '') or 
                                cinema.get('name', '') or 
                                cinema.get('cinema_cluster_name', '')
                            )
                            
                            logger.info(f"Checking cinema: {cinema_name_field}")
                            
                            # Flexible search - check if any word matches
                            cinema_name_lower = cinema_name.lower()
                            field_lower = str(cinema_name_field).lower()
                            
                            # Split search terms and check each
                            search_terms = cinema_name_lower.split()
                            matches = sum(1 for term in search_terms if term in field_lower)
                            
                            if matches >= len(search_terms) * 0.5:  # At least 50% match
                                cinema_id = cinema.get('id') or cinema.get('cinema_id')
                                cinema_name = cinema_name_field  # Update with actual name
                                logger.info(f"✅ Found cinema: {cinema_name} (ID: {cinema_id})")
                                break
                    
                    if not cinema_id:
                        dispatcher.utter_message(
                            text=f"Xin lỗi, tôi không tìm thấy rạp '{cinema_name}' trong hệ thống. "
                                 f"Vui lòng kiểm tra lại tên rạp."
                        )
                        return []
                except Exception as e:
                    logger.error(f"Error fetching cinemas: {str(e)}")
                    dispatcher.utter_message(text="Lỗi khi lấy thông tin rạp chiếu.")
                    return []
            
            # Get showtimes
            if cinema_id:
                response = requests.get(
                    f"{API_BASE_URL}/showtimes/datve/{cinema_id}/{date}",
                    timeout=5
                )
                logger.info(f"Showtimes API status: {response.status_code}")
            else:
                # If no cinema specified, get all cinemas and their showtimes
                try:
                    cinemas_response = requests.get(f"{API_BASE_URL}/cinemas", timeout=5)
                    if cinemas_response.status_code != 200:
                        dispatcher.utter_message(text="Xin lỗi, không thể lấy thông tin rạp chiếu.")
                        return []
                    
                    cinemas_data = cinemas_response.json()
                    
                    # Handle response format: {success: true, cinemas: [...]}
                    if isinstance(cinemas_data, dict):
                        if 'cinemas' in cinemas_data:
                            cinemas = cinemas_data['cinemas']
                        elif 'data' in cinemas_data:
                            cinemas = cinemas_data['data']
                        else:
                            cinemas = [cinemas_data]
                    elif isinstance(cinemas_data, list):
                        cinemas = cinemas_data
                    else:
                        dispatcher.utter_message(text="Định dạng dữ liệu rạp không hợp lệ.")
                        return []
                    
                    if not cinemas:
                        dispatcher.utter_message(text="Không tìm thấy rạp chiếu nào.")
                        return []
                    
                    # Get first cinema for demo
                    first_cinema = cinemas[0] if isinstance(cinemas[0], dict) else {}
                    cinema_id = first_cinema.get('id') or first_cinema.get('cinema_id')
                    cinema_name = (
                        first_cinema.get('cinema_name', '') or 
                        first_cinema.get('name', '') or 
                        'Rạp'
                    )
                    
                    response = requests.get(
                        f"{API_BASE_URL}/showtimes/movies/{movie_id}",
                        timeout=5
                    )
                except Exception as e:
                    logger.error(f"Error in cinema fallback: {str(e)}")
                    dispatcher.utter_message(text="Lỗi khi lấy thông tin rạp.")
                    return []
            
            if response.status_code == 200:
                showtimes_data = response.json()
                logger.info(f"Showtimes data type: {type(showtimes_data)}")
                
                # Handle both list and dict responses
                if isinstance(showtimes_data, dict):
                    showtimes = showtimes_data.get('data', []) if 'data' in showtimes_data else []
                elif isinstance(showtimes_data, list):
                    showtimes = showtimes_data
                else:
                    logger.error(f"Unexpected showtimes type: {type(showtimes_data)}")
                    dispatcher.utter_message(text="Định dạng dữ liệu lịch chiếu không hợp lệ.")
                    return []
                
                # Filter out non-dict items
                showtimes = [st for st in showtimes if isinstance(st, dict)]
                
                # Filter by movie name if provided
                if movie_name:
                    filtered_showtimes = []
                    for st in showtimes:
                        movie_title = st.get('movie_title', '') or st.get('title', '')
                        if movie_name.lower() in str(movie_title).lower():
                            filtered_showtimes.append(st)
                    showtimes = filtered_showtimes
                
                if showtimes:
                    message = f"Lịch chiếu tại {cinema_name} ngày {date}:\n\n"
                    
                    # Group by movie to avoid repetition
                    movies_dict = {}
                    for st in showtimes:
                        title = st.get('movie_title', '') or st.get('title', 'N/A')
                        if title not in movies_dict:
                            movies_dict[title] = []
                        movies_dict[title].append(st)
                    
                    for movie_title, times in movies_dict.items():
                        message += f"🎬 {movie_title}\n"
                        for st in times:
                            show_time = st.get('show_time', '') or st.get('time', 'N/A')
                            room_name = st.get('room_name', '') or st.get('room', 'N/A')
                            price = st.get('ticket_price', '') or st.get('price', 'N/A')
                            
                            message += f"   ⏰ {show_time}"
                            message += f" - 🪑 Phòng: {room_name}"
                            message += f" - 💰 {price} VND\n"
                        message += "\n"
                    
                    dispatcher.utter_message(text=message)
                else:
                    dispatcher.utter_message(
                        text=f"Không tìm thấy suất chiếu phù hợp cho ngày {date}."
                    )
            else:
                dispatcher.utter_message(
                    text=f"Xin lỗi, có lỗi khi lấy thông tin lịch chiếu (Status: {response.status_code})."
                )
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error: {str(e)}")
            dispatcher.utter_message(
                text=f"Lỗi kết nối API: Vui lòng kiểm tra backend server."
            )
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}", exc_info=True)
            dispatcher.utter_message(
                text=f"Xin lỗi, có lỗi xảy ra: {str(e)}"
            )
        
        return []
    
    def parse_date(self, date_str):
        """Parse various date formats"""
        if not date_str or not isinstance(date_str, str):
            return datetime.now().strftime("%Y-%m-%d")
        
        today = datetime.now()
        date_str = str(date_str).strip().lower()
        
        # Handle Vietnamese date keywords
        if date_str == "hôm nay" or date_str == "hom nay":
            return today.strftime("%Y-%m-%d")
        elif date_str == "ngày mai" or date_str == "ngay mai":
            return (today + timedelta(days=1)).strftime("%Y-%m-%d")
        
        # Try multiple date formats
        date_formats = [
            "%Y-%m-%d",      # 2025-10-12
            "%d-%m-%Y",      # 12-10-2025
            "%d/%m/%Y",      # 12/10/2025
            "%m-%d-%Y",      # 10-12-2025
            "%m/%d/%Y",      # 10/12/2025
        ]
        
        for fmt in date_formats:
            try:
                parsed_date = datetime.strptime(date_str, fmt)
                return parsed_date.strftime("%Y-%m-%d")
            except ValueError:
                continue
        
        # If all formats fail, return today
        logger.warning(f"Could not parse date: {date_str}, using today")
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
                text="Vui lòng chọn suất chiếu trước khi xem ghế trống."
            )
            return []
        
        try:
            response = requests.get(
                f"{API_BASE_URL}/showtimes/seat/{showtime_id}",
                timeout=5
            )
            
            if response.status_code == 200:
                seats_data = response.json()
                
                # Handle both list and dict responses
                if isinstance(seats_data, dict):
                    seats = seats_data.get('data', []) if 'data' in seats_data else []
                elif isinstance(seats_data, list):
                    seats = seats_data
                else:
                    dispatcher.utter_message(text="Định dạng dữ liệu ghế không hợp lệ.")
                    return []
                
                # Filter dict items only
                seats = [s for s in seats if isinstance(s, dict)]
                available_seats = [s for s in seats if s.get('status') == 'available']
                
                if available_seats:
                    message = f"Còn {len(available_seats)} ghế trống:\n\n"
                    
                    normal_seats = [s.get('seat_code', '') or s.get('code', '') 
                                   for s in available_seats 
                                   if s.get('seat_type', '') == 'normal' or s.get('type', '') == 'normal']
                    vip_seats = [s.get('seat_code', '') or s.get('code', '') 
                                for s in available_seats 
                                if s.get('seat_type', '') == 'vip' or s.get('type', '') == 'vip']
                    
                    if normal_seats:
                        message += "Ghế thường: " + ", ".join(filter(None, normal_seats)) + "\n"
                    if vip_seats:
                        message += "Ghế VIP: " + ", ".join(filter(None, vip_seats))
                    
                    dispatcher.utter_message(text=message)
                else:
                    dispatcher.utter_message(text="Xin lỗi, không còn ghế trống.")
            else:
                dispatcher.utter_message(
                    text="Không thể lấy thông tin ghế. Vui lòng thử lại."
                )
                
        except requests.exceptions.RequestException:
            dispatcher.utter_message(text="Lỗi kết nối API.")
        except Exception as e:
            logger.error(f"Error in get seats: {str(e)}", exc_info=True)
            dispatcher.utter_message(
                text=f"Có lỗi xảy ra: {str(e)}"
            )
        
        return []


class ActionCreateBooking(Action):
    def name(self) -> Text:
        return "action_create_booking"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        showtime_id = tracker.get_slot("showtime_id")
        seat_numbers = tracker.get_slot("seat_numbers")
        user_id = tracker.get_slot("user_id")
        
        if not all([showtime_id, seat_numbers, user_id]):
            dispatcher.utter_message(
                text="Thiếu thông tin đặt vé. Vui lòng cung cấp đầy đủ thông tin."
            )
            return []
        
        try:
            booking_data = {
                "user_id": user_id,
                "showtime_id": showtime_id,
                "seats": seat_numbers if isinstance(seat_numbers, list) else [seat_numbers],
                "services": []
            }
            
            response = requests.post(
                f"{API_BASE_URL}/bookings/create-booking",
                json=booking_data,
                timeout=10
            )
            
            if response.status_code == 200:
                result_data = response.json()
                
                # Handle dict response
                if isinstance(result_data, dict):
                    order_id = result_data.get('order_id') or result_data.get('id')
                else:
                    order_id = None
                
                if order_id:
                    message = f"✅ Đặt vé thành công!\n"
                    message += f"Mã đơn hàng: {order_id}\n"
                    message += f"Vui lòng thanh toán trong vòng 15 phút."
                    
                    dispatcher.utter_message(text=message)
                    return [SlotSet("order_id", order_id)]
                else:
                    dispatcher.utter_message(text="Đặt vé thành công nhưng không có mã đơn hàng.")
            else:
                dispatcher.utter_message(
                    text="Đặt vé thất bại. Vui lòng thử lại."
                )
                
        except requests.exceptions.RequestException:
            dispatcher.utter_message(text="Lỗi kết nối API.")
        except Exception as e:
            logger.error(f"Error in booking: {str(e)}", exc_info=True)
            dispatcher.utter_message(
                text=f"Có lỗi xảy ra: {str(e)}"
            )
        
        return []


class ActionRedirectToPayment(Action):
    def name(self) -> Text:
        return "action_redirect_to_payment"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        order_id = tracker.get_slot("order_id")
        
        if order_id:
            payment_url = f"http://localhost:5173/payment/{order_id}"
            message = f"Vui lòng thanh toán tại đây: {payment_url}"
            dispatcher.utter_message(text=message)
        else:
            dispatcher.utter_message(
                text="Không tìm thấy thông tin đơn hàng."
            )
        
        return []


class ActionGetCinemaInfo(Action):
    def name(self) -> Text:
        return "action_get_cinema_info"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        cinema_name = tracker.get_slot("cinema_name")
        logger.info(f"ActionGetCinemaInfo - cinema_name slot: {cinema_name}")
        
        try:
            response = requests.get(f"{API_BASE_URL}/cinemas", timeout=5)
            logger.info(f"Cinemas API response status: {response.status_code}")
            
            if response.status_code == 200:
                cinemas_data = response.json()
                logger.info(f"Cinemas data type: {type(cinemas_data)}, length: {len(cinemas_data) if isinstance(cinemas_data, (list, dict)) else 'N/A'}")
                
                # Handle response format: {success: true, cinemas: [...]}
                if isinstance(cinemas_data, dict):
                    if 'cinemas' in cinemas_data:
                        cinemas = cinemas_data['cinemas']
                    elif 'data' in cinemas_data:
                        cinemas = cinemas_data['data']
                    else:
                        cinemas = [cinemas_data]
                elif isinstance(cinemas_data, list):
                    cinemas = cinemas_data
                else:
                    dispatcher.utter_message(text="Định dạng dữ liệu không hợp lệ.")
                    return []
                
                # Filter dict items
                cinemas = [c for c in cinemas if isinstance(c, dict)]
                logger.info(f"Total cinemas after filtering: {len(cinemas)}")
                
                if cinema_name:
                    logger.info(f"Filtering by cinema_name: {cinema_name}")
                    filtered_cinemas = []
                    for c in cinemas:
                        name = (
                            c.get('cinema_name', '') or 
                            c.get('name', '') or 
                            c.get('cinema_cluster_name', '')
                        )
                        logger.info(f"Checking cinema: {name}")
                        if cinema_name.lower() in str(name).lower():
                            filtered_cinemas.append(c)
                            logger.info(f"Match found: {name}")
                    cinemas = filtered_cinemas
                    logger.info(f"Filtered cinemas count: {len(cinemas)}")
                
                if cinemas:
                    message = "Thông tin rạp chiếu:\n\n"
                    # Limit to 5 results
                    for cinema in cinemas[:5]:
                        name = (
                            cinema.get('cinema_name', '') or 
                            cinema.get('name', '') or 
                            'N/A'
                        )
                        address = cinema.get('address', '') or cinema.get('location', 'N/A')
                        phone = (
                            cinema.get('cinema_phone', '') or 
                            cinema.get('phone', '') or 
                            cinema.get('contact', 'N/A')
                        )
                        
                        message += f"🎬 {name}\n"
                        message += f"📍 {address}\n"
                        message += f"☎️ {phone}\n\n"
                    
                    dispatcher.utter_message(text=message)
                else:
                    logger.warning("No cinemas found after filtering")
                    dispatcher.utter_message(
                        text="Không tìm thấy rạp chiếu phù hợp."
                    )
            else:
                dispatcher.utter_message(
                    text="Không thể lấy thông tin rạp chiếu."
                )
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error: {str(e)}")
            dispatcher.utter_message(text="Lỗi kết nối API.")
        except Exception as e:
            logger.error(f"Error in cinema info: {str(e)}", exc_info=True)
            dispatcher.utter_message(
                text=f"Có lỗi xảy ra: {str(e)}"
            )
        
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
                
                # Handle both list and dict responses
                if isinstance(movies_data, dict):
                    movies = movies_data.get('data', []) if 'data' in movies_data else [movies_data]
                elif isinstance(movies_data, list):
                    movies = movies_data
                else:
                    dispatcher.utter_message(text="Định dạng dữ liệu không hợp lệ.")
                    return []
                
                # Filter dict items
                movies = [m for m in movies if isinstance(m, dict)]
                
                if movie_name:
                    filtered_movies = []
                    for m in movies:
                        title = m.get('title', '') or m.get('movie_name', '')
                        if movie_name.lower() in str(title).lower():
                            filtered_movies.append(m)
                    movies = filtered_movies
                
                if movies:
                    message = "Thông tin phim:\n\n"
                    # Limit to 3 results
                    for movie in movies[:3]:
                        title = movie.get('title', '') or movie.get('movie_name', 'N/A')
                        release = movie.get('release_date', '') or movie.get('release', 'N/A')
                        duration = movie.get('duration', '') or movie.get('length', 'N/A')
                        genre = movie.get('genre', '') or movie.get('category', 'N/A')
                        description = movie.get('description', '') or movie.get('desc', '')
                        
                        message += f"🎬 {title}\n"
                        message += f"📅 Khởi chiếu: {release}\n"
                        message += f"⏱️ Thời lượng: {duration} phút\n"
                        message += f"🌟 Thể loại: {genre}\n"
                        
                        if description and len(str(description)) > 100:
                            description = str(description)[:100] + "..."
                        message += f"📝 Mô tả: {description}\n\n"
                    
                    dispatcher.utter_message(text=message)
                else:
                    dispatcher.utter_message(
                        text="Không tìm thấy phim phù hợp."
                    )
            else:
                dispatcher.utter_message(
                    text="Không thể lấy thông tin phim."
                )
                
        except requests.exceptions.RequestException:
            dispatcher.utter_message(text="Lỗi kết nối API.")
        except Exception as e:
            logger.error(f"Error in movie info: {str(e)}", exc_info=True)
            dispatcher.utter_message(
                text=f"Có lỗi xảy ra: {str(e)}"
            )
        
        return []