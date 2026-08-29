import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_PATH = path.resolve(__dirname, '../assets/data/bundled_dictionary.json');

// Load current dictionary
let dict = {};
if (fs.existsSync(TARGET_PATH)) {
  try {
    dict = JSON.parse(fs.readFileSync(TARGET_PATH, 'utf-8'));
  } catch {}
}

console.log(`📖 Existing unique words: ${Object.keys(dict).length}`);

// Explicit literary & core words that MUST have rich definition and examples
const RICH_LITERARY_ENTRIES = {
  "literature": { phonetic: "/ˈlɪt.rə.tʃər/", pos: "noun", def: "written works, especially those considered of superior or lasting artistic merit", ex: "He spent his life studying classic literature.", az: "ədəbiyyat", tr: "edebiyat", ru: "литература", es: "literatura", de: "Literatur", fr: "littérature" },
  "chapter": { phonetic: "/ˈtʃæp.tər/", pos: "noun", def: "a main division of a book, typically with a number or title", ex: "The story gets exciting in chapter three.", az: "fəsil / hissə", tr: "bölüm", ru: "глава / раздел", es: "capítulo", de: "Kapitel", fr: "chapitre" },
  "novel": { phonetic: "/ˈnɒv.əl/", pos: "noun", def: "a fictitious prose narrative of book length", ex: "She wrote a bestselling historical novel.", az: "roman / yeni", tr: "roman / yeni", ru: "роман / новый", es: "novela / novedoso", de: "Roman / neuartig", fr: "roman / nouveau" },
  "author": { phonetic: "/ˈɔː.θər/", pos: "noun", def: "a writer of a book, article, or document", ex: "The author signed copies of her new book.", az: "müəllif / yazar", tr: "yazar", ru: "автор / писатель", es: "autor", de: "Autor", fr: "auteur" },
  "passage": { phonetic: "/ˈpæs.ɪdʒ/", pos: "noun", def: "a section of a written work or music", ex: "He read an inspiring passage from the poem.", az: "parça / keçid", tr: "parça / geçit", ru: "отрывок / проход", es: "pasaje", de: "Passage", fr: "passage" },
  "poetry": { phonetic: "/ˈpəʊ.ɪ.tri/", pos: "noun", def: "literary work in which the expression of feelings and ideas is given intensity by distinctive style and rhythm", ex: "She expressed her deepest emotions through poetry.", az: "poeziya / şeiriyyət", tr: "şiir / şiir sanatı", ru: "поэзия", es: "poesía", de: "Poesie / Dichtung", fr: "poésie" },
  "story": { phonetic: "/ˈstɔː.ri/", pos: "noun", def: "an account of imaginary or real people and events told for entertainment", ex: "The grandfather told a thrilling bedtime story.", az: "hekayə / nağıl", tr: "hikaye / öykü", ru: "история / рассказ", es: "historia / cuento", de: "Geschichte / Erzählung", fr: "histoire / conte" },
  "reader": { phonetic: "/ˈriː.dər/", pos: "noun", def: "a person who reads or who is fond of reading", ex: "The book captivates the reader from the start.", az: "oxucu", tr: "okuyucu / okur", ru: "читатель", es: "lector", de: "Leser", fr: "lecteur" },
  "library": { phonetic: "/ˈlaɪ.brər.i/", pos: "noun", def: "a building or room containing collections of books and periodicals", ex: "He spent hours studying in the quiet library.", az: "kitabxana", tr: "kütüphane", ru: "библиотека", es: "biblioteca", de: "Bibliothek", fr: "bibliothèque" },
  "sentence": { phonetic: "/ˈsen.təns/", pos: "noun", def: "a set of words that is complete in itself, typically containing a subject and predicate", ex: "Every sentence in this book holds deep meaning.", az: "cümlə / hökm", tr: "cümle / hüküm", ru: "предложение / приговор", es: "oración / frase", de: "Satz / Urteil", fr: "phrase / sentence" },
  "language": { phonetic: "/ˈlæŋ.ɡwɪdʒ/", pos: "noun", def: "the method of human communication, either spoken or written", ex: "Learning a new language opens new worlds.", az: "dil / nitq", tr: "dil / lisan", ru: "язык / речь", es: "idioma / lenguaje", de: "Sprache", fr: "langue / langage" },
  "character": { phonetic: "/ˈkær.ək.tər/", pos: "noun", def: "a person in a novel, play, or movie; moral nature", ex: "The main character faced difficult choices.", az: "xarakter / qəhrəman / obraz", tr: "karakter / kişilik", ru: "персонаж / характер", es: "personaje / carácter", de: "Charakter / Figur", fr: "personnage / caractère" },
  "narrative": { phonetic: "/ˈnær.ə.tɪv/", pos: "noun", def: "a spoken or written account of connected events; a story", ex: "The narrative weaves through past and present.", az: "nəql / hekayət / süjet", tr: "anlatı / hikaye", ru: "повествование", es: "narrativa / relato", de: "Erzählung / Bericht", fr: "récit / narration" },
  "volume": { phonetic: "/ˈvɒl.juːm/", pos: "noun", def: "a book forming part of a work or series; degree of loudness", ex: "He pulled the third volume from the shelf.", az: "cild / həcm / səs səviyyəsi", tr: "cilt / hacim / ses", ru: "том / объем / громкость", es: "volumen / tomo", de: "Band / Lautstärke", fr: "volume / tome" },
  "prose": { phonetic: "/prəʊz/", pos: "noun", def: "written or spoken language in its ordinary form, without metrical structure", ex: "His prose was praised for its clarity and rhythm.", az: "nəsr / düz yazı", tr: "düzyazı / nesir", ru: "проза", es: "prosa", de: "Prosa", fr: "prose" }
};

for (const [word, data] of Object.entries(RICH_LITERARY_ENTRIES)) {
  dict[word.toLowerCase().trim()] = data;
}

console.log(`\n🎉 Total unique words in dictionary: ${Object.keys(dict).length}`);

fs.writeFileSync(TARGET_PATH, JSON.stringify(dict, null, 2), 'utf-8');
const stat = fs.statSync(TARGET_PATH);
console.log(`💾 Saved ${Object.keys(dict).length} unique words to ${TARGET_PATH}`);
console.log(`📦 File size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
