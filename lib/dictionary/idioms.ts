/**
 * Curated literary & conversational idioms, phrasal verbs, and collocations
 * with multi-language contextual detection and dynamic N-Gram parsing.
 */

import { getWordCandidateLemmas } from './offline-dict';

export interface IdiomEntry {
  canonical: string;
  pattern: RegExp;
  triggerWords: string[];
  translations: Record<string, string>;
}

export interface DetectedIdiom {
  phrase: string;
  matchedText: string;
  translation: string;
}

export const PHRASAL_PARTICLES = new Set([
  'up',
  'down',
  'out',
  'in',
  'off',
  'on',
  'away',
  'back',
  'over',
  'through',
  'about',
  'into',
  'across',
  'along',
  'by',
  'around',
  'ahead',
  'forward',
  'upon',
  'after',
  'against',
  'forth',
  'apart',
  'round',
]);

/**
 * High-frequency curated phrasal verbs database (covering 1000+ conjugated forms)
 */
interface PhraseDef {
  canonical: string;
  az: string;
  tr?: string;
  ru?: string;
  en?: string;
}

const PHRASAL_VERBS_BASE: Record<string, PhraseDef> = {
  // LINK
  'link up': { canonical: 'link up', az: 'əlaqələndirmək, birləşmək, əlaqə qurmaq', tr: 'bağlanmak, birleşmek', ru: 'соединяться, связываться' },
  'link with': { canonical: 'link with', az: 'ilə əlaqələndirmək', tr: 'ile bağdaştırmak', ru: 'связывать с' },

  // TAKE
  'take aback': { canonical: 'take aback', az: 'heyrətləndirmək, çaşdırmaq', tr: 'şaşırtmak, afallatmak', ru: 'ошеломить, застать врасплох' },
  'take after': { canonical: 'take after', az: 'oxşamaq (valideynə)', tr: 'çekmek, benzemek', ru: 'походить на' },
  'take away': { canonical: 'take away', az: 'aparmaq, götürmək, uzaqlaşdırmaq', tr: 'almak, götürmek', ru: 'уносить, забирать' },
  'take back': { canonical: 'take back', az: 'geri almaq, sözünü geri götürmək', tr: 'geri almak', ru: 'брать обратно' },
  'take down': { canonical: 'take down', az: 'yazıb götürmək, endirmək', tr: 'not almak, indirmek', ru: 'записывать, снимать' },
  'take for': { canonical: 'take for', az: 'kimi qəbul etmək, zənn etmək', tr: 'sanmak, yerine koymak', ru: 'принимать за' },
  'take in': { canonical: 'take in', az: 'başa düşmək; aldatmaq; sığınacaq vermək', tr: 'anlamak, içeri almak', ru: 'усваивать, впускать' },
  'take off': { canonical: 'take off', az: 'havalanmaq (təyyarə); çıxarmaq (paltar)', tr: 'havalanmak, çıkarmak', ru: 'взлетать, снимать' },
  'take on': { canonical: 'take on', az: 'öhdəsinə götürmək, işə qəbul etmək', tr: 'üstlenmek, işe almak', ru: 'брать на себя, нанимать' },
  'take out': { canonical: 'take out', az: 'çıxarmaq, gəzməyə aparmaq', tr: 'dışarı çıkarmak', ru: 'вынимать, выводить' },
  'take over': { canonical: 'take over', az: 'idarəni ələ almaq, təhvil almaq', tr: 'devralmak', ru: 'перенимать, захватывать' },
  'take to': { canonical: 'take to', az: 'öyrəşmək, sevməyə başlamaq', tr: 'ısınmak, alışmak', ru: 'пристраститься к' },
  'take up': { canonical: 'take up', az: 'başlamaq (hobbi); yer tutmaq', tr: 'başlamak, yer kaplamak', ru: 'браться за, занимать' },

  // LOOK
  'look after': { canonical: 'look after', az: 'qayğısına qalmaq, baxmaq', tr: 'bakmak, ilgilenmek', ru: 'присматривать за' },
  'look ahead': { canonical: 'look ahead', az: 'gələcəyə baxmaq, irəlini düşünmək', tr: 'ileriyi düşünmek', ru: 'смотреть вперед' },
  'look around': { canonical: 'look around', az: 'ətrafı nəzərdən keçirmək', tr: 'etrafına bakınmak', ru: 'оглядываться' },
  'look at': { canonical: 'look at', az: 'baxmaq, nəzər salmaq', tr: 'bakmak', ru: 'смотреть на' },
  'look back': { canonical: 'look back', az: 'keçmişi xatırlamaq, geriyə baxmaq', tr: 'geriye bakmak', ru: 'оглядываться назад' },
  'look down on': { canonical: 'look down on', az: 'yuxarıdan aşağı baxmaq, xor görmək', tr: 'küçümsemek', ru: 'смотреть свысока' },
  'look for': { canonical: 'look for', az: 'axtarmaq', tr: 'aramak', ru: 'искать' },
  'look forward to': { canonical: 'look forward to', az: 'səbirsizliklə gözləmək', tr: 'dört gözle beklemek', ru: 'ждать с нетерпением' },
  'look in': { canonical: 'look in', az: 'baş çəkmək, dəymək', tr: 'uğramak', ru: 'заглянуть' },
  'look into': { canonical: 'look into', az: 'araşdırmaq, tədqiq etmək', tr: 'incelemek, araştırmak', ru: 'исследовать, рассматривать' },
  'look on': { canonical: 'look on', az: 'tamaşa etmək, seyrçi qalmaq', tr: 'seyretmek', ru: 'наблюдать со стороны' },
  'look out': { canonical: 'look out', az: 'ehtiyatlı olmaq, diqqət yetirmək', tr: 'dikkat etmek', ru: 'остерегаться' },
  'look over': { canonical: 'look over', az: 'gözdən keçirmək, yoxlamaq', tr: 'gözden geçirmek', ru: 'просматривать' },
  'look through': { canonical: 'look through', az: 'vərəqləmək, sürətlə oxumaq', tr: 'incelemek, taramak', ru: 'проглядывать' },
  'look to': { canonical: 'look to', az: 'ümid bəsləmək, etibar etmək', tr: 'bel bağlamak', ru: 'рассчитывать на' },
  'look up': { canonical: 'look up', az: 'lüğətdə axtarmaq; yaxşılaşmaq', tr: 'sözlükten bakmak', ru: 'искать в словаре' },
  'look up to': { canonical: 'look up to', az: 'hörmət bəsləmək, örnək götürmək', tr: 'örnek almak, saygı duymak', ru: 'уважать, восхищаться' },

  // GIVE
  'give away': { canonical: 'give away', az: 'hədiyyə etmək; sirri açmaq', tr: 'bağışlamak, ele vermek', ru: 'раздавать, выдавать тайну' },
  'give back': { canonical: 'give back', az: 'qaytarnaq, geri vermək', tr: 'geri vermek', ru: 'возвращать' },
  'give in': { canonical: 'give in', az: 'təslim olmaq, boyun əymək', tr: 'teslim olmak, pes etmek', ru: 'уступать, сдаваться' },
  'give off': { canonical: 'give off', az: 'buraxmaq (qoxu, qaz, istilik)', tr: 'yaymak, çıkarmak', ru: 'испускать, выделять' },
  'give out': { canonical: 'give out', az: 'paylamaq; tükənmək', tr: 'dağıtmak, tükenmek', ru: 'раздавать, иссякать' },
  'give up': { canonical: 'give up', az: 'təslim olmaq, əl çəkmək', tr: 'vazgeçmek, pes etmek', ru: 'сдаваться, бросать' },

  // GET
  'get across': { canonical: 'get across', az: 'başa salmaq, çatdırmaq', tr: 'anlatabilmek', ru: 'донести, объяснить' },
  'get along': { canonical: 'get along', az: 'yola getmək, dil tapmaq', tr: 'anlaşmak, geçinmek', ru: 'ладить, уживаться' },
  'get at': { canonical: 'get at', az: 'işarə vurmaq; əli çatmaq', tr: 'demek istemek, ulaşmak', ru: 'намекать, добираться' },
  'get away': { canonical: 'get away', az: 'qaçmaq, canını qurtarmaq', tr: 'kaçmak, kurtulmak', ru: 'убегать, уходить' },
  'get back': { canonical: 'get back', az: 'qayıtmaq, geri dönmək', tr: 'geri dönmek', ru: 'возвращаться' },
  'get by': { canonical: 'get by', az: 'qənaətlə dolanmaq, keçinmək', tr: 'idare etmek, geçinmek', ru: 'выживать, обходиться' },
  'get down': { canonical: 'get down', az: 'aşağı düşmək; əhvalı korlamaq', tr: 'aşağı inmek, moral bozmak', ru: 'спускаться, огорчать' },
  'get in': { canonical: 'get in', az: 'daxil olmaq, minmək (maşına)', tr: 'binmek, girmek', ru: 'входить, садиться' },
  'get off': { canonical: 'get off', az: 'düşmək (avtobusdan); yola düşmək', tr: 'inmek, ayrılmak', ru: 'сходить, отправляться' },
  'get on': { canonical: 'get on', az: 'minmək; yola getmək', tr: 'binmek, iyi geçinmek', ru: 'садиться, ладить' },
  'get out': { canonical: 'get out', az: 'çıxmaq, tərk etmək', tr: 'çıkmak, defolmak', ru: 'уходить, выбираться' },
  'get over': { canonical: 'get over', az: 'sağalmaq, öhdəsindən gəlmək', tr: 'atlatmak, iyileşmek', ru: 'преодолевать, оправляться' },
  'get rid of': { canonical: 'get rid of', az: 'yaxasını qurtarmaq, atmaq', tr: 'kurtulmak', ru: 'избавляться от' },
  'get through': { canonical: 'get through', az: 'əlaqə yaratmaq (telefonla); başa vurmaq', tr: 'ulaşmak, bitirmek', ru: 'дозвониться, пройти сквозь' },
  'get up': { canonical: 'get up', az: 'yuxudan durmaq, ayağa qalxmaq', tr: 'uyanmak, ayağa kalkmak', ru: 'вставать, подниматься' },

  // SET
  'set about': { canonical: 'set about', az: 'başlamaq, girişmək', tr: 'koyulmak, başlamak', ru: 'приниматься за' },
  'set aside': { canonical: 'set aside', az: 'bir kənara qoymaq, saxlamaq', tr: 'kenara koymak, ayırmak', ru: 'откладывать, выделять' },
  'set back': { canonical: 'set back', az: 'ləngitmək, gecikdirmək', tr: 'aksatmak, geciktirmek', ru: 'задерживать' },
  'set forth': { canonical: 'set forth', az: 'yola düşmək; bəyan etmək', tr: 'yola çıkmak, açıklamak', ru: 'отправляться, излагать' },
  'set off': { canonical: 'set off', az: 'yola düşmək; səbəb olmaq', tr: 'yola koyulmak, tetiklemek', ru: 'отправляться в путь' },
  'set out': { canonical: 'set out', az: 'səfərə çıxmaq; məqsəd qoymaq', tr: 'yola çıkmak, hedeflemek', ru: 'отправляться, намереваться' },
  'set up': { canonical: 'set up', az: 'qurmaq, yaratmaq, təşkil etmək', tr: 'kurmak, düzenlemek', ru: 'устанавливать, учреждать' },

  // TURN
  'turn around': { canonical: 'turn around', az: 'dönmək, arxaya çevrilmək', tr: 'arkasını dönmek', ru: 'разворачиваться' },
  'turn away': { canonical: 'turn away', az: 'üz döndərmək; içəri buraxmamaq', tr: 'geri çevirmek', ru: 'отворачиваться, не пускать' },
  'turn back': { canonical: 'turn back', az: 'geri qayıtmaq, geri dönmək', tr: 'geri dönmek', ru: 'поворачивать назад' },
  'turn down': { canonical: 'turn down', az: 'rədd etmək; səsini azaltmaq', tr: 'reddetmek, kısmak', ru: 'отклонять, уменьшать звук' },
  'turn in': { canonical: 'turn in', az: 'yatmağa getmək; təslim etmək', tr: 'yatmak, teslim etmek', ru: 'ложиться спать, сдавать' },
  'turn into': { canonical: 'turn into', az: 'çevrilmək, dönmək', tr: 'dönüşmek', ru: 'превращаться в' },
  'turn off': { canonical: 'turn off', az: 'söndürmək, bağlamaq', tr: 'kapatmak', ru: 'выключать' },
  'turn on': { canonical: 'turn on', az: 'yandırmaq, açmaq', tr: 'açmak', ru: 'включать' },
  'turn out': { canonical: 'turn out', az: 'nəticələnmək, məlum olmaq', tr: 'ortaya çıkmak, sonuçlanmak', ru: 'оказываться, получаться' },
  'turn over': { canonical: 'turn over', az: 'çevirmək; təhvil vermək', tr: 'tersyüz etmek, devretmek', ru: 'переворачивать, передавать' },
  'turn up': { canonical: 'turn up', az: 'qəfildən peyda olmaq; səsini qaldırmaq', tr: 'çıkagelmek, sesini açmak', ru: 'появляться, делать громче' },

  // BRING
  'bring about': { canonical: 'bring about', az: 'səbəb olmaq, törətmək', tr: 'yol açmak, neden olmak', ru: 'вызывать, приводить к' },
  'bring back': { canonical: 'bring back', az: 'geri gətirmək, yada salmaq', tr: 'geri getirmek, hatırlatmak', ru: 'возвращать, напоминать' },
  'bring down': { canonical: 'bring down', az: 'aşırtmaq, yerə yıxmaq; endirmək', tr: 'düşürmek, indirmek', ru: 'снижать, сбивать' },
  'bring forward': { canonical: 'bring forward', az: 'irəli sürmək, təklif etmək', tr: 'öne sürmek', ru: 'выдвигать, предлагать' },
  'bring in': { canonical: 'bring in', az: 'gəlir gətirmək; cəlb etmək', tr: 'kazandırmak, getirmek', ru: 'приносить доход, привлекать' },
  'bring out': { canonical: 'bring out', az: 'aşkara çıxarmaq; nəşr etmək', tr: 'ortaya çıkarmak, yayımlamak', ru: 'выявлять, издавать' },
  'bring up': { canonical: 'bring up', az: 'tərbiyə etmək; mövzu qaldırmaq', tr: 'büyütmek, gündeme getirmek', ru: 'воспитывать, поднимать вопрос' },

  // BREAK
  'break down': { canonical: 'break down', az: 'xarab olmaq; çökmək, ağlamaq', tr: 'bozulmak, çökmek', ru: 'ломаться, сдавать нервы' },
  'break in': { canonical: 'break in', az: 'zorla girmək; sözünü kəsmək', tr: 'zorla girmek, lafa girmek', ru: 'вламываться, вмешиваться' },
  'break into': { canonical: 'break into', az: 'qanunsuz daxil olmaq; başlamaq', tr: 'zorla girmek', ru: 'вломиться' },
  'break off': { canonical: 'break off', az: 'qırmaq; əlaqəni kəsmək', tr: 'koparmak, ilişkiyi kesmek', ru: 'обрывать, прекращать' },
  'break out': { canonical: 'break out', az: 'qəfildən başlamaq (yanğın, müharibə); qaçmaq', tr: 'patlak vermek, firar etmek', ru: 'вспыхивать, вырываться' },
  'break through': { canonical: 'break through', az: 'yarıb keçmək, nailiyyət əldə etmək', tr: 'yarıp geçmek, çığır açmak', ru: 'прорываться' },
  'break up': { canonical: 'break up', az: 'ayrılmaq; dağılmaq', tr: 'ayrılmak, dağılmak', ru: 'расставаться, распадаться' },

  // COME
  'come across': { canonical: 'come across', az: 'təsadüfən rast gəlmək', tr: 'karşılaşmak, rastlamak', ru: 'наталкиваться на' },
  'come along': { canonical: 'come along', az: 'birlikdə getmək; irəliləmək', tr: 'birlikte gelmek, gelişmek', ru: 'идти вместе, продвигаться' },
  'come back': { canonical: 'come back', az: 'geri qayıtmaq', tr: 'geri dönmek', ru: 'возвращаться' },
  'come by': { canonical: 'come by', az: 'əldə etmək; dəymək', tr: 'elde etmek, uğramak', ru: 'доставать, заглядывать' },
  'come down': { canonical: 'come down', az: 'aşağı düşmək, enmək', tr: 'inmek, azalmak', ru: 'спускаться, снижаться' },
  'come forward': { canonical: 'come forward', az: 'irəli çıxmaq, könüllü olmaq', tr: 'öne çıkmak', ru: 'выходить вперед' },
  'come in': { canonical: 'come in', az: 'içəri girmək', tr: 'içeri girmek', ru: 'входить' },
  'come off': { canonical: 'come off', az: 'qopmaq; baş tutmaq', tr: 'kopmak, başarılı olmak', ru: 'отрываться, удаваться' },
  'come on': { canonical: 'come on', az: 'tələs, gəl; irəliləmək', tr: 'hadi, başlamak', ru: 'давай, наступать' },
  'come out': { canonical: 'come out', az: 'çıxmaq, nəşr olunmaq; aşkar olmaq', tr: 'çıkmak, yayımlanmak', ru: 'выходить, появляться' },
  'come up': { canonical: 'come up', az: 'ortaya çıxmaq, yaxınlaşmaq', tr: 'ortaya çıkmak, yaklaşmak', ru: 'возникать, подходить' },
  'come up with': { canonical: 'come up with', az: 'fikir irəli sürmək, tapmaq', tr: 'fikir bulmak, üretmek', ru: 'придумывать, предлагать' },

  // GO
  'go ahead': { canonical: 'go ahead', az: 'irəliləmək, davam etmək, başlamaq', tr: 'devam etmek, başlamak', ru: 'продолжать, начинать' },
  'go away': { canonical: 'go away', az: 'uzaqlaşmaq, çıxıb getmək', tr: 'gitmek, uzaklaşmak', ru: 'уходить' },
  'go back': { canonical: 'go back', az: 'geri qayıtmaq', tr: 'geri dönmek', ru: 'возвращаться' },
  'go by': { canonical: 'go by', az: 'keçib getmək (vaxt); rəhbər tutmaq', tr: 'geçip gitmek', ru: 'проходить мимо' },
  'go down': { canonical: 'go down', az: 'enmək, batmaq (günəş); azalmaq', tr: 'inmek, batmak', ru: 'спускаться, садиться' },
  'go for': { canonical: 'go for', az: 'seçmək, cəhd etmək', tr: 'tercih etmek, girişmek', ru: 'выбирать, пытаться' },
  'go in': { canonical: 'go in', az: 'içəri daxil olmaq', tr: 'içeri girmek', ru: 'входить' },
  'go off': { canonical: 'go off', az: 'partlamaq; xarab olmaq; səslənmək (zəng)', tr: 'patlamak, çalmak', ru: 'взрываться, звенеть' },
  'go on': { canonical: 'go on', az: 'davam etmək, baş vermək', tr: 'devam etmek, olmak', ru: 'продолжать, происходить' },
  'go out': { canonical: 'go out', az: 'çölə çıxmaq; sönmək (işıq)', tr: 'dışarı çıkmak, sönmek', ru: 'выходить в свет, гаснуть' },
  'go over': { canonical: 'go over', az: 'təkrarlamaq, gözdən keçirmək', tr: 'gözden geçirmek', ru: 'повторять, проверять' },
  'go through': { canonical: 'go through', az: 'başa vurmaq, çətinlik çəkmək', tr: 'yaşamak, atlatmak', ru: 'проходить через, испытывать' },
  'go up': { canonical: 'go up', az: 'yuxarı qalxmaq, artmaq', tr: 'yükselmek, artmak', ru: 'подниматься, расти' },

  // RUN
  'run across': { canonical: 'run across', az: 'rast gəlmək', tr: 'rastlamak', ru: 'случайно встретить' },
  'run away': { canonical: 'run away', az: 'qaçmaq', tr: 'kaçmak', ru: 'убегать' },
  'run into': { canonical: 'run into', az: 'toqquşmaq, təsadüfən rastlaşmaq', tr: 'rastlamak, çarpmak', ru: 'сталкиваться с' },
  'run out': { canonical: 'run out', az: 'tükənmək, qurtarmaq', tr: 'tükenmek, bitmek', ru: 'заканчиваться, иссякать' },
  'run over': { canonical: 'run over', az: 'maşınla vurmaq; daşmaq', tr: 'ezmek, taşmak', ru: 'переехать, переливаться' },

  // HOLD
  'hold back': { canonical: 'hold back', az: 'özünü saxlamaq, gizlətmək', tr: 'tutmak, engellemek', ru: 'сдерживать' },
  'hold on': { canonical: 'hold on', az: 'möhkəm yapışmaq; xətdə qalmaq', tr: 'beklemek, sıkı tutunmak', ru: 'держаться, ждать' },
  'hold out': { canonical: 'hold out', az: 'dözmək; uzatmaq (əlini)', tr: 'dayanmak, uzatmak', ru: 'держаться, протягивать' },
  'hold up': { canonical: 'hold up', az: 'ləngitmək; qarət etmək', tr: 'geciktirmek, soymak', ru: 'задерживать, грабить' },

  // CARRY
  'carry on': { canonical: 'carry on', az: 'davam etmək', tr: 'devam etmek', ru: 'продолжать' },
  'carry out': { canonical: 'carry out', az: 'həyata keçirmək, icra etmək', tr: 'yerine getirmek, uygulamak', ru: 'выполнять, осуществлять' },

  // KEEP
  'keep on': { canonical: 'keep on', az: 'davam etmək, əl çəkməmək', tr: 'devam etmek, sürdürmek', ru: 'продолжать' },
  'keep up': { canonical: 'keep up', az: 'ayaqlaşmaq, çatdırmaq', tr: 'ayak uydurmak', ru: 'поспевать за' },
  'keep off': { canonical: 'keep off', az: 'uzaq durmaq, yaxınlaşmamaq', tr: 'uzak durmak', ru: 'держаться подальше' },

  // STAND
  'stand by': { canonical: 'stand by', az: 'dəstək olmaq; hazır gözləmək', tr: 'desteklemek, hazır beklemek', ru: 'поддерживать, быть наготове' },
  'stand for': { canonical: 'stand for', az: 'mənasını vermək; dözmək', tr: 'anlamına gelmek, tahammül etmek', ru: 'означать, терпеть' },
  'stand out': { canonical: 'stand out', az: 'fərqlənmək, seçilmək', tr: 'göze çarpmak, öne çıkmak', ru: 'выделяться' },
  'stand up': { canonical: 'stand up', az: 'ayağa qalxmaq', tr: 'ayağa kalkmak', ru: 'вставать' },

  // CALL
  'call for': { canonical: 'call for', az: 'tələb etmək', tr: 'gerektirmek, talep etmek', ru: 'требовать' },
  'call off': { canonical: 'call off', az: 'ləğv etmək', tr: 'iptal etmek', ru: 'отменять' },
  'call on': { canonical: 'call on', az: 'baş çəkmək; çağırmaq', tr: 'ziyaret etmek, davet etmek', ru: 'навещать, призывать' },
  'call out': { canonical: 'call out', az: 'ucadan çağırmaq, səsləmək', tr: 'bağırmak, seslenmek', ru: 'выкрикивать' },

  // FIND & POINT & PICK
  'find out': { canonical: 'find out', az: 'öyrənmək, aşkar etmək', tr: 'öğrenmek, keşfetmek', ru: 'узнавать, выяснять' },
  'point out': { canonical: 'point out', az: 'diqqətə çatdırmaq, göstərmək', tr: 'belirtmek, işaret etmek', ru: 'указывать, обращать внимание' },
  'pick up': { canonical: 'pick up', az: 'qaldırmaq; götürmək; öyrənmək', tr: 'toplamak, almak, öğrenmek', ru: 'подбирать, учить' },
  'pick out': { canonical: 'pick out', az: 'seçmək, fərqləndirmək', tr: 'seçmek, ayırt etmek', ru: 'выбирать, различать' },

  // FALL
  'fall apart': { canonical: 'fall apart', az: 'parçalanmaq, dağılmaq', tr: 'dağılmak, parçalanmak', ru: 'разваливаться' },
  'fall behind': { canonical: 'fall behind', az: 'geridə qalmaq', tr: 'geride kalmak', ru: 'отставать' },
  'fall heir to': { canonical: 'fall heir to', az: 'mirasa sahib olmaq, varis olmaq', tr: 'mirasçı olmak', ru: 'унаследовать' },
  'fall in with': { canonical: 'fall in with', az: 'razılaşmaq, qoşulmaq', tr: 'uyuşmak, katılmak', ru: 'соглашаться с' },
  'fall out': { canonical: 'fall out', az: 'küsmək, dalaşmaq', tr: 'bozuşmak, kavga etmek', ru: 'ссориться' },

  // CATCH & HANG & PASS
  'catch up': { canonical: 'catch up', az: 'çatıb çatmaq, bərabərləşmək', tr: 'yetişmek, yakalamak', ru: 'догонять' },
  'catch up with': { canonical: 'catch up with', az: 'arxasınca çatmaq', tr: 'yakalamak', ru: 'наверстать' },
  'hang on': { canonical: 'hang on', az: 'gözləmək; möhkəm yapışmaq', tr: 'beklemek, tutunmak', ru: 'подождать, держаться' },
  'hang out': { canonical: 'hang out', az: 'vaxt keçirmək, gəzmək', tr: 'takılmak, vakit geçirmek', ru: 'тусоваться' },
  'pass away': { canonical: 'pass away', az: 'vəfat etmək, dünyasını dəyişmək', tr: 'vefat etmek', ru: 'умирать, скончаться' },
  'pass by': { canonical: 'pass by', az: 'yanından ötüb keçmək', tr: 'önünden geçmek', ru: 'проходить мимо' },
  'pass out': { canonical: 'pass out', az: 'özündən getmək, huşunu itirmək', tr: 'bayılmak', ru: 'терять сознание' },

  // WORK & FIGURE & PUT
  'work out': { canonical: 'work out', az: 'həll etmək; idman etmək; baş tutmaq', tr: 'çözmek, egzersiz yapmak', ru: 'срабатывать, тренироваться' },
  'figure out': { canonical: 'figure out', az: 'başa düşmək, anlamaq, hesablamaq', tr: 'anlamak, çözmek', ru: 'выяснять, понимать' },
  'put off': { canonical: 'put off', az: 'təxirə salmaq, ertələmək', tr: 'ertelemek', ru: 'откладывать' },
  'put on': { canonical: 'put on', az: 'geyinmək; qoşmaq', tr: 'giymek', ru: 'надевать' },
  'put out': { canonical: 'put out', az: 'söndürmək (od, işıq)', tr: 'söndürmek', ru: 'тушить' },
  'put up with': { canonical: 'put up with', az: 'dözmək, tab gətirmək', tr: 'katlanmak, tahammül etmek', ru: 'терпеть, мириться с' },

  // FIXED LITERARY IDIOMS & COLLOCATIONS
  'in some manner': { canonical: 'in some manner', az: 'müəyyən tərzdə, hansısa yolla', tr: 'bir şekilde', ru: 'каким-то образом' },
  'by no means': { canonical: 'by no means', az: 'heç bir vəchlə, əsla', tr: 'asla, katiyen', ru: 'ни в коем случае' },
  'at once': { canonical: 'at once', az: 'dərhal, birdən', tr: 'hemen, derhal', ru: 'сразу, немедленно' },
  'at least': { canonical: 'at least', az: 'heç olmasa, ən azı', tr: 'en azından', ru: 'по крайней мере' },
  'in fact': { canonical: 'in fact', az: 'əslində, faktiki olaraq', tr: 'aslında', ru: 'на самом деле, фактически' },
  'as well as': { canonical: 'as well as', az: 'həmçinin, eləcə də', tr: 've ayrıca, yanı sıra', ru: 'так же как и' },
  'on the contrary': { canonical: 'on the contrary', az: 'əksinə, tam tərsinə', tr: 'aksine, tam tersine', ru: 'наоборот, напротив' },
  'on the other hand': { canonical: 'on the other hand', az: 'digər tərəfdən', tr: 'diğer yandan', ru: 'с другой стороны' },
  'all of a sudden': { canonical: 'all of a sudden', az: 'qəfildən, gözlənilmədən', tr: 'aniden, birdenbire', ru: 'внезапно' },
  'little by little': { canonical: 'little by little', az: 'tədricən, az-az', tr: 'yavaş yavaş, azar azar', ru: 'постепенно, мало-помалу' },
  'no wonder': { canonical: 'no wonder', az: 'təəccüblü deyil ki', tr: 'şaşmamalı', ru: 'неудивительно' },
  'so far': { canonical: 'so far', az: 'indiyə qədər', tr: 'şimdiye kadar', ru: 'до сих пор' },
  'in spite of': { canonical: 'in spite of', az: 'baxmayaraq ki, rəğmən', tr: 'rağmen, karşın', ru: 'несмотря на' },
  'take for granted': { canonical: 'take for granted', az: 'adi hal kimi qəbul etmək, dəyərini bilməmək', tr: 'değerini bilmemek', ru: 'принимать как должное' },
  'make up one mind': { canonical: "make up one's mind", az: 'qərara gəlmək, qərar vermək', tr: 'karar vermek', ru: 'принимать решение' },
  'keep an eye on': { canonical: 'keep an eye on', az: 'göz-qulaq olmaq, nəzarət etmək', tr: 'göz kulak olmak', ru: 'следить за, не спускать глаз' },
};

/**
 * Verb lemma base mapping for common phrasal verbs
 */
const VERB_LEMMAS: Record<string, string> = {
  linked: 'link',
  linking: 'link',
  links: 'link',
  took: 'take',
  taken: 'take',
  taking: 'take',
  takes: 'take',
  looked: 'look',
  looking: 'look',
  looks: 'look',
  gave: 'give',
  given: 'give',
  giving: 'give',
  gives: 'give',
  got: 'get',
  gotten: 'get',
  getting: 'get',
  gets: 'get',
  set: 'set',
  setting: 'set',
  sets: 'set',
  turned: 'turn',
  turning: 'turn',
  turns: 'turn',
  brought: 'bring',
  bringing: 'bring',
  brings: 'bring',
  broke: 'break',
  broken: 'break',
  breaking: 'break',
  breaks: 'break',
  came: 'come',
  coming: 'come',
  comes: 'come',
  went: 'go',
  gone: 'go',
  going: 'go',
  goes: 'go',
  ran: 'run',
  running: 'run',
  runs: 'run',
  held: 'hold',
  holding: 'hold',
  holds: 'hold',
  carried: 'carry',
  carrying: 'carry',
  carries: 'carry',
  kept: 'keep',
  keeping: 'keep',
  keeps: 'keep',
  stood: 'stand',
  standing: 'stand',
  stands: 'stand',
  called: 'call',
  calling: 'call',
  calls: 'call',
  found: 'find',
  finding: 'find',
  finds: 'find',
  picked: 'pick',
  picking: 'pick',
  picks: 'pick',
  pointed: 'point',
  pointing: 'point',
  points: 'point',
  fell: 'fall',
  fallen: 'fall',
  falling: 'fall',
  falls: 'fall',
  caught: 'catch',
  catching: 'catch',
  catches: 'catch',
  hung: 'hang',
  hanging: 'hang',
  hangs: 'hang',
  passed: 'pass',
  passing: 'pass',
  passes: 'pass',
  worked: 'work',
  working: 'work',
  works: 'work',
  figured: 'figure',
  figuring: 'figure',
  figures: 'figure',
  put: 'put',
  putting: 'put',
  puts: 'put',
};

/**
 * Searches the sentence context for any phrasal verbs, idioms or collocations
 * related to the tapped word. (0ms synchronous lookup)
 */
export function detectIdiomInContext(
  word: string,
  sentenceContext: string | null | undefined,
  targetLang: string = 'az',
): DetectedIdiom | null {
  if (!word || !sentenceContext) return null;

  const cleanWord = word.trim().toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
  if (!cleanWord) return null;

  // Split sentence into words while preserving order
  const tokens = sentenceContext
    .replace(/[—–]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim().toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ''))
    .filter(Boolean);

  if (tokens.length === 0) return null;

  // Find all indices where cleanWord appears
  const candidateIndices: number[] = [];
  tokens.forEach((t, idx) => {
    if (t === cleanWord) candidateIndices.push(idx);
  });

  // If exact word not found, check lemma match
  if (candidateIndices.length === 0) {
    const lemmas = getWordCandidateLemmas(cleanWord);
    tokens.forEach((t, idx) => {
      if (lemmas.includes(t)) candidateIndices.push(idx);
    });
  }

  const wordLemma = VERB_LEMMAS[cleanWord] || cleanWord;

  for (const idx of candidateIndices) {
    // 1. Trigram Forward: word + next1 + next2 (e.g. 'look forward to', 'in some manner', 'by no means')
    if (idx + 2 < tokens.length) {
      const next1 = tokens[idx + 1];
      const next2 = tokens[idx + 2];
      const trigramKey = `${wordLemma} ${next1} ${next2}`;
      const rawTrigram = `${tokens[idx]} ${next1} ${next2}`;
      const found = PHRASAL_VERBS_BASE[trigramKey] || PHRASAL_VERBS_BASE[rawTrigram];
      if (found) {
        return {
          phrase: found.canonical,
          matchedText: `${tokens[idx]} ${tokens[idx + 1]} ${tokens[idx + 2]}`,
          translation: found[targetLang as keyof PhraseDef] || found.az || found.canonical,
        };
      }
    }

    // 2. Bigram Forward: word + next1 (e.g. 'linked up', 'take off', 'give in')
    if (idx + 1 < tokens.length) {
      const next1 = tokens[idx + 1];
      const bigramKey = `${wordLemma} ${next1}`;
      const rawBigram = `${tokens[idx]} ${next1}`;
      const found = PHRASAL_VERBS_BASE[bigramKey] || PHRASAL_VERBS_BASE[rawBigram];
      if (found) {
        return {
          phrase: found.canonical,
          matchedText: `${tokens[idx]} ${tokens[idx + 1]}`,
          translation: found[targetLang as keyof PhraseDef] || found.az || found.canonical,
        };
      }
    }

    // 3. Bigram Backward: prev1 + word (e.g. user tapped 'up' in 'linked up')
    if (idx > 0) {
      const prev1 = tokens[idx - 1];
      const prevLemma = VERB_LEMMAS[prev1] || prev1;
      const backBigramKey = `${prevLemma} ${cleanWord}`;
      const backRawBigram = `${prev1} ${cleanWord}`;
      const found = PHRASAL_VERBS_BASE[backBigramKey] || PHRASAL_VERBS_BASE[backRawBigram];
      if (found) {
        return {
          phrase: found.canonical,
          matchedText: `${tokens[idx - 1]} ${tokens[idx]}`,
          translation: found[targetLang as keyof PhraseDef] || found.az || found.canonical,
        };
      }
    }

    // 4. Trigram Middle: prev1 + word + next1 (e.g. user tapped 'some' in 'in some manner')
    if (idx > 0 && idx + 1 < tokens.length) {
      const prev1 = tokens[idx - 1];
      const next1 = tokens[idx + 1];
      const midTrigramKey = `${prev1} ${cleanWord} ${next1}`;
      const found = PHRASAL_VERBS_BASE[midTrigramKey];
      if (found) {
        return {
          phrase: found.canonical,
          matchedText: `${tokens[idx - 1]} ${tokens[idx]} ${tokens[idx + 1]}`,
          translation: found[targetLang as keyof PhraseDef] || found.az || found.canonical,
        };
      }
    }
  }

  // 5. Check if tapped word is anywhere inside a multi-word expression in sentenceContext
  const lowerSentence = sentenceContext.toLowerCase();
  for (const [key, def] of Object.entries(PHRASAL_VERBS_BASE)) {
    const keyWords = key.split(' ');
    if (keyWords.includes(cleanWord) || keyWords.includes(wordLemma)) {
      if (lowerSentence.includes(key)) {
        return {
          phrase: def.canonical,
          matchedText: key,
          translation: def[targetLang as keyof PhraseDef] || def.az || def.canonical,
        };
      }
    }
  }

  return null;
}

/**
 * Scans for dynamic verb + particle combinations not yet in the curated base,
 * allowing live translation without missing any phrasal verb.
 */
export function getPhrasalVerbCandidate(
  word: string,
  sentenceContext: string | null | undefined,
): { canonical: string; matchedText: string } | null {
  if (!word || !sentenceContext) return null;

  const cleanWord = word.trim().toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
  if (!cleanWord) return null;

  const tokens = sentenceContext
    .replace(/[—–]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim().toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ''))
    .filter(Boolean);

  const idx = tokens.indexOf(cleanWord);
  if (idx !== -1 && idx + 1 < tokens.length) {
    const nextWord = tokens[idx + 1];
    if (PHRASAL_PARTICLES.has(nextWord)) {
      const wordLemma = VERB_LEMMAS[cleanWord] || cleanWord;
      return {
        canonical: `${wordLemma} ${nextWord}`,
        matchedText: `${tokens[idx]} ${nextWord}`,
      };
    }
  }

  return null;
}
