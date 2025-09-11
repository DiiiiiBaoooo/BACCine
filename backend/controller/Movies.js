import dbPool from "../config/mysqldb.js";
import axios from "axios";

// 📌 Lấy tất cả phim
export const getAllMovies = async (req, res) => {
  try {
    const [rows] = await dbPool.query("SELECT * FROM movies ");
    res.json({
      success: true,
      movies: rows, 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// 📌 Thêm phim mới
  export const insert1Movie = async (req, res) => {
  
    try {
      const {
        movieId,
        import_cost,
      } = req.body;
  
      if (!movieId || !import_cost) {
        return res.status(400).json({
          success: false,
          message: "movieId, import_cost không được thiếu"
        });
      }
  
      // 1. Kiểm tra phim đã tồn tại chưa
      const [existRows] = await dbPool.query(
        "SELECT id FROM movies WHERE id = ?",
        [movieId]
      );
  
      if (existRows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Phim đã tồn tại trong DB"
        });
      }
  
      // 2. Lấy data từ TMDB API
      const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }
        }),
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }
        })
      ]);
  
      const movieApiData = movieDetailsResponse.data;
      const movieCreditsData = movieCreditsResponse.data;
  
      // 3. Insert movies
      await dbPool.query(
        `INSERT INTO movies 
        (id, title, original_title, original_language, overview, poster_path, backdrop_path, release_date, popularity, vote_average, vote_count, import_cost, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          movieApiData.id,
          movieApiData.title,
          movieApiData.original_title,
          movieApiData.original_language,
          movieApiData.overview,
          movieApiData.poster_path,
          movieApiData.backdrop_path,
          movieApiData.release_date,
          movieApiData.popularity,
          movieApiData.vote_average,
          movieApiData.vote_count,
          import_cost
        ]
      );
  
      // 4. Insert genres
      for (const genre of movieApiData.genres) {
        // Lưu genres nếu chưa có
        await dbPool.query(
          "INSERT IGNORE INTO genres (id, name) VALUES (?, ?)",
          [genre.id, genre.name]
        );
  
        // Liên kết vào movie_genres
        await dbPool.query(
          "INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)",
          [movieId, genre.id]
        );
      }
  
      // 5. Insert casts (actors)
      for (const actor of movieCreditsData.cast) {
        await dbPool.query(
          "INSERT IGNORE INTO actors (id, name, profile_path) VALUES (?, ?, ?)",
          [actor.id, actor.name, actor.profile_path]
        );
  
        await dbPool.query(
          `INSERT INTO movie_casts (movie_id, actor_id, credit_id, characters,orders)
           VALUES (?, ?, ?, ?, ?)`,
          [movieId, actor.id, actor.credit_id, actor.character, actor.order]
        );
      }
  
      res.status(201).json({
        success: true,
        message: "Thêm phim + genres + casts thành công"
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    } finally {
      connection.end();
    }
  };
// 📌 Cập nhật phim

export const getUpComingMovies = async (req,res) =>{
    try {
        const {data} = await axios.get('https://api.themoviedb.org/3/movie/now_playing',{
            headers:{Authorization: `Bearer ${process.env.TMDB_API_KEY}`}

        })
       

        const movies = data.results;
        res.json({success:true,movies:movies})

    } catch (error) {
        console.error(error);
        res.json({success:false,message:error.message}) 
    }
}
// 📌 Xóa phim

