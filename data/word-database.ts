/**
 * Word Database for Sambung Kata
 * Contains a list of valid Indonesian words for the game.
 */
export const VALID_WORDS = [
  // Makanan & Minuman
  "makan", "minum", "baso", "tahu", "tempe", "nasi", "ayam", "ikan", "sayur", "buah", "soto", "sate", "rendang", "pedas", "manis", "asin", "gurih", "haus", "lapar", "kenyang", "roti", "susu", "kopi", "teh", "madu", "gula", "garam", "keju", "cokelat", "telur",

  // Kata Sifat / Deskripsi
  "bulat", "kotak", "segitiga", "panjang", "pendek", "besar", "kecil", "tinggi", "rendah", "luas", "sempit", "berat", "ringan", "keras", "lunak", "tajam", "tumpul", "cepat", "lambat", "kuat", "lemah", "bagus", "jelek", "indah", "buruk", "pintar", "bodoh", "rajin", "malas", "senang", "sedih", "marah", "takut", "berani", "bersih", "kotor", "wangi", "bau", "baru", "lama", "muda", "tua",

  // Objek & Benda
  "meja", "kursi", "lemari", "pintu", "jendela", "atap", "lantai", "dinding", "kasur", "bantal", "guling", "selimut", "buku", "pensil", "pulpen", "kertas", "tas", "sepatu", "kaos", "celana", "baju", "topi", "kacamata", "jam", "hp", "laptop", "bola", "sepeda", "motor", "mobil", "pesawat", "kapal", "rumah", "sekolah", "kantor", "pasar", "taman", "hutan", "gunung", "laut", "sungai",

  // Waktu & Alam
  "pagi", "siang", "sore", "malam", "hari", "minggu", "bulan", "tahun", "detik", "menit", "jam", "langit", "awan", "hujan", "panas", "dingin", "angin", "petir", "pelangi", "bintang", "matahari", "rembulan", "bumi", "air", "api", "tanah", "batu", "pasir", "pohon", "bunga", "daun", "akar",

  // Kata Kerja
  "tidur", "lari", "jalan", "duduk", "berdiri", "lompat", "berenang", "terbang", "masak", "cuci", "sapu", "tulis", "baca", "gambar", "hitung", "nyanyi", "joget", "main", "kerja", "belajar", "beli", "jual", "kasih", "ambil", "bawa", "simpan", "buka", "tutup", "nyalakan", "matikan", "pukul", "tendang", "tangkap", "lempar",

  // Tambahan Umum
  "kita", "kami", "saya", "kamu", "dia", "mereka", "siapa", "apa", "mana", "kapan", "mengapa", "bagaimana", "bisa", "boleh", "harus", "ingin", "suka", "cinta", "benci", "tunggu", "nanti", "sekarang", "besok", "kemarin", "tadi"
];

// Helper for fast lookup
export const WORD_SET = new Set(VALID_WORDS.map(w => w.toLowerCase()));

/**
 * Validates if a word exists in the database.
 * @param word The word to check
 * @returns boolean
 */
export const isValidWord = (word: string): boolean => {
  return WORD_SET.has(word.toLowerCase());
};
