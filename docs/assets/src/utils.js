/* Cinemap — data, taxonomies, i18n, helpers */

// ============================================================
// 0) Config
// ============================================================
window.CINEMAP_CONFIG = {
  // Formspree endpoint that receives notify-me submissions.
  // Each movie request POSTs the contact + movie payload here;
  // emails arrive in the Formspree inbox + can be exported as CSV.
  notifyEndpoint: 'https://formspree.io/f/mlgaykkv',
  // Supabase receives anonymous product signals only. Do not send email,
  // WhatsApp, names, or other direct contact details here.
  supabaseEventsEndpoint: 'https://kljlgxqqvgpvsyeoitqx.supabase.co/rest/v1/cinemap_events',
  supabasePublishableKey: 'sb_publishable_bABwg8Yjsni-8EvhUsWr0A_HTxNmTXV',
  releaseVersion: 'v1.55',
  releaseNoteAr: 'بطاقات قائمتك صارت موسطة، والأرقام في أول العنوان.',
  releaseNoteEn: 'Watchlist titles are centered and numbers stay at the start.',
};

// ============================================================
// 1) MOVIE DATA — preserved from previous site, enriched with
//    language / mood / status fields for new filters.
// ============================================================

const RAW_MOVIES = [
  // JANUARY
  { month: 0, ar: "28 Years Later: The Bone Temple", en: "28 Years Later: The Bone Temple", genre: "horror", date: "2026-01-15", pick: true,
    tmdbId: 1272837, exp: ['imax', 'screenx', '4dx'], language: 'en', mood: 'thrill',
    overview: "الجزء الثاني من الثلاثية التي تتبّع عالماً ما بعد تفشي الفيروس بعد 28 عاماً.",
    overviewEn: "The second chapter of the post-outbreak trilogy — 28 years on.",
    runtime: 115, rating: "R" },
  { month: 0, ar: "دورايمون", en: "Doraemon: Nobita's Art World Tales", aliases: ["دورايمون", "نوبيتا", "دورايمون نوبيتا"], genre: "anime", date: "2026-01-15",
    tmdbId: 1372489, language: 'jp', mood: 'family',
    overview: "مغامرة جديدة للقط الروبوت دورايمون وصديقه نوبيتا في عالم الفن.",
    overviewEn: "A new adventure for Doraemon and Nobita inside a world of art.",
    runtime: 104, rating: "PG" },
  { month: 0, ar: "Primate", en: "Primate", genre: "thriller", date: "2026-01-22", language: 'en', mood: 'thrill',
    overview: "تشويق نفسي يدور حول تجارب طبية سرية.",
    overviewEn: "A psychological thriller about a secret medical experiment.",
    runtime: 108, rating: "R" },
  { month: 0, ar: "Mercy", en: "Mercy", genre: "drama", date: "2026-01-22", language: 'en', mood: 'deep',
    overview: "دراما تدور حول رحمة، محاكمة، وسؤال أخلاقي صعب.",
    overviewEn: "A drama about mercy, trial, and an impossible moral choice.",
    runtime: 118, rating: "PG-13" },
  { month: 0, ar: "Return to Silent Hill", en: "Return to Silent Hill", genre: "horror", date: "2026-01-22",
    tmdbId: 680493, exp: ['4dx'], language: 'en', mood: 'thrill',
    overview: "عودة إلى المدينة الضبابية الأكثر رعباً في تاريخ ألعاب الفيديو.",
    overviewEn: "A return to gaming's most haunted town.",
    runtime: 125, rating: "R" },
  { month: 0, ar: "Send Help", en: "Send Help", genre: "thriller", date: "2026-01-29", language: 'en', mood: 'thrill',
    overview: "رعب نفسي يدور حول شخصين عالقين على جزيرة نائية.",
    overviewEn: "A psychological thriller about two people stranded on a remote island.",
    runtime: 96, rating: "R" },

  // FEBRUARY
  { month: 2, ar: "Cold Storage", en: "Cold Storage", genre: "action", date: "2026-03-26", language: 'en', mood: 'thrill',
    overview: "تشويق علمي — كائن مجمّد من الماضي يعود للحياة.",
    overviewEn: "A frozen creature from the past wakes up.",
    runtime: 110, rating: "PG-13" },
  { month: 2, ar: "Scream 7", en: "Scream 7", aliases: ["سكريم", "سكريم 7", "سكريم٧", "صرخة", "صرخة 7"], genre: "horror", date: "2026-03-19", pick: true,
    tmdbId: 1159559, exp: ['4dx', 'screenx'], language: 'en', mood: 'thrill',
    overview: "عودة Ghostface — سيدني بريسكوت تواجه قاتلاً جديداً.",
    overviewEn: "Ghostface returns — Sidney Prescott faces a new killer.",
    runtime: 118, rating: "R" },
  { month: 1, ar: "Crime 101", en: "Crime 101", genre: "thriller", date: "2026-02-11",
    tmdbId: 1171145, language: 'en', mood: 'thrill',
    overview: "تحقيق جرائم مبني على رواية دون وينسلو.",
    overviewEn: "A crime investigation adapted from Don Winslow's novel.",
    runtime: 122, rating: "R" },
  { month: 1, ar: "Wuthering Heights", en: "Wuthering Heights", genre: "drama", date: "2026-02-12",
    tmdbId: 1316092, exp: ['suites', 'dolby'], language: 'en', mood: 'romance',
    overview: "اقتباس جديد لرواية إميلي برونتي الكلاسيكية — قصة حب قاتلة على المروج الإنجليزية.",
    overviewEn: "A new adaptation of Emily Brontë's classic — a love story on the English moors.",
    runtime: 130, rating: "PG-13" },
  { month: 1, ar: "Good Luck, Have Fun, Don't Die", en: "Good Luck, Have Fun, Don't Die", genre: "scifi", date: "2026-02-26", language: 'en', mood: 'thrill',
    overview: "خيال علمي ملحمي من المخرج جوردن فاخت-فيتالي.",
    overviewEn: "An epic sci-fi from director Gore Verbinski.",
    runtime: 128, rating: "R" },

  // MARCH
  { month: 2, ar: "Hoppers", en: "Hoppers", genre: "family", date: "2026-03-19",
    tmdbId: 1327819, exp: ['imax', 'dolby'], language: 'en', mood: 'family',
    overview: "فيلم أنيميشن من بيكسار — بطلته فتاة تنتقل وعيها إلى جسم قندس روبوتي.",
    overviewEn: "A Pixar animation about a girl whose mind enters a robot beaver.",
    runtime: 98, rating: "PG" },
  { month: 2, ar: "شباب البومب 3", en: "Shabab El Bomb 3", aliases: ["Shabab Al Bomb 3", "شباب البومب", "شباب البومب 3", "شباب البومب٣", "شباب البومب ٣"], genre: "arabic", date: "2026-03-19", pick: true, language: 'ar', mood: 'fun',
    overview: "الجزء الثالث من المسلسل الكوميدي السعودي الأيقوني — عودة الشباب إلى السينما.",
    overviewEn: "The third chapter of Saudi Arabia's iconic comedy crew — back on the big screen.",
    runtime: 120, rating: "PG-13" },
  { month: 2, ar: "Project Hail Mary", en: "Project Hail Mary", genre: "scifi", date: "2026-03-19",
    tmdbId: 687163, exp: ['imax', 'dolby'], language: 'en', mood: 'thrill',
    overview: "اقتباس لرواية آندي واير — رائد فضاء يستيقظ ليجد نفسه وحيداً في مهمة لإنقاذ الأرض.",
    overviewEn: "An astronaut wakes up alone on a mission to save Earth — adapted from Andy Weir.",
    runtime: 135, rating: "PG-13" },

  // APRIL
  { month: 3, ar: "Super Mario Galaxy", en: "The Super Mario Galaxy Movie", aliases: ["سوبر ماريو", "ماريو", "سوبر ماريو جالكسي"], genre: "family", date: "2026-04-01", pick: true,
    tmdbId: 1226863, exp: ['imax', '4dx'], language: 'en', mood: 'family',
    overview: "ماريو ولويجي ينطلقان في مغامرة كونية جديدة عبر المجرة.",
    overviewEn: "Mario and Luigi blast off across the galaxy.",
    runtime: 95, rating: "PG" },
  { month: 3, ar: "Michael", en: "Michael", genre: "drama", date: "2026-04-22",
    tmdbId: 936075, exp: ['dolby', 'suites'], language: 'en', mood: 'deep',
    overview: "سيرة ذاتية لملك البوب مايكل جاكسون.",
    overviewEn: "The biopic of the King of Pop, Michael Jackson.",
    runtime: 140, rating: "PG-13" },
  { month: 3, ar: "The Devil Wears Prada 2", en: "The Devil Wears Prada 2", genre: "comedy", date: "2026-04-30",
    tmdbId: 1314481, language: 'en', mood: 'fun',
    overview: "عودة ميراندا بريستلي بعد عقدين من الفيلم الأصلي.",
    overviewEn: "Miranda Priestly returns, two decades on.",
    runtime: 110, rating: "PG-13" },
  { month: 3, ar: "GOAT", en: "GOAT", genre: "family", date: "2026-04-23", language: 'en', mood: 'family',
    overview: "فيلم كرتون عائلي عن مغامرة شيّقة وممتعة للصغار والكبار.",
    overviewEn: "A family animated adventure full of laughs for kids and adults alike.",
    runtime: 95, rating: "PG" },

  // MAY
  { month: 4, ar: "Mortal Kombat 2", en: "Mortal Kombat 2", aliases: ["مورتال كومبات", "مورتال كومبات 2", "مورتال كومبات٢", "مورتل كومبات"], genre: "action", date: "2026-05-07",
    exp: ['screenx', '4dx'], language: 'en', mood: 'thrill',
    overview: "الجزء الثاني من فيلم القتال الأيقوني — عوالم جديدة ومعارك أضخم.",
    overviewEn: "The iconic fighting franchise — new realms, bigger battles.",
    runtime: 115, rating: "R" },
  { month: 4, ar: "Star Wars: The Mandalorian and Grogu", en: "The Mandalorian and Grogu", genre: "scifi", date: "2026-05-21", pick: true,
    tmdbId: 1228710, exp: ['imax', 'dolby', '4dx'], language: 'en', mood: 'thrill',
    overview: "أول فيلم سينمائي لسلسلة The Mandalorian — ماندو وغروغو في مغامرة جديدة.",
    overviewEn: "The first big-screen entry for The Mandalorian — Mando and Grogu return.",
    runtime: 130, rating: "PG" },
  { month: 4, ar: "The Sheep Detectives", en: "The Sheep Detectives", genre: "family", date: "2026-05-07",
    tmdbId: 1301421, language: 'en', mood: 'fun',
    overview: "ثلاثة خراف يحلّون جريمة قتل في قرية إيرلندية — تحقيق كوميدي مثير بأصوات هيو جاكمان وإيما تومبسون.",
    overviewEn: "Three sheep solve a murder in an Irish village — voiced by Hugh Jackman and Emma Thompson.",
    runtime: 96, rating: "PG" },
  { month: 4, ar: "الكلام على إيه؟!", en: "El Kalam Ala Eh?!", genre: "arabic", date: "2026-05-14",
    tmdbId: 1513183, language: 'ar', mood: 'fun',
    overview: "كوميديا عربية عن مواقف اجتماعية تتحول إلى فوضى لطيفة وسريعة.",
    overviewEn: "An Arabic comedy where social situations spiral into fast, playful chaos.",
    rating: "R18" },
  { month: 4, ar: "أسد", en: "Asad", genre: "arabic", date: "2026-05-21", language: 'ar', mood: 'thrill',
    overview: "فيلم عربي من العناوين التي ظهرت في قائمة الإدارة لباقي 2026.",
    overviewEn: "An Arabic title highlighted in the management slate for the rest of 2026.",
    rating: "TBC" },
  { month: 4, ar: "7 Dogs", en: "7 Dogs", genre: "action", date: "2026-05-28", language: 'ar', mood: 'thrill',
    overview: "أكشن عربي ضمن أفلام الصيف المبكرة في السوق السعودي.",
    overviewEn: "An Arabic action title in the early-summer Saudi slate.",
    rating: "TBC" },

  // JUNE
  { month: 5, ar: "Scary Movie 6", en: "Scary Movie 6", genre: "comedy", date: "2026-06-04", language: 'en', mood: 'fun',
    overview: "الجزء السادس من سلسلة المحاكاة الكوميدية الشهيرة.",
    overviewEn: "The sixth chapter of the long-running spoof series.",
    runtime: 92, rating: "PG-13" },
  { month: 5, ar: "Supergirl", en: "Supergirl: Woman of Tomorrow", genre: "action", date: "2026-06-25",
    tmdbId: 1081003, exp: ['imax', 'screenx'], language: 'en', mood: 'thrill',
    overview: "كارا زور-إل تنطلق في مغامرة عبر المجرات.",
    overviewEn: "Kara Zor-El blasts off on a galactic odyssey.",
    runtime: 128, rating: "PG-13" },
  { month: 5, ar: "Disclosure Day", en: "Disclosure Day", genre: "scifi", date: "2026-06-11", pick: true, language: 'en', mood: 'thrill',
    featuredRank: 9, projectedAdmissions: 350000, badge: "Mystery Pick", badgeAr: "اختيار غامض",
    overview: "إثارة خيال علمي — يوم يُكشف فيه كل شيء.",
    overviewEn: "A sci-fi thriller — the day everything comes out.",
    runtime: 115, rating: "R" },
  { month: 5, ar: "Toy Story 5", en: "Toy Story 5", aliases: ["توي ستوري", "توي ستوري 5", "توي ستوري٥", "حكاية لعبة", "حكاية لعبة 5"], genre: "family", date: "2026-06-18", pick: true,
    tmdbId: 1084244, exp: ['imax', 'dolby', '4dx'], language: 'en', mood: 'family',
    featuredRank: 4, projectedAdmissions: 750000, badge: "Family Pick", badgeAr: "اختيار عائلي",
    overview: "ودي، باز، وكل اللعب عادوا — هذه المرة ضد تحدٍ تقني جديد.",
    overviewEn: "Woody, Buzz and the whole gang are back — this time taking on tech.",
    runtime: 102, rating: "G" },
  { month: 5, ar: "Master of the Universe", en: "Masters of the Universe", genre: "action", date: "2026-06-04",
    tmdbId: 454639, exp: ['imax', 'screenx', '4dx'], language: 'en', mood: 'thrill',
    overview: "هي-مان وأبطال Eternia في فيلم لايف آكشن جديد.",
    overviewEn: "He-Man and the heroes of Eternia in a new live-action.",
    runtime: 125, rating: "PG-13" },
  { month: 5, ar: "الكراش", en: "The Crush", genre: "arabic", date: "2026-06-11", language: 'ar', mood: 'romance',
    overview: "فيلم عربي خفيف عن الإعجاب، العلاقات، والقرارات التي تكبر فجأة.",
    overviewEn: "A light Arabic film about crushes, relationships, and decisions that suddenly get bigger.",
    rating: "TBC" },
  { month: 5, ar: "مسألة حياة أو موت", en: "A Matter of Life and Death", genre: "arabic", date: "2026-06-25", language: 'ar', mood: 'deep',
    overview: "فيلم عربي سعودي عن قرار مصيري يغيّر حياة الشخصيات.",
    overviewEn: "A Saudi Arabic film about a life-changing decision.",
    rating: "TBC" },

  // JULY
  { month: 6, ar: "Minions 3", en: "Minions 3", genre: "family", date: "2026-07-01", pick: true, language: 'en', mood: 'family',
    featuredRank: 7, projectedAdmissions: 550000, badge: "Crowd Favorite", badgeAr: "مفضل جماهيري",
    overview: "المنيونز يعودون في مغامرة جديدة لجمهور العائلة والصغار.",
    overviewEn: "The Minions return for a new family-friendly adventure.",
    runtime: 95, rating: "PG" },
  { month: 6, ar: "Moana", en: "Moana (Live Action)", aliases: ["موانا", "موانا لايف أكشن", "موانا لايف اكشن"], genre: "family", date: "2026-07-09", pick: true,
    tmdbId: 1108427, exp: ['imax'], language: 'en', mood: 'family',
    featuredRank: 6, projectedAdmissions: 600000, badge: "Family Event", badgeAr: "حدث عائلي",
    overview: "النسخة الحية من فيلم ديزني الكلاسيكي — موانا تعود إلى المحيط.",
    overviewEn: "The live-action take on Disney's classic — Moana returns to the ocean.",
    runtime: 118, rating: "PG" },
  { month: 6, ar: "The Odyssey", en: "The Odyssey", genre: "drama", date: "2026-07-16", pick: true,
    tmdbId: 1368337, exp: ['imax', 'dolby', 'screenx'], language: 'en', mood: 'deep',
    featuredRank: 2, projectedAdmissions: 1000000, badge: "Big Screen Event", badgeAr: "يستاهل الشاشة الكبيرة",
    overview: "ملحمة كريستوفر نولان — رحلة أوديسيوس من طروادة إلى الوطن.",
    overviewEn: "Christopher Nolan's epic — Odysseus's voyage from Troy to home.",
    runtime: 165, rating: "PG-13" },
  { month: 6, ar: "Spider-Man: Brand New Day", en: "Spider-Man: Brand New Day", aliases: ["سبايدر مان", "سبايدرمان", "الرجل العنكبوت", "سبايدر مان براند نيو داي"], genre: "action", date: "2026-07-30", pick: true,
    tmdbId: 969681, exp: ['imax', 'screenx', '4dx', 'dolby'], language: 'en', mood: 'thrill',
    featuredRank: 1, projectedAdmissions: 1000000, badge: "Top Pick", badgeAr: "الأكثر ترقبًا",
    overview: "الرجل العنكبوت في فصل جديد تماماً.",
    overviewEn: "Spider-Man begins a brand-new chapter.",
    runtime: 135, rating: "PG-13" },
  { month: 6, ar: "Evil Dead Burn", en: "Evil Dead Burn", genre: "horror", date: "2026-07-09", language: 'en', mood: 'thrill',
    overview: "الجزء الجديد من سلسلة Evil Dead — الشياطين تحترق.",
    overviewEn: "The new Evil Dead — the demons are on fire.",
    runtime: 100, rating: "R" },
  { month: 6, ar: "صقر وكناريا", en: "Sakr W Canaria", genre: "arabic", date: "2026-07-02", language: 'ar', mood: 'fun',
    tmdbId: 1358036, localPoster: "assets/posters/sakr-w-canaria.jpg",
    overview: "كوميديا عربية تجمع صقر وكناريا في مواقف اجتماعية ومغامرات خفيفة ضمن أفلام الصيف في السعودية.",
    overviewEn: "An Arabic comedy in the Saudi summer release slate.",
    rating: "TBC" },

  // AUGUST
  { month: 7, ar: "الجواهرجي", en: "El Gawahergy", genre: "arabic", date: "2026-08-06", language: 'ar', mood: 'fun',
    overview: "كوميديا عربية عن علاقات ومواقف اجتماعية بطابع جماهيري.",
    overviewEn: "An Arabic crowd comedy built around relationships and social situations.",
    rating: "TBC" },
  { month: 7, ar: "Super Troopers 3", en: "Super Troopers 3", genre: "comedy", date: "2026-08-06", language: 'en', mood: 'fun',
    overview: "عودة فرقة الشرطة الكوميدية في جزء ثالث.",
    overviewEn: "The comedy police crew returns for a third round.",
    rating: "TBC" },
  { month: 7, ar: "The End of Oak Street", en: "The End of Oak Street", genre: "thriller", date: "2026-08-13", language: 'en', mood: 'thrill',
    overview: "إثارة نفسية من وارنر براذرز عن أسرار شارع قديم.",
    overviewEn: "A psychological thriller about the secrets of an old street.",
    runtime: 108, rating: "R" },
  { month: 7, ar: "The Dog Stars", en: "The Dog Stars", genre: "scifi", date: "2026-08-27", language: 'en', mood: 'deep',
    overview: "ملحمة ما بعد الكارثة من المخرج ريدلي سكوت — آخر البشر يبحثون عن أمل.",
    overviewEn: "Ridley Scott's post-apocalyptic epic — the last humans look for hope.",
    runtime: 120, rating: "PG-13" },
  { month: 7, ar: "Insidious 6", en: "Insidious: 6", aliases: ["إنسيديوس", "انسيديوس", "إنسيديوس 6", "انسيديوس 6"], genre: "horror", date: "2026-08-20",
    exp: ['4dx'], language: 'en', mood: 'thrill',
    overview: "عودة عائلة Lambert إلى العالم الآخر.",
    overviewEn: "The Lambert family returns to The Further.",
    runtime: 108, rating: "PG-13" },
  { month: 7, ar: "Mutiny", en: "Mutiny", genre: "action", date: "2026-08-20", language: 'en', mood: 'thrill',
    overview: "أكشن بحري عن تمرد على سفينة قرصنة.",
    overviewEn: "A nautical action film about a pirate-ship mutiny.",
    runtime: 118, rating: "R" },
  { month: 7, ar: "Coyote vs. ACME", en: "Coyote vs. Acme", genre: "comedy", date: "2026-08-20", pick: true,
    tmdbId: 1204680, exp: ['imax'], language: 'en', mood: 'fun',
    overview: "الذئب القيوط يقاضي شركة ACME بعد سلسلة من الحوادث.",
    overviewEn: "Wile E. Coyote sues ACME after one mishap too many.",
    runtime: 98, rating: "PG" },

  // SEPTEMBER
  { month: 8, ar: "How to Rob a Bank", en: "How to Rob a Bank", genre: "comedy", date: "2026-09-03", language: 'en', mood: 'fun',
    overview: "كوميديا سطو خفيفة من Amazon MGM Studios.",
    overviewEn: "A breezy heist comedy from Amazon MGM Studios.",
    runtime: 100, rating: "PG-13" },
  { month: 8, ar: "In the Heart of the Beast", en: "In the Heart of the Beast", genre: "action", date: "2026-09-25", language: 'en', mood: 'thrill',
    overview: "براد بيت في مغامرة أكشن ضخمة من باراماونت.",
    overviewEn: "Brad Pitt headlines a Paramount action spectacle.",
    runtime: 128, rating: "R" },
  { month: 8, ar: "Forgotten Island", en: "Forgotten Island", genre: "thriller", date: "2026-09-24", language: 'en', mood: 'thrill',
    overview: "إثارة على جزيرة مهجورة تخفي أسرار كثيرة.",
    overviewEn: "A thriller on a deserted island hiding too many secrets.",
    runtime: 112, rating: "PG-13" },
  { month: 8, ar: "Resident Evil", en: "Resident Evil", aliases: ["ريزدنت إيفل", "ريزدنت ايفل", "الشر المقيم"], genre: "horror", date: "2026-09-17", pick: true,
    exp: ['screenx', '4dx'], language: 'en', mood: 'thrill',
    featuredRank: 10, projectedAdmissions: 300000, badge: "Horror Night", badgeAr: "ليلة رعب",
    overview: "إعادة تشغيل سلسلة Resident Evil — شركة أمبريلا تعود.",
    overviewEn: "Resident Evil reboots — Umbrella is back.",
    runtime: 130, rating: "R" },
  { month: 8, ar: "Practical Magic 2", en: "Practical Magic 2", genre: "comedy", date: "2026-09-17",
    tmdbId: 1302904, language: 'en', mood: 'romance',
    overview: "عودة السحر والرومانسية في الجزء الثاني من Practical Magic.",
    overviewEn: "Magic and romance return in Practical Magic 2.",
    rating: "TBC" },
  { month: 9, ar: "Clayface", en: "Clayface", genre: "horror", date: "2026-10-22",
    tmdbId: 1400940, language: 'en', mood: 'thrill',
    overview: "قصة الشرير الأيقوني Clayface من عالم DC.",
    overviewEn: "DC's iconic shape-shifting villain takes the lead.",
    runtime: 115, rating: "R" },

  // OCTOBER
  { month: 9, ar: "Other Mommy", en: "Other Mommy", genre: "horror", date: "2026-10-08", language: 'en', mood: 'thrill',
    overview: "رعب نفسي من Universal — طفل يكتشف أن أمه ليست من يدّعي.",
    overviewEn: "A psychological horror — a child realizes mom isn't who she claims.",
    runtime: 105, rating: "R" },
  { month: 9, ar: "Whalefall", en: "Whalefall", genre: "thriller", date: "2026-10-15", language: 'en', mood: 'thrill',
    overview: "إثارة من ديزني — غوّاص يُبتلع بالخطأ ويقاتل للنجاة.",
    overviewEn: "A diver gets swallowed and fights to survive.",
    runtime: 112, rating: "PG-13" },
  { month: 9, ar: "Street Fighter", en: "Street Fighter", aliases: ["ستريت فايتر", "مقاتل الشوارع"], genre: "action", date: "2026-10-15", pick: true,
    tmdbId: 1153576, exp: ['screenx', '4dx', 'imax'], language: 'en', mood: 'thrill',
    overview: "اقتباس لايف آكشن للعبة القتال الأيقونية.",
    overviewEn: "A live-action take on the legendary fighting game.",
    runtime: 120, rating: "PG-13" },
  { month: 9, ar: "Digger", en: "Digger", genre: "drama", date: "2026-10-01", language: 'en', mood: 'deep',
    overview: "دراما مؤثرة عن عمال المناجم.",
    overviewEn: "A moving drama about miners.",
    runtime: 118, rating: "PG-13" },
  { month: 9, ar: "Verity", en: "Verity", genre: "thriller", date: "2026-10-01", language: 'en', mood: 'thrill',
    overview: "إثارة نفسية مقتبسة عن رواية كولين هوفر الشهيرة.",
    overviewEn: "A psychological thriller adapted from Colleen Hoover's bestselling novel.",
    rating: "TBC" },
  { month: 9, ar: "The Social Reckoning", en: "The Social Reckoning", genre: "drama", date: "2026-10-08", language: 'en', mood: 'deep',
    overview: "فيلم عن الجانب المظلم لوسائل التواصل الاجتماعي.",
    overviewEn: "A film about the dark side of social media.",
    runtime: 125, rating: "R" },
  { month: 9, ar: "Remain", en: "Remain", genre: "thriller", date: "2026-10-22", language: 'en', mood: 'romance',
    overview: "إثارة نفسية مقتبسة عن رواية نيكولاس سباركس.",
    overviewEn: "A psychological romance adapted from Nicholas Sparks.",
    runtime: 110, rating: "PG-13" },

  // NOVEMBER
  { month: 10, ar: "Wild Horse Nine", en: "Wild Horse Nine", genre: "comedy", date: "2026-11-05", language: 'en', mood: 'fun',
    overview: "كوميديا سوداء من المخرج مارتن مكدونا — عملاء CIA في مغامرة فوضوية.",
    overviewEn: "Martin McDonagh's black comedy — CIA operatives spiral into chaos.",
    runtime: 110, rating: "R" },
  { month: 10, ar: "I Play Rocky", en: "I Play Rocky", genre: "drama", date: "2026-11-12", language: 'en', mood: 'deep',
    overview: "حكاية الروكي الحقيقي — درامية عن سيلفستر ستالون ونجاح صنعه بإرادته.",
    overviewEn: "The true Rocky — a drama about how Stallone willed his success into being.",
    runtime: 118, rating: "PG-13" },
  { month: 10, ar: "Ebenezer: A Christmas Carol", en: "Ebenezer: A Christmas Carol", genre: "drama", date: "2026-11-12", language: 'en', mood: 'deep',
    overview: "جوني ديب في دور سكروج — تحويل أدبي حديث لقصة ديكنز الكلاسيكية.",
    overviewEn: "Johnny Depp plays Scrooge — a modern adaptation of Dickens.",
    runtime: 120, rating: "PG-13" },
  { month: 10, ar: "Focker-In-Law", en: "Focker-In-Law", genre: "comedy", date: "2026-11-26",
    language: 'en', mood: 'fun', director: "John Hamburg",
    cast: ["Ben Stiller", "Robert De Niro", "Ariana Grande", "Owen Wilson", "Blythe Danner", "Teri Polo", "Skyler Gisondo", "Beanie Feldstein"],
    overview: "عودة عائلة فوكر في جزء جديد من سلسلة Meet the Parents — ابن غريغ وبام يدخل العائلة في اختبار خطوبة جديد.",
    overviewEn: "The Focker family returns in a new Meet the Parents sequel, as Greg and Pam's son brings a new engagement into the circle of trust.",
    rating: "TBA" },
  { month: 10, ar: "Hexed", en: "Hexed", genre: "horror", date: "2026-11-13", language: 'en', mood: 'thrill',
    overview: "رعب عن لعنة قديمة تطارد عائلة.",
    overviewEn: "An old curse haunts a family.",
    runtime: 102, rating: "R" },
  { month: 10, ar: "The Cat in the Hat", en: "The Cat in the Hat", aliases: ["The Cat in the Hat (2026)"], genre: "family", date: "2026-11-05", pick: true,
    tmdbId: 1117898, language: 'en', mood: 'family',
    overview: "قطة الدكتور سوس الشهيرة في نسخة أنيميشن جديدة.",
    overviewEn: "Dr. Seuss's iconic cat in a fresh animated take.",
    runtime: 92, rating: "G" },
  { month: 10, ar: "The Hunger Games", en: "The Hunger Games: Sunrise on the Reaping", aliases: ["هانغر قيمز", "هانقر قيمز", "ألعاب الجوع", "العاب الجوع"], genre: "action", date: "2026-11-20",
    tmdbId: 1300968, exp: ['imax', 'dolby'], language: 'en', mood: 'thrill',
    overview: "ألعاب الجوع — قصة هايمتش أبرناثي قبل كاتنيس بعقود.",
    overviewEn: "The Hunger Games — Haymitch's story, decades before Katniss.",
    runtime: 140, rating: "PG-13" },

  // DECEMBER
  { month: 11, ar: "Violent Night 2", en: "Violent Night 2", genre: "action", date: "2026-12-03",
    exp: ['4dx'], language: 'en', mood: 'fun',
    overview: "بابا نويل العنيف يعود — أكشن كوميدي ملحمي لعيد الميلاد.",
    overviewEn: "Violent Santa is back — an action-comedy holiday romp.",
    runtime: 105, rating: "R" },
  { month: 11, ar: "Dune 3", en: "Dune 3", aliases: ["دون", "ديون", "دون 3", "ديون 3"], genre: "scifi", date: "2026-12-17", pick: true,
    tmdbId: 1170608, exp: ['imax', 'dolby', 'screenx'], language: 'en', mood: 'deep',
    featuredRank: 8, projectedAdmissions: 350000, badge: "Premium Format Pick", badgeAr: "اختيار للشاشات المميزة",
    overview: "الجزء الثالث من ملحمة ديون — بول أتريديس إمبراطور الكون.",
    overviewEn: "The third chapter of Dune — Paul Atreides, emperor of the universe.",
    runtime: 170, rating: "PG-13" },
  { month: 11, ar: "Jumanji: Open World", en: "Jumanji: Open World", aliases: ["جومانجي", "جومانجي أوبن وورلد", "جومانجي اوبن وورلد"], genre: "comedy", date: "2026-12-24", pick: true, language: 'en', mood: 'fun',
    featuredRank: 3, projectedAdmissions: 750000, badge: "Group Night", badgeAr: "اختيار للجماعة",
    overview: "عودة الأبطال إلى العالم الأكثر خطورة في ألعاب الفيديو.",
    overviewEn: "The crew returns to gaming's most dangerous world.",
    runtime: 118, rating: "PG-13" },
  { month: 11, ar: "Avengers: Doomsday", en: "Avengers: Doomsday", aliases: ["أفنجرز", "افنجرز", "المنتقمون", "أفنجرز دومزداي", "افنجرز دومزداي"], genre: "action", date: "2026-12-17", pick: true,
    tmdbId: 1003596, exp: ['imax', 'screenx', '4dx', 'dolby'], language: 'en', mood: 'thrill',
    featuredRank: 5, projectedAdmissions: 700000, badge: "Marvel Event", badgeAr: "حدث مارفل",
    overview: "المنتقمون يواجهون أخطر تهديد في تاريخ MCU — دكتور دووم.",
    overviewEn: "The Avengers face the MCU's biggest threat yet — Doctor Doom.",
    runtime: 160, rating: "PG-13" },
  { month: 11, ar: "The Angry Birds Movie 3", en: "The Angry Birds Movie 3", aliases: ["أنغري بيردز", "انجري بيردز", "الطيور الغاضبة", "الطيور الغاضبة 3"], genre: "family", date: "2026-12-24", language: 'en', mood: 'family',
    overview: "الطيور الغاضبة تعود في مغامرة أنيميشن جديدة.",
    overviewEn: "The Angry Birds return for a new animated adventure.",
    rating: "TBC" },
  { month: 11, ar: "Werwulf", en: "Werwulf", genre: "horror", date: "2026-12-31", language: 'en', mood: 'thrill',
    overview: "رعب تاريخي جديد من روبرت إيغرغز.",
    overviewEn: "A new historical horror film from Robert Eggers.",
    rating: "TBC" },
];

// Saudi box office layer — Phase 1 import from "Market Share By Film.xls"
// Data range: Saudi Arabia, 01 Jan 2026 to 02 May 2026.
// Release dates are aligned with the Muvi 2026 release schedule where matched.
const KSA_BOX_OFFICE_SOURCE = "Saudi box office Jan-May 2026";
const KSA_BOX_OFFICE_PHASE1 = [
  { rank: 1, en: "Shabab El Bomb 3", admissions: 731750, grossSar: 32520003.39, weeks: 7, distributor: "MAF IND" },
  { rank: 2, en: "Bershama", admissions: 589456, grossSar: 32415810.23, weeks: 5, distributor: "ORIENT" },
  { rank: 3, en: "Project Hail Mary", admissions: 240632, grossSar: 14602011.07, weeks: 7, distributor: "EMP SNY" },
  { rank: 4, en: "The Super Mario Galaxy Movie", aliases: ["Super Mario Galaxy Movie, The", "Super Mario Galaxy"], admissions: 246882, grossSar: 12203526.23, weeks: 5, distributor: "MAF UNI" },
  { rank: 5, en: "Michael", admissions: 180400, grossSar: 11669129.76, weeks: 2, distributor: "MAF UNI" },
  { rank: 6, en: "Shelter", admissions: 253408, grossSar: 9880388.63, weeks: 14, distributor: "FRTR" },
  { rank: 7, en: "Family Business", admissions: 165057, grossSar: 8987356.77, weeks: 7, distributor: "EMP INDP" },
  { rank: 8, en: "Scream 7", admissions: 163042, grossSar: 8183002.3, weeks: 7, distributor: "FSF PAR" },
  { rank: 10, en: "En Ghab El Kot", admissions: 136694, grossSar: 6829361.05, weeks: 11, distributor: "ORIENT" },
  { rank: 11, en: "Housemaid, The", aliases: ["The Housemaid"], admissions: 131506, grossSar: 5622161.12, weeks: 8, distributor: "ITINDP" },
  { rank: 12, en: "Hoppers", admissions: 128649, grossSar: 5600935.22, weeks: 7, distributor: "ITDIS" },
  { rank: 13, en: "Greenland 2: Migration", admissions: 99289, grossSar: 5400711.58, weeks: 7, distributor: "PHF." },
  { rank: 14, en: "The Devil Wears Prada 2", aliases: ["Devil Wears Prada 2, The"], admissions: 77154, grossSar: 5008574.2, weeks: 1, distributor: "ITDIS" },
  { rank: 15, en: "Lee Cronin's The Mummy", admissions: 80755, grossSar: 4233398.67, weeks: 3, distributor: "MAF WB" },
  { rank: 17, en: "Hamnet", admissions: 94801, grossSar: 4136130.51, weeks: 12, distributor: "MAF UNI" },
  { rank: 18, en: "Send Help", admissions: 108381, grossSar: 4021835, weeks: 8 },
  { rank: 20, en: "Crime 101", admissions: 76054, grossSar: 3968849.89, weeks: 7 },
  { rank: 23, en: "Return To Silent Hill", aliases: ["Return to Silent Hill"], admissions: 56744, grossSar: 2511240.64, weeks: 8 },
  { rank: 26, en: "Ready Or Not 2: Here I Come", admissions: 37395, grossSar: 2059677.48, weeks: 5 },
  { rank: 27, en: "28 Years Later: The Bone Temple", admissions: 37154, grossSar: 1942492.06, weeks: 4 },
  { rank: 29, en: "EgyBest", admissions: 32057, grossSar: 1766217.63, weeks: 3 },
  { rank: 30, en: "Marty Supreme", admissions: 25029, grossSar: 1450110.83, weeks: 5 },
  { rank: 31, en: "Gawaza Wala Ganaza", admissions: 30191, grossSar: 1425499.99, weeks: 7 },
  { rank: 32, en: "Mercy", admissions: 24331, grossSar: 1423242.98, weeks: 11 },
  { rank: 34, en: "Protector", admissions: 25911, grossSar: 1349344.91, weeks: 5 },
  { rank: 35, en: "Primate", admissions: 30571, grossSar: 1250613.6, weeks: 8 },
  { rank: 37, en: "Deep Water", admissions: 21213, grossSar: 1041742.82, weeks: 1 },
  { rank: 38, en: "They Will Kill You", admissions: 17076, grossSar: 915878.55, weeks: 2 },
  { rank: 39, en: "Goat", aliases: ["GOAT"], admissions: 19586, grossSar: 885717.93, weeks: 2 },
  { rank: 40, en: "Dolphin Boy 2", admissions: 19950, grossSar: 797737.54, weeks: 12 },
  { rank: 41, en: "Saffah El Tagammou", admissions: 13669, grossSar: 674889.86, weeks: 2 },
  { rank: 42, en: "Nuremberg", admissions: 11235, grossSar: 656689.66, weeks: 8, distributor: "FSF IND" },
  { rank: 46, en: "Shark Terror", admissions: 10853, grossSar: 486006, weeks: 3 },
  { rank: 48, en: "Desert Warrior", aliases: ["The Desert Warrior", "Desert Warrior, The"], admissions: 8538, grossSar: 436119.49, weeks: 2 },
  { rank: 49, en: "Reminders Of Him", admissions: 6815, grossSar: 424743.55, weeks: 3 },
  { rank: 50, en: "Al Majhola", admissions: 8652, grossSar: 421497.42, weeks: 5 },
  { rank: 80, en: "Rabsha", admissions: 2967, grossSar: 148152.49, weeks: 4 },
  { rank: 97, en: "Hajeer", admissions: 1951, grossSar: 94948.31, weeks: 2 },
  { rank: 118, en: "My Driver & I", admissions: 965, grossSar: 46275.71, weeks: 1 },
];

const KSA_BOX_OFFICE_IMPORTS = [
  { ar: "برشامة", en: "Bershama", aliases: ["Barshama", "برشامه"], genre: "arabic", date: "2026-04-02", language: "ar", mood: "fun", rating: "R15",
    overview: "كوميديا عربية حققت حضورًا كبيرًا في شباك التذاكر السعودي.",
    overviewEn: "An Arabic comedy that broke out at the Saudi box office." },
  { ar: "Shelter", en: "Shelter", genre: "action", date: "2026-01-29", language: "en", mood: "thrill", rating: "R15",
    overview: "أكشن وتشويق من أوائل أفلام 2026 التي استمرت طويلًا في صالات السعودية.",
    overviewEn: "An action thriller that held strongly in Saudi cinemas early in 2026." },
  { ar: "فاميلي بيزنس", en: "Family Business", aliases: ["Family Business (Arabic)"], genre: "arabic", date: "2026-03-19", language: "ar", mood: "fun", rating: "R15",
    overview: "كوميديا عربية عن عائلة، أسرار، وفوضى لطيفة.",
    overviewEn: "An Arabic comedy built around family chaos and secrets." },
  { ar: "إن غاب القط", en: "En Ghab El Kot", aliases: ["En Ghab El Qot", "ان غاب القط"], genre: "arabic", date: "2026-01-08", language: "ar", mood: "fun", rating: "R18",
    overview: "كوميديا عربية تصدرت اهتمام الجمهور في بداية السنة.",
    overviewEn: "An Arabic comedy that found a strong audience early in the year." },
  { ar: "The Housemaid", en: "The Housemaid", aliases: ["Housemaid, The"], genre: "thriller", date: "2026-02-05", language: "en", mood: "thrill", rating: "R18",
    overview: "تشويق نفسي حقق حضورًا قويًا في صالات السعودية.",
    overviewEn: "A psychological thriller with strong Saudi cinema attendance." },
  { ar: "Greenland 2: Migration", en: "Greenland 2: Migration", genre: "action", date: "2026-01-08", language: "en", mood: "thrill", rating: "R15",
    overview: "عودة عالم Greenland في مغامرة نجاة جديدة.",
    overviewEn: "The Greenland survival story returns for a new migration." },
  { ar: "Lee Cronin's The Mummy", en: "Lee Cronin's The Mummy", genre: "horror", date: "2026-04-16", language: "en", mood: "thrill", rating: "R18",
    overview: "رعب جديد يعيد المومياء بنبرة أكثر ظلامًا.",
    overviewEn: "A darker new take on The Mummy." },
  { ar: "Hamnet", en: "Hamnet", genre: "drama", date: "2026-01-22", language: "en", mood: "deep", rating: "R15",
    overview: "دراما رومانسية أدبية حققت حضورًا ثابتًا.",
    overviewEn: "A literary romantic drama with steady Saudi attendance." },
  { ar: "Ready Or Not 2", en: "Ready Or Not 2: Here I Come", genre: "horror", date: "2026-04-02", language: "en", mood: "thrill",
    overview: "تكملة رعب وتشويق بروح سوداء.",
    overviewEn: "A horror-thriller sequel with a dark comic edge." },
  { ar: "إيجي بست", en: "EgyBest", aliases: ["EGYBEST", "Egy Best"], genre: "arabic", date: "2026-04-16", language: "ar", mood: "fun",
    overview: "كوميديا عربية من عناوين الربيع في السعودية.",
    overviewEn: "An Arabic comedy that landed in Saudi cinemas in spring." },
  { ar: "Marty Supreme", en: "Marty Supreme", genre: "drama", date: "2026-03-19", language: "en", mood: "deep",
    overview: "دراما مغامرة جذبت جمهورًا محدودًا لكن واضحًا.",
    overviewEn: "A drama-adventure with a clear niche audience." },
  { ar: "جوازة ولا جنازة", en: "Gawaza Wala Ganaza", aliases: ["Gawaza Wala Genaza"], genre: "arabic", date: "2026-01-08", language: "ar", mood: "fun",
    overview: "كوميديا عربية عن زواج، عزاء، ومفارقات اجتماعية.",
    overviewEn: "An Arabic social comedy around weddings, funerals, and family chaos." },
  { ar: "Protector", en: "Protector", genre: "action", date: "2026-03-26", language: "en", mood: "thrill",
    overview: "أكشن مباشر لجمهور أفلام الحماية والمطاردة.",
    overviewEn: "A direct action title for chase-and-protection fans." },
  { ar: "Deep Water", en: "Deep Water", genre: "thriller", date: "2026-04-30", language: "en", mood: "thrill",
    overview: "تشويق في المياه المفتوحة لجمهور النجاة.",
    overviewEn: "Open-water suspense for survival-thriller fans." },
  { ar: "They Will Kill You", en: "They Will Kill You", genre: "horror", date: "2026-04-09", language: "en", mood: "thrill",
    overview: "رعب وتشويق عن تهديد لا يمكن الهروب منه.",
    overviewEn: "A horror-thriller about an inescapable threat." },
  { ar: "Dolphin Boy 2", en: "Dolphin Boy 2", genre: "family", date: "2026-01-08", language: "ru", mood: "family",
    overview: "أنيميشن عائلي روسي للأطفال.",
    overviewEn: "A Russian animated family film for younger audiences." },
  { ar: "هجرة", en: "Hijra", tmdbId: 1466927, aliases: ["هجرة", "هجرا"], genre: "arabic", date: "2026-01-08", language: "ar", mood: "deep", rating: "R15",
    overview: "رحلة سعودية شاقة تبحث فيها فتاة وجدتها عن أخت اختفت في طريق الحج، وتنكشف معها أسرار العائلة.",
    overviewEn: "A Saudi drama about a girl and her grandmother searching for a missing sister along old pilgrimage routes." },
  { ar: "فلسطين 36", en: "Palestine 36", aliases: ["فلسطين 36", "فلسطين٣٦", "فلسطين ٣٦"], genre: "arabic", date: "2026-01-08", language: "ar", mood: "deep", rating: "R15",
    overview: "دراما تاريخية تدور في فلسطين عام 1936، وسط الثورة ضد الاستعمار البريطاني وتحولات المنطقة.",
    overviewEn: "A historical drama set in Palestine in 1936, as anti-colonial revolt reshapes the region." },
  { ar: "Silent Night, Deadly Night", en: "Silent Night, Deadly Night", aliases: ["سايلنت نايت", "ليلة صامتة", "ليلة قاتلة"], genre: "horror", date: "2026-01-01", language: "en", mood: "thrill", rating: "R18",
    overview: "رعب انتقامي عن رجل يحمل صدمة طفولته ويرتدي زي سانتا ليواجه ماضيه بعنف.",
    overviewEn: "A revenge horror film about a traumatized man who returns in a Santa suit to confront his past." },
  { ar: "Beneath The Light", en: "Beneath The Light", aliases: ["بينيث ذا لايت", "تحت الضوء"], genre: "thriller", date: "2026-01-01", language: "en", mood: "thrill", rating: "R18",
    overview: "تشويق نفسي في منارة معزولة، حيث تختلط الذكريات والقلق والواقع مع أحداث غريبة.",
    overviewEn: "A psychological thriller set around an isolated lighthouse, fractured memories, and strange events." },
  { ar: "No Other Choice", en: "No Other Choice", aliases: ["نو أذر تشويس", "لا خيار آخر"], genre: "thriller", date: "2026-01-08", language: "en", mood: "thrill", rating: "R18",
    overview: "كوميديا سوداء كورية عن مدير مصنع يفقد عمله وكرامته، ثم ينزلق إلى قرارات عنيفة ليستعيد مكانته.",
    overviewEn: "A Korean dark comedy-thriller about a laid-off manager pushed into violent desperation." },
  { ar: "Noise", en: "Noise", aliases: ["نويز", "ضجيج"], genre: "horror", date: "2026-01-08", language: "en", mood: "thrill", rating: "R18",
    overview: "رعب كوري عن أصوات غامضة داخل شقة ترتبط باختفاء أخت البطلة وبداية أحداث مرعبة.",
    overviewEn: "A Korean horror-thriller about mysterious apartment noises tied to a sister's disappearance." },
  { ar: "Charlie The Wonderdog", en: "Charlie The Wonderdog", aliases: ["تشارلي", "تشارلي الكلب", "الكلب العجيب"], genre: "family", date: "2026-01-15", language: "en", mood: "family", rating: "PG",
    overview: "كلب يكتسب قوى خارقة بعد اختطافه من كائنات فضائية، ثم يواجه قطًا شريرًا يهدد البشرية.",
    overviewEn: "A dog gains superpowers after an alien abduction and battles an evil cat threatening humanity." },
  { ar: "The Royal Cat", en: "The Royal Cat", aliases: ["القط الملكي", "رويال كات"], genre: "family", date: "2026-02-05", language: "en", mood: "family", rating: "PG12",
    overview: "مغامرة عائلية عن قط ناطق وفتى صغير يحاولان حل لغز تحوّل سكان مدينة قديمة إلى حيوانات.",
    overviewEn: "A family adventure about a talking cat and a boy solving why townspeople are turning into animals." },
  { ar: "Killer Whale", en: "Killer Whale", aliases: ["كيلر ويل", "الحوت القاتل"], genre: "horror", date: "2026-02-05", language: "en", mood: "thrill", rating: "R18",
    overview: "أكشن ورعب عن صديقتين عالقتين في بحيرة نائية مع حوت قاتل خطير.",
    overviewEn: "An action-horror film about two friends trapped in a remote lagoon with a dangerous killer whale." },
  { ar: "The Bride!", en: "The Bride!", aliases: ["العروس", "ذا برايد"], genre: "horror", date: "2026-03-19", language: "en", mood: "thrill", rating: "R18",
    overview: "رعب ودراما عن فرانكشتاين يطلب خلق رفيقة له في شيكاغو الثلاثينيات، فتولد العروس وتبدأ الفوضى.",
    overviewEn: "A horror drama where Frankenstein asks for a companion in 1930s Chicago, unleashing The Bride." },
  { ar: "Good Boy", en: "Good Boy", aliases: ["قود بوي", "غود بوي"], genre: "drama", date: "2026-03-26", language: "en", mood: "deep", rating: "R18",
    overview: "جريمة ودراما عن شاب مختطف يخضع لبرنامج تأهيل منحرف يجبره على القتال للنجاة.",
    overviewEn: "A crime drama about a kidnapped young man forced through a disturbing rehabilitation program." },
  { ar: "The Strangers: Chapter 3", en: "The Strangers: Chapter 3", aliases: ["ذا سترينجرز", "الغرباء", "الغرباء 3"], genre: "horror", date: "2026-04-02", language: "en", mood: "thrill", rating: "R15",
    overview: "الفصل الثالث من سلسلة الغرباء، حيث يواجه الناجون تهديدات جديدة من قتلة مقنعين.",
    overviewEn: "The third chapter of The Strangers, with survivors facing new masked threats." },
  { ar: "The Raiders", en: "The Raiders", aliases: ["ذا ريدرز", "ريدرز"], genre: "action", date: "2026-04-09", language: "en", mood: "thrill", rating: "R15",
    overview: "جاكي شان يقود فريق آثار في رحلة أكشن للعثور على حجر غامض يأخذهم عبر الزمن.",
    overviewEn: "Jackie Chan leads archaeologists on an action adventure around a mysterious jade that bends time." },
  { ar: "Kill Code", en: "Kill Code", aliases: ["كيل كود", "كود القتل"], genre: "action", date: "2026-04-16", language: "en", mood: "thrill", rating: "R18",
    overview: "أكشن في مستقبل مظلم، حيث تجبر شركة المجرمين على تصفية بعضهم عبر نظام قاتل.",
    overviewEn: "A future-set action thriller where criminals are forced into a deadly corporate kill system." },
  { ar: "This Is Not A Test", en: "This Is Not A Test", aliases: ["ذيس إز نوت أ تست", "هذا ليس اختبار"], genre: "thriller", date: "2026-04-23", language: "en", mood: "thrill", rating: "TBC",
    overview: "تشويق بقاء عن طلاب يختبئون داخل مدرسة بعد انتشار وباء، وتتصاعد قرارات النجاة القاسية.",
    overviewEn: "A survival thriller about students hiding in a school during an outbreak and making brutal choices." },
  { ar: "سفاح التجمع", en: "Saffah El Tagammou", aliases: ["Saffah El Tagamoa"], genre: "arabic", date: "2026-04-23", language: "ar", mood: "thrill",
    overview: "رعب عربي مستوحى من قضية أثارت اهتمام الجمهور.",
    overviewEn: "An Arabic horror title inspired by a case that drew audience attention." },
  { ar: "Nuremberg", en: "Nuremberg", genre: "drama", date: "2026-03-12", language: "en", mood: "deep",
    overview: "دراما تاريخية عن المحاكمات التي أعقبت الحرب العالمية الثانية.",
    overviewEn: "A historical drama around the post-war trials." },
  { ar: "Shark Terror", en: "Shark Terror", genre: "comedy", date: "2026-04-09", language: "en", mood: "fun",
    overview: "مغامرة قرش خفيفة للجمهور الباحث عن المتعة السريعة.",
    overviewEn: "A light shark adventure for quick fun." },
  { ar: "محاربة الصحراء", en: "The Desert Warrior", aliases: ["محاربة الصحراء", "محارب الصحراء", "ديزرت ووريور", "Desert Warrior", "Desert Warrior, The"], tmdbId: 898704, genre: "action", date: "2026-04-23", language: "en", mood: "thrill",
    overview: "ملحمة تاريخية في الجزيرة العربية، حيث تقود الأميرة هند القبائل العربية ضد الغزو الساساني في معركة ذي قار.",
    overviewEn: "A historical action epic set in Arabia around Princess Hind and the Battle of Ze Qar." },
  { ar: "Reminders Of Him", en: "Reminders Of Him", genre: "drama", date: "2026-03-19", language: "en", mood: "romance",
    overview: "دراما رومانسية لجمهور القصص العاطفية.",
    overviewEn: "A romantic drama for fans of emotional stories." },
  { ar: "المجهولة", en: "Al Majhola", aliases: ["المجهولة", "المجهوله", "Al Majhola", "Majhola", "Al-Majhoola", "AL-MAJHOOLA", "Al Majhoola"], genre: "arabic", date: "2026-01-01", language: "ar", mood: "deep",
    overview: "دراما سعودية من عناوين 2026 المحلية.",
    overviewEn: "A Saudi drama from the 2026 local slate." },
  { ar: "ربشة", en: "Rabsha", aliases: ["ربشة", "ربشه", "RABSHA"], genre: "arabic", date: "2026-04-09", language: "ar", mood: "fun",
    overview: "فيلم سعودي بتصنيف تشويق في بيانات شباك التذاكر.",
    overviewEn: "A Saudi suspense title in the box office data." },
  { ar: "هجير", en: "Hajeer", aliases: ["هجير", "هاجير", "HAJEER"], genre: "arabic", date: "2026-04-02", language: "ar", mood: "deep",
    overview: "دراما سعودية وصلت لصالات 2026.",
    overviewEn: "A Saudi drama that reached 2026 cinema screens." },
  { ar: "سلمى وقمر", en: "My Driver & I", aliases: ["سلمى وقمر", "سلمى و قمر", "أنا وسائقي", "انا وسائقي", "سائقي", "My Driver and I", "Ana Wa Saeqi", "Ana Wa Saiki"], genre: "arabic", date: "2026-01-22", language: "ar", mood: "deep",
    overview: "دراما سعودية لجمهور القصص المحلية.",
    overviewEn: "A Saudi drama for local-story audiences." },
];

function _normTitle(s) {
  return (s || '')
    .toString()
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/,\s*the$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const KSA_BOX_OFFICE_BY_TITLE = new Map();
KSA_BOX_OFFICE_PHASE1.forEach(row => {
  [row.en, ...(row.aliases || [])].forEach(name => {
    KSA_BOX_OFFICE_BY_TITLE.set(_normTitle(name), row);
  });
});

function _ksaBoxOfficeFor(movie) {
  const candidates = [movie.en, movie.ar, ...(movie.aliases || [])];
  for (const name of candidates) {
    const hit = KSA_BOX_OFFICE_BY_TITLE.get(_normTitle(name));
    if (hit) return hit;
  }
  return null;
}

// Status helper — coming-soon vs now-showing vs released
function _statusFor(iso) {
  const days = Math.ceil((new Date(iso) - new Date()) / 86400000);
  if (days > 14) return 'soon';
  if (days >= -30) return 'now';
  return 'released';
}

const ALL_MOVIES = [...RAW_MOVIES, ...KSA_BOX_OFFICE_IMPORTS];

window.CINEMAP_MOVIES = ALL_MOVIES.map(m => {
  const ksa = _ksaBoxOfficeFor(m);
  return {
    ...m,
    month: Number.isInteger(m.month) ? m.month : new Date(m.date).getMonth(),
    ...(ksa ? {
      ksaReleased: true,
      ksaRank: ksa.rank,
      ksaAdmissions: ksa.admissions,
      ksaGrossSar: ksa.grossSar,
      ksaBoxOfficeWeeks: ksa.weeks,
      distributor: ksa.distributor || m.distributor,
      boxOfficeSource: KSA_BOX_OFFICE_SOURCE,
    } : {}),
    status: _statusFor(m.date)
  };
});

// Backward-compat alias for any leftover code
window.MUVI_MOVIES_2026 = window.CINEMAP_MOVIES;

// ============================================================
// 2) TAXONOMIES — genres, moods, languages, statuses, experiences
// ============================================================

window.CINEMAP_GENRES = {
  action:    { ar: "أكشن",        en: "Action",    color: "#FF8A00" },
  horror:    { ar: "رعب",         en: "Horror",    color: "#FF4D4D" },
  comedy:    { ar: "كوميدي",      en: "Comedy",    color: "#FFC857" },
  drama:     { ar: "دراما",       en: "Drama",     color: "#22C1A6" },
  scifi:     { ar: "خيال علمي",   en: "Sci-Fi",    color: "#A78BFA" },
  thriller:  { ar: "إثارة",       en: "Thriller",  color: "#F59E0B" },
  family:    { ar: "عائلي",       en: "Family",    color: "#22C1A6" },
  arabic:    { ar: "عربي",        en: "Arabic",    color: "#FFC857" },
  anime:     { ar: "أنمي",        en: "Anime",     color: "#FF4D4D" },
};

window.CINEMAP_MOODS = {
  thrill:  { ar: "حماس",  en: "Thrill" },
  fun:     { ar: "ضحك",   en: "Fun" },
  deep:    { ar: "عميق",  en: "Deep" },
  family:  { ar: "عائلي", en: "Family" },
  romance: { ar: "حب",    en: "Romance" },
};

window.CINEMAP_LANGUAGES = {
  en: { ar: "إنجليزي", en: "English" },
  ar: { ar: "عربي",   en: "Arabic" },
  jp: { ar: "ياباني", en: "Japanese" },
};

window.CINEMAP_STATUSES = {
  soon:     { ar: "قريبًا",   en: "Coming Soon" },
  now:      { ar: "يعرض الآن", en: "Now Showing" },
  released: { ar: "تم عرضه", en: "Released" },
};

window.CINEMAP_EXPERIENCES = {
  imax:    { en: "IMAX",    color: "#FF8A00" },
  screenx: { en: "ScreenX", color: "#22C1A6" },
  '4dx':   { en: "4DX",     color: "#FF4D4D" },
  dolby:   { en: "Dolby",   color: "#A78BFA" },
  suites:  { en: "Suites",  color: "#FFC857" },
};

// Compatibility shims for tmdb-client.js (still uses MUVI_*)
window.MUVI_GENRES = window.CINEMAP_GENRES;
window.MUVI_EXPERIENCES = window.CINEMAP_EXPERIENCES;

window.CINEMAP_MONTHS_AR = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"
];
window.CINEMAP_MONTHS_EN = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];
window.CINEMAP_MONTHS_EN_FULL = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
window.MUVI_MONTHS_AR = window.CINEMAP_MONTHS_AR;
window.MUVI_MONTHS_EN = window.CINEMAP_MONTHS_EN;
window.MUVI_MONTHS_EN_FULL = window.CINEMAP_MONTHS_EN_FULL;

// ============================================================
// 3) i18n
// ============================================================

window.CINEMAP_I18N = {
  ar: {
    // nav
    nav_movies:       "الأفلام",
    nav_watchlist:    "قائمتي",
    nav_my2026:       "ملخصي",
    nav_how:          "كيف يعمل",
    nav_vision:       "الرؤية",
    nav_cta:          "قائمتي",

    // hero
    hero_eyebrow:     "سينماب · 2026",
    hero_title:       "أفلام عليها كلام",
    hero_sub:         "احفظ الأفلام الجاية، قيّم اللي شفته، واكتشف وش يستاهل السينما فعلاً.",
    hero_support:     "وش شفت في 2026؟ ووش باقي متحمس له؟",
    hero_cta:         "شوف الأفلام",
    hero_cta_2:       "قائمتي",
    hero_cta_3:       "ملخصي",
    hero_chip:        "بنذكّرك أول ما تفتح التذاكر",
    hero_guide_label: "شرح أزرار سينماب",
    hero_guide_save:  "احفظ",
    hero_guide_rate:  "قيّم",
    hero_guide_notify:"نبّهني",
    hero_guide_calendar:"للتقويم",

    // journey 0
    j0_eyebrow:       "المرحلة 0 · الاكتشاف",
    j0_title:         "كل اللي يهمك قبل لا تحجز.",
    j0_sub:           "سينماب يبدأ من الاكتشاف — نحفظ اهتمام الجمهور قبل ما تفتح التذاكر بأسابيع.",
    j0_card1_title:   "اكتشف",
    j0_card1_body:    "تقويم كامل لأفلام 2026 — تصفّح حسب الشهر، المزاج، أو اللغة.",
    j0_card2_title:   "احفظ",
    j0_card2_body:    "قائمة شخصية تحفظها تلقائيًا — رجّع لها متى ما حبّيت.",
    j0_card3_title:   "تذكّر أول بأول",
    j0_card3_body:    "نخبرك أول ما تفتح التذاكر — بدون ما تفوتك أي أمسية.",

    // featured carousel
    feat_eyebrow:     "أفلام عليها كلام · 2026",
    feat_title:       "الأفلام اللي عليها العين",
    feat_sub:         "الأفلام المنتظرة في السوق السعودي — احفظ اللي يحمسك وخلك أول من يعرف متى تفتح التذاكر.",
    feat_projected:   "متوقع له",
    feat_admissions:  "حضور",
    feat_rank:        "الترتيب",
    feat_swipe:       "اسحب لاكتشاف الأفلام",

    // calendar
    cal_eyebrow:      "تقويم 2026 · شهر بشهر",
    cal_title:        "وش بتشوف؟",
    cal_sub:          "تصفح الجاي، افتح التفاصيل، واحفظ الأفلام اللي ناوي عليها.",
    filter_all:       "الكل",
    filter_genre:     "التصنيف",
    filter_lang:      "اللغة",
    filter_mood:      "المزاج",
    filter_status:    "الحالة",
    filter_month:     "الشهر",
    filter_picks:     "مختار",
    filter_btn:       "فلترة",
    filter_apply:     "تطبيق",
    filter_reset:     "إعادة ضبط",
    filter_close:     "إغلاق",
    filter_active:    "فلتر نشط",
    filter_active_pl: "فلاتر نشطة",
    filter_title:     "فلترة الأفلام",
    reset:            "مسح الفلاتر",
    no_results:       "ما لقينا أفلام بهذه الفلاتر.",
    movies_count:     "فيلم",

    // movie card actions
    save:             "احفظ",
    save_primary:     "احفظه",
    saved:            "محفوظ",
    notify:           "ذكّرني",
    notified:         "مفعّل",
    watched:          "شفته",
    watched_question: "شفته؟",
    watched_done:     "شفته",
    rate_it:          "قيّمه",
    status_upcoming:  "قريبًا",
    status_now:       "يعرض الآن",
    status_released:  "تم عرضه",
    toast_watched:    "حفظنا إنك شفته. كيف كان؟",
    toast_unwatched:  "ألغينا التعليم",
    cal_quick:        "تقويم",
    cal_pick_title:   "أضف للتقويم",
    cal_pick_sub:     "اختر تقويمك المفضّل",
    cal_cancel:       "إلغاء",
    toast_cal_added:  "تمام — أضفناه لتقويمك.",

    // rating sheet (Ticket 2)
    rate_title:       "كيف كان؟",
    rate_sub:         "قيّمه ولو بسطر — يساعد سينماب يعرف وش يستاهل عند الجمهور.",
    rate_stars_lbl:   "تقييمك",
    rate_vibes_lbl:   "الجو",
    rate_reaction_ph: "قول رأيك بسطر واحد (اختياري)",
    rate_submit:      "احفظ التقييم",
    rate_sending:     "جاري الإرسال...",
    rate_skip:        "تخطّي",
    rate_close:       "إغلاق",
    rate_need_star:   "اختر عدد النجوم أولًا أو اضغط تخطّي.",
    rate_need_consent:"علّم على مربع الموافقة عشان نحفظ تقييمك.",
    rate_thanks:      "شكرًا لتقييمك — عدّ في 2026 معنا 🎬",
    rate_consent:     "أوافق على حفظ تقييمي محليًا وإرسال نسخة مجهولة إلى سينماب لتحسين تقييمات الجمهور. أقدر أطلب حذفه لاحقًا إذا أمكن تحديده.",
    rate_v_bigscreen: "يستاهل الشاشة الكبيرة",
    rate_v_stream:    "شوفه على نتفلكس",
    rate_v_friends:   "مع الأصحاب",
    rate_v_skip:      "ما يستاهل",
    rate_v_date:      "موعد رومانسي",
    rate_v_alone:     "أمسية لحالك",

    // cinemap score (Ticket 3)
    score_your:       "تقييمك",
    score_avg:        "تقييم سينماب",
    score_be_first:   "كن أول من يقيّم",
    score_viewer:     "مشاهد",
    score_viewers_pl: "مشاهدين",
    score_of:         "من",
    score_modal_lbl:  "تقييمك للفيلم",
    trailer:          "شاهد الإعلان",
    share:            "شارك",
    days:             "يوم",

    // watchlist
    wl_eyebrow:       "قائمتك",
    wl_title:         "قائمتك لأفلام 2026.",
    wl_sub:           "كل فيلم تحفظه يبقى معك — من الحماس الأول لين التقييم بعد المشاهدة.",
    wl_empty:         "قائمتك تنتظر أول فيلم.",
    wl_empty_cta:     "ابدأ من التقويم",
    wl_top_eyebrow:   "أكثر فيلم انحفظ هالأسبوع",
    wl_top_save:      "احفظ",
    wl_share:         "شارك كصورة",
    wl_clear:         "مسح القائمة",
    wl_count:         "فيلم محفوظ",
    wl_count_pl:      "أفلام محفوظة",

    // My 2026 Lite
    my2026_eyebrow:        "خاص فيك",
    my2026_title:          "ملخصك السينمائي في 2026",
    my2026_sub:            "كل ما تقيّم أفلام أكثر، نعرف ذوقك أكثر.",
    my2026_watched:        "شفته",
    my2026_time:           "وقتك مع الأفلام",
    my2026_avg:            "متوسط تقييمك",
    my2026_vibe:           "أكثر جو عندك",
    my2026_personality:    "شخصيتك",
    my2026_soon:           "قريبًا",
    my2026_not_yet:        "لسه",
    my2026_not_enough:     "لسه ما يكفي",
    my2026_empty_title:    "ابدأ رحلتك",
    my2026_empty_body:     "علّمنا أول فيلم شفته عشان نبدأ نبني ملخصك السينمائي.",
    my2026_empty_cta:      "استكشف الأفلام",
    my2026_empty_alt_cta:  "أو استكشف كل الأفلام",
    my2026_p0:             "ابدأ رحلتك",
    my2026_p1:             "مبتدئ سينمائي",
    my2026_p4:             "محب أفلام",
    my2026_p11:            "عاشق سينما",
    my2026_p26:            "مدمن أفلام",
    my2026_bigscreen:      "عاشق الشاشة الكبيرة",
    my2026_horror:         "ملك الرعب",
    my2026_arabic:         "داعم السينما العربية",

    // inbound from a friend's share
    inbound_eyebrow:       "وصلتك من صديق",
    inbound_title:         "صديقك",
    inbound_sub:           "وش شخصيتك السينمائية في 2026؟ ابدأ قائمتك في أقل من دقيقة.",
    inbound_cta:           "ابدأ قائمتي ⬇",
    inbound_dismiss:       "إغلاق",

    // investor proof
    ip_eyebrow:       "الإشارات",
    ip_title:         "من الاكتشاف إلى معرفة الطلب.",
    ip_sub:           "كل حفظ، كل تذكير، كل تقييم — إشارة تساعد سينماب يفهم ذوق الجمهور السعودي.",
    ip_saved:         "أفلام محفوظة",
    ip_remind:        "طلبات تذكير",
    ip_trailer:       "مشاهدات إعلانات",
    ip_genres:        "أكثر التصنيفات",
    ip_cities:        "اهتمام المدن",
    ip_growth:        "نمو القوائم",
    ip_demo:          "عرض",

    // roadmap
    rm_eyebrow:       "الطريق",
    rm_title:         "وهذه مجرد البداية.",
    rm_active:        "نشط الآن",
    rm_soon:          "قريبًا",
    rm0_title:        "المرحلة 0 — اكتشف الأفلام القادمة",
    rm0_body:         "تقويم بصري + قوائم محفوظة + تذكيرات.",
    rm1_title:        "المرحلة 1 — قرر وش تشوف الليلة",
    rm1_body:         "ذكاء توصية مبني على مزاجك، وقتك، ورفقتك.",
    rm2_title:        "المرحلة 2 — خطط مع أصحابك",
    rm2_body:         "خطّط الأمسية مع رفقتك، شارك التذاكر، ووفّق المواعيد.",
    rm3_title:        "المرحلة 3 — قيّم، تذكّر، وشارك",
    rm3_body:         "أرشيف ذكي للأفلام اللي شفتها، تقييماتك، وذكريات الأمسية.",

    // final cta
    fc_title:         "جاهز تبني قائمتك؟",
    fc_sub:           "احفظ الأفلام اللي عليها كلام، وخلّ سينماب يذكّرك أول ما تفتح التذاكر.",
    fc_primary:       "شوف الأفلام",
    fc_secondary:     "انضم لقائمة الانتظار",

    // footer
    footer_tag:       "أفلام عليها كلام، وقائمة تحفظ ذوقك.",
    footer_made:      "صُنع لمحبي السينما في 🇸🇦",
    footer_subtitle:  "© 2026 سينماب — التواريخ قابلة للتغيير.",
    footer_tmdb:      "This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.",
    footer_about:     "عن سينماب",
    footer_privacy:   "الخصوصية",
    footer_terms:     "الشروط",

    // toasts
    toast_saved:      "أضفناه لقائمتك.",
    toast_removed:    "أزلناه من قائمتك.",
    toast_notify_on:  "بنذكّرك أول ما تفتح التذاكر.",
    toast_notify_off: "ألغينا التذكير.",
    toast_trailer:    "الإعلان قريب.",
    toast_copied:     "نسخنا الرابط.",
    toast_wl_copied:  "نسخنا قائمتك — شاركها مع أصحابك.",
    toast_wl_image:   "جهزنا صورة قائمتك.",
    toast_wl_empty:   "قائمتك فاضية — ضيف فيلم أول.",
    toast_wl_clear:   "مسحنا القائمة.",
    toast_waitlist:   "بنبلّغك أول ما يفتح المنتج.",
    toast_update_available: "نسخة جديدة متاحة — اضغط للتحديث",

    // misc
    open:             "افتح",
    close:            "إغلاق",
    minutes:          "دقيقة",
    rating:           "التصنيف",
    cast:             "الممثلون",

    // notify popup
    notify_title:     "ذكّرنا فيك أول ما تفتح التذاكر",
    notify_sub:       "اعطنا إيميلك (وواتساب اختياري) ونبلّغك أول ما تفتح تذاكر هذا الفيلم.",
    notify_for:       "تذكير على فيلم",
    notify_name:      "الاسم",
    notify_name_optional: "الاسم (اختياري)",
    notify_name_ph:   "اسمك الكامل",
    notify_email:     "الإيميل",
    notify_email_ph:  "you@example.com",
    notify_whatsapp:  "واتساب (اختياري)",
    notify_whatsapp_ph: "+9665XXXXXXXX",
    notify_city:      "المدينة (اختياري)",
    notify_city_ph:   "الرياض",
    notify_submit:    "فعّل التذكير",
    notify_sending:   "جاري الإرسال...",
    notify_skip:      "لاحقًا",
    notify_privacy:   "بنستخدم بياناتك بس عشان نذكّرك. ما نشاركها مع أحد.",
    notify_consent:   "أوافق على استخدام بياناتي لإرسال تذكير لهذا الفيلم عبر Formspree، وأقدر أطلب حذفها لاحقًا.",
    notify_consent_required: "لازم توافق على استخدام بياناتك للتذكير.",
    notify_name_required: "الاسم مطلوب",
    notify_required:  "الإيميل مطلوب",
    notify_invalid:   "ما يبدو إيميل صحيح",
    notify_error:     "صار في مشكلة. حاول مرة ثانية.",
    notify_success:   "بنذكّرك أول ما تفتح التذاكر 🔔",
    notify_quick:     "بنذكّرك على هذا الفيلم 🔔",

    // search
    search_ph:        "ابحث عن فيلم",
    search_open:      "ابحث",
    search_no_results:"ما لقينا أي فيلم بهذا الاسم",
    search_results:   "نتائج",

    // movie modal
    release_date:     "تاريخ الإطلاق",
    duration:         "مدة الفيلم",
    age_rating:       "التصنيف العمري",
    countdown:        "العد التنازلي",
    released:         "تم العرض",
    min:              "دقيقة",
    film:             "فيلم",
    films_pl:         "أفلام",
    orig_title:       "العنوان الأصلي",
    watch_trailer:    "شاهد الإعلان",
    hide_trailer:     "إغلاق الإعلان",
    trailer_soon:     "الإعلان قريب",
    cast_soon:        "الممثلون قريبًا",
    add_calendar:     "أضف للتقويم",
    google_cal:       "Google Calendar",
    apple_cal:        "Apple Calendar",
    apple_cal_hint:   "يحمّل ملف .ics تضيفه للتقويم.",
    apple_cal_ios_hint:"في كروم آيفون يظهر كملف؛ للفتح المباشر جرّبه من Safari.",
    outlook_cal:      "Outlook",
  },
  en: {
    nav_movies:       "Movies",
    nav_watchlist:    "Watchlist",
    nav_my2026:       "My 2026",
    nav_how:          "How It Works",
    nav_vision:       "Vision",
    nav_cta:          "My list",

    hero_eyebrow:     "Cinemap · 2026",
    hero_title:       "Movies worth talking about",
    hero_sub:         "Save upcoming movies, rate what you watched, and discover what actually deserves the cinema.",
    hero_support:     "What did you watch in 2026, and what are you still waiting for?",
    hero_cta:         "Explore 2026 Movies",
    hero_cta_2:       "My list",
    hero_cta_3:       "My 2026",
    hero_chip:        "Notify me when tickets open",
    hero_guide_label: "Cinemap button guide",
    hero_guide_save:  "Save",
    hero_guide_rate:  "Rate",
    hero_guide_notify:"Notify",
    hero_guide_calendar:"Calendar",

    j0_eyebrow:       "Journey 0 · Discovery",
    j0_title:         "Start with what's coming.",
    j0_sub:           "Cinemap begins as a discovery calendar — capturing audience demand weeks before tickets even open.",
    j0_card1_title:   "Discover",
    j0_card1_body:    "A full 2026 calendar — browse by month, mood, or language.",
    j0_card2_title:   "Save",
    j0_card2_body:    "A personal list that saves itself — come back whenever you want.",
    j0_card3_title:   "Get Notified",
    j0_card3_body:    "We'll ping you the moment tickets open — never miss a night out.",

    feat_eyebrow:     "Most anticipated · 2026",
    feat_title:       "Biggest Movies of 2026",
    feat_sub:         "The highest-potential upcoming releases. Save what excites you and get notified when tickets open.",
    feat_projected:   "Projected",
    feat_admissions:  "admissions",
    feat_rank:        "Rank",
    feat_swipe:       "Swipe to explore",

    cal_eyebrow:      "2026 calendar · month by month",
    cal_title:        "Every movie in one place.",
    cal_sub:          "Tap any film for details, or save it to your list.",
    filter_all:       "All",
    filter_genre:     "Genre",
    filter_lang:      "Language",
    filter_mood:      "Mood",
    filter_status:    "Status",
    filter_month:     "Month",
    filter_picks:     "Picks",
    filter_btn:       "Filter",
    filter_apply:     "Apply",
    filter_reset:     "Reset",
    filter_close:     "Close",
    filter_active:    "filter active",
    filter_active_pl: "filters active",
    filter_title:     "Filter movies",
    reset:            "Reset filters",
    no_results:       "No movies match these filters.",
    movies_count:     "films",

    save:             "Save",
    save_primary:     "Save",
    saved:            "Saved",
    notify:           "Notify Me",
    notified:         "Notified",
    watched:          "Watched",
    watched_question: "Watched?",
    watched_done:     "Watched",
    rate_it:          "Rate it",
    status_upcoming:  "Coming soon",
    status_now:       "Now showing",
    status_released:  "Released",
    toast_watched:    "Saved as watched. How was it?",
    toast_unwatched:  "Removed from watched",
    cal_quick:        "Calendar",
    cal_pick_title:   "Add to calendar",
    cal_pick_sub:     "Pick where to save it",
    cal_cancel:       "Cancel",
    toast_cal_added:  "Added to your calendar.",

    // rating sheet (Ticket 2)
    rate_title:       "How was it?",
    rate_sub:         "Rate it in a tap — it powers your Cinemap Score and our recommendations.",
    rate_stars_lbl:   "Your rating",
    rate_vibes_lbl:   "Vibes",
    rate_reaction_ph: "One-line reaction (optional)",
    rate_submit:      "Save rating",
    rate_sending:     "Sending...",
    rate_skip:        "Skip",
    rate_close:       "Close",
    rate_need_star:   "Pick a star rating first, or press Skip.",
    rate_need_consent:"Check the consent box so we can save your rating.",
    rate_thanks:      "Thanks — that's logged in your 2026 🎬",
    rate_consent:     "I agree to save my rating locally and send an anonymous copy to Cinemap to improve audience scores. I can request deletion later if it can be identified.",
    rate_v_bigscreen: "Worth the big screen",
    rate_v_stream:    "Stream it",
    rate_v_friends:   "With friends",
    rate_v_skip:      "Skip it",
    rate_v_date:      "Date night",
    rate_v_alone:     "Solo Friday",

    // cinemap score (Ticket 3)
    score_your:       "Your rating",
    score_avg:        "Cinemap Score",
    score_be_first:   "Be the first to rate",
    score_viewer:     "viewer",
    score_viewers_pl: "viewers",
    score_of:         "of",
    score_modal_lbl:  "Your rating",
    trailer:          "Watch Trailer",
    share:            "Share",
    days:             "days",

    wl_eyebrow:       "Your list",
    wl_title:         "Build your 2026 watchlist.",
    wl_sub:           "Every film you save is here — until tickets open.",
    wl_empty:         "Your watchlist is waiting for its first movie.",
    wl_empty_cta:     "Browse the calendar",
    wl_top_eyebrow:   "Most saved this week",
    wl_top_save:      "Save",
    wl_share:         "Share image",
    wl_clear:         "Clear list",
    wl_count:         "saved",
    wl_count_pl:      "saved",

    my2026_eyebrow:        "Private to you",
    my2026_title:          "My 2026 Movie Profile",
    my2026_sub:            "The more you rate, the more Cinemap understands your movie taste.",
    my2026_watched:        "Watched",
    my2026_time:           "Time with movies",
    my2026_avg:            "Average rating",
    my2026_vibe:           "Top vibe",
    my2026_personality:    "Your personality",
    my2026_soon:           "Soon",
    my2026_not_yet:        "Not yet",
    my2026_not_enough:     "Not enough yet",
    my2026_empty_title:    "Start your journey",
    my2026_empty_body:     "Mark your first watched movie and we’ll start building your movie profile.",
    my2026_empty_cta:      "Explore movies",
    my2026_empty_alt_cta:  "or explore all movies",
    my2026_p0:             "Start your journey",
    my2026_p1:             "Movie Starter",
    my2026_p4:             "Movie Lover",
    my2026_p11:            "Cinema Fan",
    my2026_p26:            "Cinema Addict",
    my2026_bigscreen:      "Big Screen Lover",
    my2026_horror:         "Horror Head",
    my2026_arabic:         "Arabic Cinema Supporter",

    inbound_eyebrow:       "From a friend",
    inbound_title:         "Your friend is a",
    inbound_sub:           "What's your taste in 2026 cinema? Build your list in under a minute.",
    inbound_cta:           "Start my list ⬇",
    inbound_dismiss:       "Dismiss",

    ip_eyebrow:       "Signals",
    ip_title:         "From discovery to demand.",
    ip_sub:           "Every save, reminder, and trailer click is a data point — helping Cinemap understand demand before tickets even go on sale.",
    ip_saved:         "Saved Movies",
    ip_remind:        "Reminder Requests",
    ip_trailer:       "Trailer Clicks",
    ip_genres:        "Top Genres",
    ip_cities:        "City Interest",
    ip_growth:        "Watchlist Growth",
    ip_demo:          "demo",

    rm_eyebrow:       "Roadmap",
    rm_title:         "This is only the beginning.",
    rm_active:        "Live now",
    rm_soon:          "Coming soon",
    rm0_title:        "Journey 0 — Discover what's coming",
    rm0_body:         "Visual calendar, saved lists, and reminders.",
    rm1_title:        "Journey 1 — Decide what to watch tonight",
    rm1_body:         "Smart picks based on your mood, your time, your company.",
    rm2_title:        "Journey 2 — Plan with friends",
    rm2_body:         "Plan the night with your crew, share tickets, sync schedules.",
    rm3_title:        "Journey 3 — Rate, remember, and share",
    rm3_body:         "A smart archive of what you watched, your ratings, your night.",

    fc_title:         "What are we watching next?",
    fc_sub:           "Build your 2026 list and let Cinemap ping you the moment tickets open.",
    fc_primary:       "Explore Movies",
    fc_secondary:     "Join the Waitlist",

    footer_tag:       "Your smart companion for better movie nights.",
    footer_made:      "Made for movie lovers 🇸🇦",
    footer_subtitle:  "© 2026 Cinemap — dates subject to change.",
    footer_tmdb:      "This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.",
    footer_about:     "About",
    footer_privacy:   "Privacy",
    footer_terms:     "Terms",

    toast_saved:      "Added to your list.",
    toast_removed:    "Removed from your list.",
    toast_notify_on:  "We'll let you know when tickets open.",
    toast_notify_off: "Reminder turned off.",
    toast_trailer:    "Trailer coming soon.",
    toast_copied:     "Link copied.",
    toast_wl_copied:  "Your list is copied — share it with friends.",
    toast_wl_image:   "Your list image is ready.",
    toast_wl_empty:   "Your list is empty — save a movie first.",
    toast_wl_clear:   "Watchlist cleared.",
    toast_waitlist:   "We'll let you know when it's ready.",
    toast_update_available: "New version available — tap to update",

    open:             "Open",
    close:            "Close",
    minutes:          "min",
    rating:           "Rating",
    cast:             "Top Cast",

    // notify popup
    notify_title:     "We'll let you know when tickets open",
    notify_sub:       "Drop your email (WhatsApp optional) and we'll ping you the moment tickets for this film go on sale.",
    notify_for:       "Reminder for",
    notify_name:      "Name",
    notify_name_optional: "Name (optional)",
    notify_name_ph:   "Your full name",
    notify_email:     "Email",
    notify_email_ph:  "you@example.com",
    notify_whatsapp:  "WhatsApp (optional)",
    notify_whatsapp_ph: "+9665XXXXXXXX",
    notify_city:      "City (optional)",
    notify_city_ph:   "Riyadh",
    notify_submit:    "Turn on reminder",
    notify_sending:   "Sending...",
    notify_skip:      "Maybe later",
    notify_privacy:   "We only use your info to remind you. We never share it.",
    notify_consent:   "I agree that Cinemap may use my details to send this movie reminder through Formspree, and I can request deletion later.",
    notify_consent_required: "Please agree to use your details for this reminder.",
    notify_name_required: "Name is required",
    notify_required:  "Email is required",
    notify_invalid:   "That doesn't look like a valid email",
    notify_error:     "Something went wrong. Please try again.",
    notify_success:   "We'll let you know when tickets open 🔔",
    notify_quick:     "Reminder set for this movie 🔔",

    // search
    search_ph:        "Search for a movie",
    search_open:      "Search",
    search_no_results:"No movies match",
    search_results:   "results",

    // movie modal
    release_date:     "Release Date",
    duration:         "Runtime",
    age_rating:       "Age Rating",
    countdown:        "Countdown",
    released:         "Released",
    min:              "min",
    film:             "film",
    films_pl:         "films",
    orig_title:       "Original Title",
    watch_trailer:    "Watch Trailer",
    hide_trailer:     "Close Trailer",
    trailer_soon:     "Trailer coming soon",
    cast_soon:        "Cast coming soon",
    add_calendar:     "Add to Calendar",
    google_cal:       "Google Calendar",
    apple_cal:        "Apple Calendar",
    apple_cal_hint:   "Downloads an .ics file you can add to Calendar.",
    apple_cal_ios_hint:"On iPhone Chrome this appears as a file; Safari opens it more smoothly.",
    outlook_cal:      "Outlook",
  }
};

// Compatibility shim — older modules look up MUVI_I18N
window.MUVI_I18N = window.CINEMAP_I18N;

// ============================================================
// 4) Helpers
// ============================================================

window.fmtDate = function(iso, lang) {
  const d = new Date(iso);
  const day = d.getDate();
  if (lang === 'en') {
    return `${window.CINEMAP_MONTHS_EN[d.getMonth()]} ${day}`;
  }
  return `${day} ${window.CINEMAP_MONTHS_AR[d.getMonth()]}`;
};
window.fmtDateAr = (iso) => window.fmtDate(iso, 'ar');
window.daysUntil = function(iso) {
  return Math.ceil((new Date(iso) - new Date()) / 86400000);
};
window.movieTitle = function(m, lang) {
  return lang === 'en' ? (m.en || m.ar) : (m.ar || m.en);
};
window.movieOverview = function(m, lang) {
  if (lang === 'en') return m.overviewEn || m.overview || '';
  return m.overview || m.overviewEn || '';
};

// Stable URL slug for a movie (used in deep-links and search keys).
window.movieSlug = function(m) {
  const base = (m.en || m.ar || '').toString().toLowerCase();
  return base
    .replace(/[^a-z0-9؀-ۿ\s-]/g, '') // keep alphanumerics + Arabic + spaces/hyphens
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
};

// Find a movie by slug (for deep-link routing).
window.findMovieBySlug = function(slug) {
  if (!slug) return null;
  return window.CINEMAP_MOVIES.find(m => window.movieSlug(m) === slug) || null;
};

// Featured (top 10 by projectedAdmissions / featuredRank)
window.getFeaturedMovies = function() {
  return window.CINEMAP_MOVIES
    .filter(m => m.featuredRank)
    .sort((a, b) => a.featuredRank - b.featuredRank);
};

// Format projected admissions: 1,000,000 → "1M" / "1 مليون"
window.fmtAdmissions = function(n, lang) {
  if (!n) return '';
  if (lang === 'en') {
    if (n >= 1000000) {
      const v = n / 1000000;
      return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + 'M';
    }
    if (n >= 1000) return Math.round(n / 1000) + 'K';
    return String(n);
  }
  // Arabic
  if (n >= 1000000) {
    const v = n / 1000000;
    return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + ' مليون';
  }
  if (n >= 1000) return Math.round(n / 1000) + ' ألف';
  return String(n);
};
