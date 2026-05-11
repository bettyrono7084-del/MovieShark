const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../../movies.db');

let db = null;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Database connection error:', err);
        process.exit(1);
      }
    });
  }
  return db;
}

function initDb() {
  return new Promise((resolve, reject) => {
    const database = getDb();
    
    database.serialize(() => {
      // Create movies table
      database.run(`
        CREATE TABLE IF NOT EXISTS movies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          year INTEGER NOT NULL,
          genre TEXT NOT NULL,
          rating REAL,
          description TEXT,
          quality TEXT DEFAULT '1080p',
          badge TEXT,
          emoji TEXT DEFAULT '🎬',
          tags TEXT,
          videoFile TEXT,
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_seed BOOLEAN DEFAULT 0
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Seed initial movies
      const SEED_MOVIES = [
        { title: 'Interstellar', year: 2014, genre: 'sci-fi', rating: 8.7, quality: '4K', badge: 'HD', emoji: '🚀', 
          desc: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival. A breathtaking odyssey of time, love, and relativity.',
          tags: 'Sci-Fi,Drama,Nolan,2h 49m' },
        { title: 'The Dark Knight', year: 2008, genre: 'action', rating: 9.0, quality: '4K', badge: 'TOP', emoji: '🦇',
          desc: 'When the menace known as the Joker wreaks havoc on Gotham, Batman must accept the greatest psychological and physical test of his career.',
          tags: 'Action,Crime,Nolan,2h 32m' },
        { title: 'Parasite', year: 2019, genre: 'thriller', rating: 8.5, quality: '1080p', badge: 'NEW', emoji: '🏚️',
          desc: 'Greed and class discrimination threaten the symbiotic relationship between the wealthy Park family and the destitute Kim clan. Oscar Best Picture winner.',
          tags: 'Thriller,Drama,Bong Joon-ho,2h 12m' },
        { title: 'Inception', year: 2010, genre: 'sci-fi', rating: 8.8, quality: '4K', emoji: '🌀',
          desc: 'A thief steals corporate secrets through dream-sharing technology and is given the task of planting an idea into the mind of a C.E.O.',
          tags: 'Sci-Fi,Action,Nolan,2h 28m' },
        { title: 'Get Out', year: 2017, genre: 'horror', rating: 7.7, quality: '1080p', emoji: '👁️',
          desc: 'A young African-American visits his white girlfriend\'s parents for the weekend, where his uneasiness about their real intentions slowly escalates.',
          tags: 'Horror,Mystery,Jordan Peele,1h 44m' },
        { title: 'The Grand Budapest Hotel', year: 2014, genre: 'comedy', rating: 8.1, quality: '1080p', emoji: '🏨',
          desc: 'A writer encounters the eccentric owner of a storied European hotel and learns of his extraordinary adventures across a continent in turmoil.',
          tags: 'Comedy,Drama,Wes Anderson,1h 39m' },
        { title: 'La La Land', year: 2016, genre: 'romance', rating: 8.0, quality: '4K', emoji: '🎷',
          desc: 'While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.',
          tags: 'Romance,Musical,Chazelle,2h 8m' },
        { title: 'Mad Max: Fury Road', year: 2015, genre: 'action', rating: 8.1, quality: '4K', badge: '4K', emoji: '🔥',
          desc: 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search of her homeland with the aid of a group of female prisoners.',
          tags: 'Action,Sci-Fi,George Miller,2h' },
        { title: 'Spirited Away', year: 2001, genre: 'animation', rating: 8.6, quality: '1080p', emoji: '🌊',
          desc: 'During her family\'s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, where humans are changed into beasts.',
          tags: 'Animation,Fantasy,Miyazaki,2h 5m' },
        { title: 'The Shawshank Redemption', year: 1994, genre: 'drama', rating: 9.3, quality: '4K', badge: 'CLASSIC', emoji: '🏆',
          desc: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency. The highest-rated film of all time.',
          tags: 'Drama,Crime,Frank Darabont,2h 22m' }
      ];

      // Check if seed movies already exist
      database.get('SELECT COUNT(*) as count FROM movies WHERE is_seed = 1', (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (row.count === 0) {
          const stmt = database.prepare(
            'INSERT INTO movies (title, year, genre, rating, description, quality, badge, emoji, tags, is_seed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)'
          );
          
          SEED_MOVIES.forEach(movie => {
            stmt.run([
              movie.title,
              movie.year,
              movie.genre,
              movie.rating,
              movie.desc,
              movie.quality,
              movie.badge || null,
              movie.emoji,
              movie.tags
            ]);
          });
          
          stmt.finalize((err) => {
            if (err) reject(err);
            else resolve(database);
          });
        } else {
          resolve(database);
        }
      });
    });
  });
}

function closeDb() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    } else {
      resolve();
    }
  });
}

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

module.exports = {
  getDb,
  initDb,
  closeDb,
  runAsync,
  getAsync,
  allAsync
};
