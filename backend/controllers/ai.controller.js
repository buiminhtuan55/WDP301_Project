import Booking from '../models/booking.js';
import Movie from '../models/movie.js';
import Showtime from '../models/showtime.js';
import Combo from '../models/combo.js';
import Theater from '../models/theater.js';
import Room from '../models/room.js';
import { formatForAPI, getDayRangeVietnam } from '../utils/timezone.js';
import { askGemini } from '../utils/aiHelper.js';

/**
 * Lấy toàn bộ dữ liệu từ database để gửi cho AI
 */
const getAllDatabaseContext = async () => {
    try {
        // Lấy tất cả phim đang chiếu
        const movies = await Movie.find({ status: 'active' })
            .select('title description duration genre release_date poster_url')
            .sort({ title: 1 });

        // Lấy range ngày hôm nay (giờ Việt Nam)
        const { startOfDay, endOfDay } = getDayRangeVietnam();
        const todayStart = new Date(startOfDay);
        const todayEnd = new Date(endOfDay);

        // Lấy suất chiếu hôm nay
        const todayShowtimes = await Showtime.find({
            status: 'active',
            start_time: { $gte: todayStart, $lte: todayEnd }
        })
        .populate('movie_id', 'title genre')
        .populate({
            path: 'room_id',
            select: 'name',
            populate: { path: 'theater_id', select: 'name location' }
        })
        .sort({ start_time: 1 });

        // Lấy tất cả suất chiếu sắp tới (7 ngày)
        const upcomingEnd = new Date(todayEnd);
        upcomingEnd.setDate(upcomingEnd.getDate() + 7);

        const upcomingShowtimes = await Showtime.find({
            status: 'active',
            start_time: { $gte: todayStart, $lte: upcomingEnd }
        })
        .populate('movie_id', 'title genre')
        .populate({
            path: 'room_id',
            select: 'name',
            populate: { path: 'theater_id', select: 'name location' }
        })
        .sort({ start_time: 1 });

        // Lấy tất cả combo
        const combos = await Combo.find({ status: 'active' })
            .select('name description price')
            .sort({ name: 1 });

        // Lấy tất cả rạp
        const theaters = await Theater.find({ status: 'active' })
            .select('name location')
            .sort({ name: 1 });

        // Format dữ liệu để gửi cho AI
        const moviesData = movies.map(m => ({
            id: m._id,
            title: m.title,
            description: m.description || '',
            duration: m.duration,
            genre: m.genre || [],
            release_date: m.release_date ? new Date(m.release_date).toLocaleDateString('vi-VN') : 'N/A',
            poster_url: m.poster_url || ''
        }));

        const showtimesData = upcomingShowtimes.map(st => ({
            id: st._id,
            movie: st.movie_id?.title || 'N/A',
            movie_id: st.movie_id?._id,
            genre: st.movie_id?.genre || [],
            date: formatForAPI(st.start_time).date,
            time: formatForAPI(st.start_time).vietnamFormatted,
            room: st.room_id?.name || 'N/A',
            theater: st.room_id?.theater_id?.name || 'N/A',
            location: st.room_id?.theater_id?.location || 'N/A'
        }));

        // Gom nhóm showtime theo phim
        const showtimesByMovie = {};
        showtimesData.forEach(st => {
            if (!showtimesByMovie[st.movie]) {
                showtimesByMovie[st.movie] = {
                    movie_id: st.movie_id,
                    genre: st.genre,
                    showtimes: []
                };
            }
            showtimesByMovie[st.movie].showtimes.push({
                date: st.date,
                time: st.time,
                theater: st.theater,
                room: st.room,
                location: st.location
            });
        });

        const combosData = combos.map(c => ({
            name: c.name,
            description: c.description || '',
            price: c.price ? parseFloat(c.price.toString()).toLocaleString('vi-VN') + ' đ' : 'Liên hệ'
        }));

        const theatersData = theaters.map(t => ({
            name: t.name,
            location: t.location || ''
        }));

        return {
            movies: moviesData,
            movieCount: moviesData.length,
            showtimes: showtimesData,
            showtimesByMovie: showtimesByMovie,
            showtimesToday: todayShowtimes.length,
            showtimesUpcoming: upcomingShowtimes.length,
            combos: combosData,
            comboCount: combosData.length,
            theaters: theatersData,
            theaterCount: theatersData.length
        };
    } catch (error) {
        console.error('❌ Error getting database context:', error);
        return null;
    }
};

/**
 * @desc    Chatbot endpoint - AI đọc DB và trả lời câu hỏi
 * @route   POST /api/ai/chat
 * @access  Public
 */
export const chatWithBot = async (req, res) => {
    console.log('========== START CHAT ==========');
    
    try {
        const { message } = req.body;
        console.log('📥 Received message:', message);

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ 
                message: "Vui lòng nhập câu hỏi" 
            });
        }

        const userMessage = message.trim();
        const userMessageLower = userMessage.toLowerCase();

        // Lấy toàn bộ dữ liệu từ database
        console.log('📊 Fetching all data from database...');
        const dbContext = await getAllDatabaseContext();

        if (!dbContext) {
            return res.status(500).json({
                message: "Xin lỗi, đã có lỗi khi kết nối database. Vui lòng thử lại sau."
            });
        }

        console.log(`✅ Database: ${dbContext.movieCount} phim, ${dbContext.showtimesUpcoming} suất chiếu, ${dbContext.comboCount} combo`);

        // Kiểm tra xem có phải lời chào không
        const greetingPatterns = [
            /^(xin\s+chào|hello|hi|chào|hey|hế\s+lô|hê\s+lô)$/i,
            /^(xin\s+chào|hello|hi|chào|hey)\s+(ai|bot|assistant|trợ\s+lý)$/i,
            /^(ai|bot|assistant|trợ\s+lý)$/i
        ];
        
        const isGreeting = greetingPatterns.some(pattern => pattern.test(userMessage.trim()));
        
        if (isGreeting) {
            console.log('✅ GREETING detected');
            const greetingResponse = `Xin chào! 👋 Tôi là trợ lý AI của CINEMAGO. 

Tôi có thể hỗ trợ bạn về:
🎬 **Phim**: Hiện có ${dbContext.movieCount} phim đang chiếu
📅 **Suất chiếu**: ${dbContext.showtimesUpcoming} suất chiếu sắp tới
🍿 **Combo**: ${dbContext.comboCount} combo đồ ăn và nước uống
🏛️ **Rạp**: ${dbContext.theaterCount} chi nhánh

Bạn cần hỗ trợ gì? Có thể hỏi tôi về:
- "Hôm nay có phim gì?"
- "Phim Mưa Đỏ chiếu lúc nào?"
- "Combo hiện có những gì?"
- "Cho tôi xem lịch chiếu 7 ngày tới"
- Hoặc bất kỳ câu hỏi nào về web development!`;

            return res.status(200).json({
                message: greetingResponse,
                isCinemagoRelated: true,
                data: {
                    summary: {
                        movies: dbContext.movieCount,
                        showtimesToday: dbContext.showtimesToday,
                        showtimesUpcoming: dbContext.showtimesUpcoming,
                        combos: dbContext.comboCount,
                        theaters: dbContext.theaterCount
                    }
                }
            });
        }

        // Gửi câu hỏi + dữ liệu cho Gemini AI
        console.log('🤖 Sending to Gemini AI...');
        const aiResponse = await askGemini(userMessage, dbContext);

        if (aiResponse) {
            console.log('✅ Gemini AI responded successfully');
            return res.status(200).json({
                message: aiResponse,
                isCinemagoRelated: true,
                data: {
                    movies: dbContext.movies.slice(0, 10),
                    showtimesByMovie: Object.keys(dbContext.showtimesByMovie).length > 0 ? 
                        Object.entries(dbContext.showtimesByMovie).slice(0, 5).reduce((acc, [key, value]) => {
                            acc[key] = value;
                            return acc;
                        }, {}) : null,
                    combos: dbContext.combos,
                    theaters: dbContext.theaters
                }
            });
        }

        // Nếu Gemini không hoạt động, fallback với logic thông minh hơn
        console.log('⚠️ Gemini AI not available, using smart fallback logic');
        
        let response = '';
        let data = null;

        // Hàm tìm phim theo tên
        const findMovieByName = (searchName) => {
            const searchLower = searchName.toLowerCase().trim();
            // Tìm chính xác trước
            let found = dbContext.movies.find(m => 
                m.title.toLowerCase() === searchLower ||
                m.title.toLowerCase().includes(searchLower) ||
                searchLower.includes(m.title.toLowerCase())
            );
            
            // Nếu không tìm thấy, tìm theo từng từ
            if (!found) {
                const searchWords = searchLower.split(/\s+/);
                found = dbContext.movies.find(m => {
                    const titleLower = m.title.toLowerCase();
                    return searchWords.some(word => titleLower.includes(word));
                });
            }
            
            return found;
        };

        // Hàm tìm showtime của phim
        const getMovieShowtimes = (movieTitle) => {
            return dbContext.showtimesByMovie[movieTitle] || null;
        };

        // Case 1: Hỏi về phim hôm nay
        if (userMessageLower.includes('hôm nay') && 
            (userMessageLower.includes('phim') || userMessageLower.includes('chiếu') || userMessageLower.includes('suất'))) {
            if (dbContext.showtimesToday === 0) {
                response = `Hôm nay không có suất chiếu nào trong hệ thống.`;
            } else {
                const todayMovies = Object.keys(dbContext.showtimesByMovie).slice(0, 5);
                response = `Hôm nay có ${dbContext.showtimesToday} suất chiếu từ ${todayMovies.length} phim:\n\n`;
                todayMovies.forEach(movieName => {
                    const info = dbContext.showtimesByMovie[movieName];
                    response += `🎬 **${movieName}** (${info.genre.join(', ')})\n`;
                    info.showtimes.slice(0, 3).forEach(st => {
                        response += `   • ${st.time} - ${st.theater} - ${st.room}\n`;
                    });
                    response += '\n';
                });
                response += `Bạn có thể hỏi tôi về phim cụ thể để xem lịch chiếu chi tiết.`;
            }
            data = { showtimesByMovie: dbContext.showtimesByMovie };
        }
        // Case 2: Hỏi về phim sắp chiếu / sắp tới
        else if (userMessageLower.includes('sắp chiếu') || 
                 userMessageLower.includes('sắp tới') ||
                 userMessageLower.includes('phim gì sắp') ||
                 (userMessageLower.includes('có phim') && userMessageLower.includes('sắp'))) {
            if (dbContext.showtimesUpcoming === 0) {
                response = `Hiện không có suất chiếu sắp tới trong hệ thống.`;
            } else {
                const upcomingMovies = Object.keys(dbContext.showtimesByMovie).slice(0, 10);
                response = `Có **${dbContext.showtimesUpcoming} suất chiếu** sắp tới từ **${upcomingMovies.length} phim**:\n\n`;
                upcomingMovies.forEach(movieName => {
                    const info = dbContext.showtimesByMovie[movieName];
                    response += `🎬 **${movieName}**\n`;
                    if (info.genre && info.genre.length > 0) {
                        response += `   Thể loại: ${info.genre.join(', ')}\n`;
                    }
                    if (info.showtimes && info.showtimes.length > 0) {
                        response += `   Suất chiếu sắp tới:\n`;
                        info.showtimes.slice(0, 5).forEach(st => {
                            response += `   • ${st.date} ${st.time} - ${st.theater} (${st.room})\n`;
                        });
                    }
                    response += '\n';
                });
            }
            data = { showtimesByMovie: dbContext.showtimesByMovie };
        }
        // Case 3: Hỏi về lịch chiếu chi tiết / tất cả lịch chiếu
        else if (userMessageLower.includes('lịch chiếu') || 
                 userMessageLower.includes('suất chiếu') ||
                 userMessageLower.includes('chi tiết')) {
            if (Object.keys(dbContext.showtimesByMovie).length === 0) {
                response = `Hiện không có lịch chiếu nào trong hệ thống.`;
            } else {
                response = `**Lịch chiếu chi tiết** (${dbContext.showtimesUpcoming} suất chiếu):\n\n`;
                Object.entries(dbContext.showtimesByMovie).slice(0, 10).forEach(([movieName, info]) => {
                    response += `🎬 **${movieName}**\n`;
                    if (info.showtimes && info.showtimes.length > 0) {
                        info.showtimes.forEach(st => {
                            response += `   📅 ${st.date} ${st.time} - ${st.theater} (${st.room})\n`;
                            if (st.location) {
                                response += `      📍 ${st.location}\n`;
                            }
                        });
                    }
                    response += '\n';
                });
            }
            data = { showtimesByMovie: dbContext.showtimesByMovie };
        }
        // Case 4: Hỏi về phim cụ thể (có tên phim trong câu)
        else if (userMessageLower.includes('phim') && 
                 (userMessageLower.includes('chiếu') || userMessageLower.includes('lúc nào') || 
                  userMessageLower.includes('khi nào') || userMessageLower.includes('mấy giờ'))) {
            // Trích xuất tên phim
            let movieName = null;
            const movieMatch = userMessage.match(/phim\s+([^?.,!]+?)(?:\s+(chiếu|lúc nào|khi nào|mấy giờ))?/i);
            if (movieMatch && movieMatch[1]) {
                movieName = movieMatch[1].trim();
            }
            
            // Nếu không tìm thấy, thử tìm trong danh sách phim
            if (!movieName || movieName.length < 2) {
                // Thử tìm phim có tên trong câu hỏi
                for (const movie of dbContext.movies) {
                    if (userMessageLower.includes(movie.title.toLowerCase())) {
                        movieName = movie.title;
                        break;
                    }
                }
            }
            
            if (movieName) {
                const foundMovie = findMovieByName(movieName);
                if (foundMovie) {
                    const showtimes = getMovieShowtimes(foundMovie.title);
                    if (showtimes && showtimes.showtimes && showtimes.showtimes.length > 0) {
                        response = `🎬 **${foundMovie.title}**\n\n`;
                        response += `📅 **Lịch chiếu:**\n`;
                        showtimes.showtimes.forEach(st => {
                            response += `   • ${st.date} ${st.time} - ${st.theater} (${st.room})\n`;
                            if (st.location) {
                                response += `      📍 ${st.location}\n`;
                            }
                        });
                        data = { 
                            movie: foundMovie,
                            showtimes: showtimes.showtimes
                        };
                    } else {
                        response = `Tìm thấy phim **${foundMovie.title}** nhưng hiện chưa có lịch chiếu.`;
                        data = { movie: foundMovie };
                    }
                } else {
                    response = `Không tìm thấy phim "${movieName}" trong hệ thống.\n\n`;
                    response += `Các phim đang chiếu:\n`;
                    dbContext.movies.slice(0, 10).forEach(m => {
                        response += `• ${m.title}\n`;
                    });
                }
            } else {
                response = `Bạn muốn xem lịch chiếu của phim nào? Vui lòng cho tôi biết tên phim.\n\n`;
                response += `Các phim đang chiếu:\n`;
                dbContext.movies.slice(0, 10).forEach(m => {
                    response += `• ${m.title}\n`;
                });
            }
        }
        // Case 5: Danh sách phim
        else if (userMessageLower.includes('phim đang chiếu') || 
                 userMessageLower.includes('danh sách phim') ||
                 userMessageLower.includes('tất cả phim') ||
                 userMessageLower.includes('có những phim nào') ||
                 userMessageLower.includes('phim nào')) {
            response = `Hiện có **${dbContext.movieCount} phim** đang chiếu tại CINEMAGO:\n\n`;
            dbContext.movies.forEach(movie => {
                response += `🎬 **${movie.title}**\n`;
                response += `   Thể loại: ${movie.genre.join(', ') || 'N/A'}\n`;
                response += `   Thời lượng: ${movie.duration} phút\n`;
                if (movie.description) {
                    response += `   Mô tả: ${movie.description.slice(0, 100)}...\n`;
                }
                response += '\n';
            });
            response += `Bạn có thể hỏi tôi về lịch chiếu của bất kỳ phim nào!`;
            data = { movies: dbContext.movies };
        }
        // Case 6: Combo
        else if (userMessageLower.includes('combo') || userMessageLower.includes('bắp') || userMessageLower.includes('nước')) {
            if (dbContext.combos.length === 0) {
                response = `Hiện không có combo nào trong hệ thống.`;
            } else {
                response = `CINEMAGO có **${dbContext.comboCount} combo** đồ ăn và nước uống:\n\n`;
                dbContext.combos.forEach(combo => {
                    response += `🍿 **${combo.name}** - ${combo.price}\n`;
                    if (combo.description) {
                        response += `   ${combo.description}\n`;
                    }
                    response += '\n';
                });
                response += `Bạn có thể đặt combo khi mua vé!`;
            }
            data = { combos: dbContext.combos };
        }
        // Case 7: Rạp
        else if (userMessageLower.includes('rạp') || userMessageLower.includes('theater') || userMessageLower.includes('địa chỉ')) {
            if (dbContext.theaters.length === 0) {
                response = `Hiện không có thông tin rạp trong hệ thống.`;
            } else {
                response = `CINEMAGO có **${dbContext.theaterCount} chi nhánh**:\n\n`;
                dbContext.theaters.forEach(theater => {
                    response += `🏛️ **${theater.name}**\n`;
                    if (theater.location) {
                        response += `   Địa chỉ: ${theater.location}\n`;
                    }
                    response += '\n';
                });
                response += `Bạn có thể chọn rạp gần nhất khi đặt vé!`;
            }
            data = { theaters: dbContext.theaters };
        }
        // Case 8: Thể loại
        else if (userMessageLower.includes('thể loại') || userMessageLower.includes('genre')) {
            const allGenres = new Set();
            dbContext.movies.forEach(movie => {
                movie.genre.forEach(g => allGenres.add(g));
            });
            const genres = Array.from(allGenres).sort();
            
            response = `Các thể loại phim tại CINEMAGO:\n\n`;
            genres.forEach((genre, idx) => {
                const count = dbContext.movies.filter(m => m.genre.includes(genre)).length;
                response += `${idx + 1}. **${genre}** (${count} phim)\n`;
            });
            response += `\nBạn có thể hỏi "tôi muốn xem phim thể loại [tên thể loại]" để xem danh sách phim!`;
            data = { genres: genres };
        }
        // Case 9: Tìm phim theo tên (chỉ nhập tên phim)
        else {
            // Thử tìm xem có phải là tên phim không
            const potentialMovieName = userMessage.trim();
            if (potentialMovieName.length >= 2 && potentialMovieName.length <= 50) {
                const foundMovie = findMovieByName(potentialMovieName);
                if (foundMovie) {
                    const showtimes = getMovieShowtimes(foundMovie.title);
                    response = `🎬 **${foundMovie.title}**\n\n`;
                    if (foundMovie.genre && foundMovie.genre.length > 0) {
                        response += `Thể loại: ${foundMovie.genre.join(', ')}\n`;
                    }
                    response += `Thời lượng: ${foundMovie.duration} phút\n`;
                    if (foundMovie.description) {
                        response += `Mô tả: ${foundMovie.description.slice(0, 200)}...\n\n`;
                    }
                    if (showtimes && showtimes.showtimes && showtimes.showtimes.length > 0) {
                        response += `📅 **Lịch chiếu:**\n`;
                        showtimes.showtimes.slice(0, 10).forEach(st => {
                            response += `   • ${st.date} ${st.time} - ${st.theater} (${st.room})\n`;
                        });
                        data = { 
                            movie: foundMovie,
                            showtimes: showtimes.showtimes
                        };
                    } else {
                        response += `\nHiện chưa có lịch chiếu cho phim này.`;
                        data = { movie: foundMovie };
                    }
                } else {
                    // Không tìm thấy phim
                    response = `Không tìm thấy phim "${potentialMovieName}" trong hệ thống.\n\n`;
                    response += `**Các phim đang chiếu:**\n`;
                    dbContext.movies.slice(0, 10).forEach(m => {
                        response += `• ${m.title}\n`;
                    });
                    response += `\nBạn có thể hỏi:\n`;
                    response += `- "Hôm nay có phim gì?"\n`;
                    response += `- "Lịch chiếu chi tiết"\n`;
                    response += `- "Phim [tên phim] chiếu lúc nào?"\n`;
                    response += `- "Có phim gì sắp chiếu không?"\n`;
                }
            } else {
                // Câu hỏi không xác định
                response = `Tôi không chắc chắn về câu hỏi của bạn. Đây là thông tin hiện có:\n\n`;
                response += `🎬 **${dbContext.movieCount} phim** đang chiếu\n`;
                response += `📅 **${dbContext.showtimesUpcoming} suất chiếu** sắp tới\n`;
                response += `🍿 **${dbContext.comboCount} combo** đồ ăn\n`;
                response += `🏛️ **${dbContext.theaterCount} chi nhánh** rạp\n\n`;
                response += `Bạn có thể hỏi:\n`;
                response += `- "Hôm nay có phim gì?"\n`;
                response += `- "Có phim gì sắp chiếu không?"\n`;
                response += `- "Lịch chiếu chi tiết"\n`;
                response += `- "Phim [tên phim] chiếu lúc nào?"\n`;
                response += `- "Danh sách phim"\n`;
            }
        }

        return res.status(200).json({
            message: response,
            isCinemagoRelated: true,
            data: data
        });

    } catch (error) {
        console.error('❌ General error:', error);
        return res.status(500).json({ 
            message: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.", 
            error: error.message 
        });
    }
};

/**
 * @desc    Get AI-powered movie recommendations based on user booking history
 * @route   GET /api/ai/recommendations
 * @access  Private (requires token)
 */
export const getMovieRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('🎬 Getting recommendations for user:', userId);

        // Lấy lịch sử đặt vé của user
        const bookings = await Booking.find({ user_id: userId })
            .populate('showtime_id')
            .sort({ created_at: -1 })
            .limit(20);

        console.log(`📊 Found ${bookings.length} bookings for user`);

        // Lấy tất cả phim đang chiếu
        const allMovies = await Movie.find({ status: 'active' })
            .select('title genre description poster_url duration release_date')
            .sort({ title: 1 });

        // Nếu không có lịch sử đặt vé, trả về phim mới
        if (bookings.length === 0) {
            return res.status(200).json({
                message: "Đây là những phim mới đang chiếu tại CINEMAGO:",
                data: {
                    recommendations: allMovies.slice(0, 10),
                    reason: "Bạn chưa có lịch sử đặt vé, nên tôi gợi ý các phim mới."
                }
            });
        }

        // Phân tích thể loại phim đã xem
        const watchedGenres = new Set();
        const watchedMovies = [];

        bookings.forEach(booking => {
            if (booking.showtime_id?.movie_id) {
                const movie = booking.showtime_id.movie_id;
                watchedMovies.push(movie._id.toString());
                if (movie.genre && Array.isArray(movie.genre)) {
                    movie.genre.forEach(genre => {
                        watchedGenres.add(genre);
                    });
                }
            }
        });

        console.log('🎭 Watched genres:', Array.from(watchedGenres));

        // Tìm phim cùng thể loại mà user chưa xem
        const genreArray = Array.from(watchedGenres);
        let recommendations = [];

        if (genreArray.length > 0) {
            recommendations = allMovies.filter(movie => {
                // Lọc phim user chưa xem
                if (watchedMovies.includes(movie._id.toString())) {
                    return false;
                }
                // Lọc phim cùng thể loại
                if (movie.genre && Array.isArray(movie.genre)) {
                    return movie.genre.some(g => watchedGenres.has(g));
                }
                return false;
            });
        }

        // Nếu không đủ, thêm phim mới
        if (recommendations.length < 5) {
            const newMovies = allMovies.filter(movie => {
                return !watchedMovies.includes(movie._id.toString()) &&
                       !recommendations.some(r => r._id.toString() === movie._id.toString());
            });
            recommendations = [...recommendations, ...newMovies];
        }

        // Giới hạn 10 phim
        recommendations = recommendations.slice(0, 10);

        const reason = genreArray.length > 0 
            ? `Vì bạn thích thể loại: ${genreArray.join(', ')}`
            : "Đề xuất dựa trên sự đa dạng";

        return res.status(200).json({
            message: `Tôi gợi ý những phim sau dựa trên sở thích của bạn:`,
            data: {
                recommendations: recommendations,
                watchedGenres: genreArray,
                reason: reason
            }
        });

    } catch (error) {
        console.error('❌ Error getting recommendations:', error);
        return res.status(500).json({
            message: "Xin lỗi, đã có lỗi khi lấy gợi ý phim.",
            error: error.message
        });
    }
};
