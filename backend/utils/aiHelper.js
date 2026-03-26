/**
 * AI Helper - Sử dụng Google Gemini AI để trả lời câu hỏi về web/phim
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

let genAI = null;
let model = null;

// Khởi tạo Gemini AI
const initGemini = () => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('⚠️ GEMINI_API_KEY not found in .env file. Gemini AI will not be available.');
            return false;
        }
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log('✅ Gemini AI initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Error initializing Gemini AI:', error);
        return false;
    }
};

// Khởi tạo khi module được load
initGemini();

/**
 * Kiểm tra xem câu hỏi có liên quan đến web development hoặc phim không
 * @param {string} question - Câu hỏi của người dùng
 * @returns {boolean} - true nếu liên quan đến web/phim
 */
export const isWebOrMovieQuestion = (question) => {
    const q = question.toLowerCase();

    // Từ khóa về web development
    const webKeywords = [
        'web', 'website', 'html', 'css', 'javascript', 'js', 'react', 'vue', 'angular',
        'node', 'express', 'api', 'frontend', 'backend', 'fullstack', 'full stack',
        'database', 'mongodb', 'sql', 'programming', 'code', 'coding', 'developer',
        'framework', 'library', 'npm', 'package', 'component', 'state', 'props',
        'router', 'redux', 'context', 'hook', 'function', 'class', 'async', 'await',
        'promise', 'callback', 'middleware', 'route', 'endpoint', 'rest', 'graphql',
        'authentication', 'authorization', 'jwt', 'token', 'session', 'cookie',
        'responsive', 'mobile', 'ui', 'ux', 'design', 'bootstrap', 'tailwind',
        'typescript', 'ts', 'es6', 'es2015', 'dom', 'event', 'ajax', 'fetch',
        'axios', 'http', 'https', 'url', 'path', 'query', 'parameter', 'body',
        'header', 'status', 'error', 'exception', 'try', 'catch', 'finally',
        'variable', 'constant', 'array', 'object', 'string', 'number', 'boolean',
        'null', 'undefined', 'function', 'arrow', 'spread', 'destructure',
        'import', 'export', 'module', 'require', 'package.json', 'git', 'github',
        'deploy', 'hosting', 'server', 'client', 'browser', 'chrome', 'firefox',
        'safari', 'edge', 'devtools', 'console', 'debug', 'test', 'unit', 'integration',
        'jest', 'mocha', 'cypress', 'selenium', 'docker', 'kubernetes', 'ci', 'cd',
        'agile', 'scrum', 'gitlab', 'bitbucket', 'jenkins', 'travis', 'github actions'
    ];

    // Từ khóa về phim
    const movieKeywords = [
        'phim', 'movie', 'film', 'cinema', 'rạp', 'chiếu', 'suất chiếu', 'lịch chiếu',
        'đặt vé', 'booking', 'ticket', 'vé', 'combo', 'thể loại', 'genre', 'trailer',
        'diễn viên', 'actor', 'actress', 'đạo diễn', 'director', 'producer', 'nhà sản xuất',
        'kịch bản', 'script', 'screenplay', 'phim hành động', 'action', 'phim tình cảm',
        'romance', 'phim kinh dị', 'horror', 'phim hài', 'comedy', 'phim hoạt hình',
        'animation', 'phim trinh thám', 'thriller', 'phim khoa học viễn tưởng', 'sci-fi',
        'phim cổ trang', 'historical', 'phim tài liệu', 'documentary', 'phim ngắn',
        'short film', 'phim dài', 'feature film', 'phim bom tấn', 'blockbuster',
        'phim độc lập', 'indie', 'phim nghệ thuật', 'art house', 'phim quốc tế',
        'international', 'phim việt nam', 'vietnamese', 'oscar', 'cannes', 'venice',
        'imdb', 'rotten tomatoes', 'metacritic', 'box office', 'doanh thu', 'revenue',
        'rating', 'đánh giá', 'review', 'critic', 'nhà phê bình', 'audience', 'khán giả',
        'premiere', 'ra mắt', 'release', 'phát hành', 'distributor', 'nhà phát hành',
        'cinematography', 'quay phim', 'editing', 'dựng phim', 'soundtrack', 'nhạc phim',
        'score', 'nhạc nền', 'visual effects', 'hiệu ứng', 'vfx', 'cgi', '3d', 'imax',
        'dolby', 'atmos', 'screen', 'màn hình', 'projector', 'máy chiếu', 'seat', 'ghế',
        'vip', 'thường', 'đôi', 'couple', 'theater', 'rạp chiếu', 'multiplex', 'cineplex',
        'showtime', 'schedule', 'timetable', 'duration', 'thời lượng', 'runtime', 'length',
        'age rating', 'phân loại', 'pg', 'pg-13', 'r', 'nc-17', 'g', 'k', 't13', 't16', 't18',
        'subtitle', 'phụ đề', 'dubbed', 'lồng tiếng', 'original', 'nguyên bản', 'version',
        'bản', 'cut', 'uncut', 'director cut', 'extended', 'mở rộng', 'theatrical', 'chiếu rạp',
        'streaming', 'netflix', 'disney+', 'hbo', 'amazon prime', 'hulu', 'apple tv+',
        'youtube', 'vimeo', 'blu-ray', 'dvd', '4k', 'uhd', 'hdr', 'dolby vision'
    ];

    // Kiểm tra từ khóa web
    for (const keyword of webKeywords) {
        if (q.includes(keyword)) {
            return true;
        }
    }

    // Kiểm tra từ khóa phim
    for (const keyword of movieKeywords) {
        if (q.includes(keyword)) {
            return true;
        }
    }

    return false;
};

/**
 * Gọi Gemini AI để trả lời câu hỏi về web/phim
 * @param {string} question - Câu hỏi của người dùng
 * @param {Object} context - Context từ database (phim, showtimes, v.v.)
 * @returns {Promise<string>} - Câu trả lời từ AI
 */
export const askGemini = async (question, context = {}) => {
    if (!model) {
        console.warn('⚠️ Gemini AI not initialized');
        return null;
    }

    try {
        // Tạo system prompt - trả lời tự nhiên, đầy đủ vừa phải và không quá cứng nhắc
        let systemPrompt = `Bạn là trợ lý AI của CINEMAGO. Hỗ trợ về:
- Thông tin phim (tên, thể loại, thời lượng, mô tả)
- Lịch chiếu, suất chiếu (ngày, giờ, rạp, phòng)
- Giá vé, đặt vé
- Combo đồ ăn
- Thông tin rạp (địa chỉ, chi nhánh)
- Ghế, phòng chiếu

NGUYÊN TẮC TRẢ LỜI:
1. Luôn ưu tiên dữ liệu thực từ database. Nếu thiếu dữ liệu, nói rõ và hỏi lại để làm rõ.
2. Trả lời tự nhiên, đầy đủ và liền mạch; không cắt ngang ý, không dùng "..." để rút ngắn.
3. Độ dài vừa phải (khoảng 4-8 câu), có thể xuống dòng để dễ đọc.
4. Có thể dùng gạch đầu dòng hoặc liệt kê khi giúp dễ đọc (không bắt buộc).
5. Không bịa dữ liệu. Chỉ dùng thông tin có trong dữ liệu được cung cấp.
6. Nếu câu hỏi ngoài cinema, từ chối lịch sự và gợi ý quay lại chủ đề phim/rạp/đặt vé.`;

        // Thêm dữ liệu từ database vào prompt
        if (context.movies && context.movies.length > 0) {
            systemPrompt += `\n\nDanh sách phim: `;
            context.movies.forEach((movie, idx) => {
                systemPrompt += `${idx + 1}. ${movie.title} (${movie.genre?.join(', ') || 'N/A'}, ${movie.duration} phút)`;
                if (idx < context.movies.length - 1) systemPrompt += ` | `;
            });
            systemPrompt += ` (tổng ${context.movieCount || context.movies.length} phim)`;
        }

        if (context.showtimesByMovie && Object.keys(context.showtimesByMovie).length > 0) {
            systemPrompt += `\n\nLịch chiếu:`;
            Object.entries(context.showtimesByMovie).slice(0, 10).forEach(([movieName, info]) => {
                systemPrompt += `\n${movieName}: `;
                info.showtimes.slice(0, 5).forEach((st, idx) => {
                    systemPrompt += `${st.date} ${st.time} tại ${st.theater} (${st.room})`;
                    if (idx < info.showtimes.length - 1) systemPrompt += ` | `;
                });
            });
        }

        if (context.combos && context.combos.length > 0) {
            systemPrompt += `\n\nCombo: `;
            context.combos.forEach((combo, idx) => {
                systemPrompt += `${combo.name} (${combo.price})`;
                if (idx < context.combos.length - 1) systemPrompt += ` | `;
            });
        }

        if (context.theaters && context.theaters.length > 0) {
            systemPrompt += `\n\nRạp: `;
            context.theaters.forEach((theater, idx) => {
                systemPrompt += `${theater.name}${theater.location ? ' - ' + theater.location : ''}`;
                if (idx < context.theaters.length - 1) systemPrompt += ` | `;
            });
        }

        const finalPrompt = `${systemPrompt}

Câu hỏi: "${question}"

Hướng dẫn trả lời:
- Trả lời đúng trọng tâm và dùng dữ liệu đã cung cấp ở trên.
- Nếu cần thêm thông tin (ví dụ: tên phim, ngày xem, rạp), hãy hỏi lại ngắn gọn.
- Có thể kết thúc bằng một câu hỏi gợi mở phù hợp nếu giúp người dùng tiếp tục.

Trả lời:`;

        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        const text = response.text();

        console.log('✅ Gemini AI response received');
        return text;
    } catch (error) {
        console.error('❌ Error calling Gemini AI:', error);
        return null;
    }
};

/**
 * Phân tích câu hỏi và trả về intent + entities
 * Sử dụng logic thông minh để hiểu câu hỏi và LUÔN query database
 * @param {string} question - Câu hỏi của người dùng
 * @returns {Promise<Object>} - Intent và entities
 */
export const analyzeQuestion = async (question) => {
    // Phân tích đơn giản nhưng hiệu quả - LUÔN trả về intent và entities
    // Không cần AI API phức tạp, chỉ cần logic tốt + query database

    const intent = extractIntent(question);
    const entities = extractEntities(question);

    console.log('🔍 Question analysis:', { intent, entities, question });

    return {
        intent,
        entities,
        confidence: 0.8
    };
};

/**
 * Trích xuất intent từ câu hỏi
 */
const extractIntent = (question) => {
    const q = question.toLowerCase();

    // QUAN TRỌNG: Nếu có "hôm nay" → luôn là get_today_movies (ưu tiên cao nhất)
    if (q.includes('hôm nay') || q.includes('today')) {
        return 'get_today_movies';
    }
    // Nếu có "suất chiếu" hoặc "lịch chiếu" nhưng KHÔNG có "hôm nay" → get_movie_showtimes
    if ((q.includes('chiếu lúc nào') || q.includes('lịch chiếu') || q.includes('suất chiếu')) && !q.includes('hôm nay')) {
        return 'get_movie_showtimes';
    }
    if (q.includes('phim đang chiếu') || q.includes('danh sách phim')) {
        return 'get_all_movies';
    }
    if (q.includes('thể loại') || q.includes('genre')) {
        return 'get_genres';
    }
    if (q.includes('combo')) {
        return 'get_combos';
    }
    if (q.includes('giá') || q.includes('price')) {
        return 'get_price';
    }
    if (q.includes('đặt vé') || q.includes('booking')) {
        return 'book_ticket';
    }

    return 'general_query';
};

/**
 * Trích xuất entities (tên phim, ngày, v.v.) từ câu hỏi
 */
const extractEntities = (question) => {
    const entities = {
        movieName: null,
        date: null,
        genre: null
    };

    // Tìm tên phim - loại bỏ các từ không phải tên phim
    const moviePatterns = [
        // Pattern: "có phim X không" hoặc "có phim X"
        /có\s+phim\s+([^?.,!]+?)(?:\s+không)?/i,
        // Pattern: "phim X" (ở đầu câu hoặc sau từ khóa)
        /(?:^|về|hỏi|muốn|tìm|tìm\s+kiếm|thông\s+tin)\s+phim\s+([^?.,!]+?)(?:\s+(chiếu|lịch|suất|nào|gì|đang|không))?/i,
        // Pattern: "phim X chiếu" hoặc "phim X lịch"
        /phim\s+([^?.,!]+?)(?:\s+(chiếu|lịch|suất|nào|gì|đang))?/i,
        // Pattern: "X chiếu lúc nào"
        /([^?.,!]+?)\s+chiếu\s+(lúc|khi)/i,
        // Pattern: "lịch chiếu phim X" hoặc "suất chiếu phim X"
        /(?:lịch|suất)\s+chiếu\s+(?:phim\s+)?([^?.,!]+)/i
    ];

    for (const pattern of moviePatterns) {
        const match = question.match(pattern);
        if (match && match[1]) {
            let movieName = match[1].trim();
            // Loại bỏ các từ không phải tên phim
            movieName = movieName
                .replace(/^(phim|movie|có|về|hỏi|muốn|tìm|thông\s+tin)\s+/i, '')
                .replace(/\s+(không|có|chiếu|lịch|suất|nào|gì|đang)$/i, '')
                .trim();

            // Loại bỏ các từ thừa ở đầu và cuối
            const stopWords = ['có', 'về', 'hỏi', 'muốn', 'tìm', 'thông tin', 'phim', 'movie'];
            const words = movieName.split(/\s+/);
            let startIdx = 0;
            let endIdx = words.length;

            // Loại bỏ stop words ở đầu
            while (startIdx < words.length && stopWords.includes(words[startIdx].toLowerCase())) {
                startIdx++;
            }

            // Loại bỏ stop words ở cuối
            while (endIdx > startIdx && stopWords.includes(words[endIdx - 1].toLowerCase())) {
                endIdx--;
            }

            movieName = words.slice(startIdx, endIdx).join(' ').trim();

            if (movieName.length > 1 && movieName.length < 50) {
                entities.movieName = movieName;
                break;
            }
        }
    }

    // Nếu không tìm thấy pattern, thử lấy toàn bộ câu sau khi loại bỏ stop words
    if (!entities.movieName && question.split(/\s+/).length <= 8) {
        const cleanQuestion = question
            .replace(/\b(có|phim|movie|chiếu|lúc nào|khi nào|lịch|suất|hỏi|về|tôi|muốn|tìm|thông tin|không|đang|gì|nào)\b/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (cleanQuestion.length > 1 && cleanQuestion.length < 50) {
            entities.movieName = cleanQuestion;
        }
    }

    // Tìm ngày
    if (question.includes('hôm nay') || question.includes('today')) {
        entities.date = 'today';
    }

    return entities;
};

/**
 * Tạo context từ database để AI hiểu rõ hơn
 */
export const getDatabaseContext = async () => {
    try {
        const Movie = (await import('../models/movie.js')).default;
        const movies = await Movie.find({ status: 'active' })
            .select('title genre')
            .limit(50);

        return {
            availableMovies: movies.map(m => ({
                title: m.title,
                genres: m.genre || []
            })),
            totalMovies: movies.length
        };
    } catch (error) {
        console.error('Error getting database context:', error);
        return { availableMovies: [], totalMovies: 0 };
    }
};
