/* Cinemap — data, taxonomies, i18n, helpers */

// ============================================================
// 0) Config
// ============================================================
window.CINEMAP_CONFIG = {
  // Formspree endpoint that receives notify-me submissions.
  // Each movie request POSTs the contact + movie payload here;
  // emails arrive in the Formspree inbox + can be exported as CSV.
  notifyEndpoint: 'https://formspree.io/f/mlgaykkv',
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
  { month: 0, ar: "دورايمون", en: "Doraemon: Nobita's Art World Tales", genre: "anime", date: "2026-01-08",
    tmdbId: 1277309, language: 'jp', mood: 'family',
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
  { month: 0, ar: "Return to Silent Hill", en: "Return to Silent Hill", genre: "horror", date: "2026-01-29",
    tmdbId: 680493, exp: ['4dx'], language: 'en', mood: 'thrill',
    overview: "عودة إلى المدينة الضبابية الأكثر رعباً في تاريخ ألعاب الفيديو.",
    overviewEn: "A return to gaming's most haunted town.",
    runtime: 125, rating: "R" },
  { month: 0, ar: "Send Help", en: "Send Help", genre: "thriller", date: "2026-01-29", language: 'en', mood: 'thrill',
    overview: "رعب نفسي يدور حول شخصين عالقين على جزيرة نائية.",
    overviewEn: "A psychological thriller about two people stranded on a remote island.",
    runtime: 96, rating: "R" },

  // FEBRUARY
  { month: 1, ar: "Cold Storage", en: "Cold Storage", genre: "action", date: "2026-02-05", language: 'en', mood: 'thrill',
    overview: "تشويق علمي — كائن مجمّد من الماضي يعود للحياة.",
    overviewEn: "A frozen creature from the past wakes up.",
    runtime: 110, rating: "PG-13" },
  { month: 1, ar: "Scream 7", en: "Scream 7", genre: "horror", date: "2026-02-12", pick: true,
    tmdbId: 1159559, exp: ['4dx', 'screenx'], language: 'en', mood: 'thrill',
    overview: "عودة Ghostface — سيدني بريسكوت تواجه قاتلاً جديداً.",
    overviewEn: "Ghostface returns — Sidney Prescott faces a new killer.",
    runtime: 118, rating: "R" },
  { month: 1, ar: "Crime 101", en: "Crime 101", genre: "thriller", date: "2026-02-19",
    tmdbId: 1171145, language: 'en', mood: 'thrill',
    overview: "تحقيق جرائم مبني على رواية دون وينسلو.",
    overviewEn: "A crime investigation adapted from Don Winslow's novel.",
    runtime: 122, rating: "R" },
  { month: 1, ar: "Wuthering Heights", en: "Wuthering Heights", genre: "drama", date: "2026-02-19",
    tmdbId: 1316092, exp: ['suites', 'dolby'], language: 'en', mood: 'romance',
    overview: "اقتباس جديد لرواية إميلي برونتي الكلاسيكية — قصة حب قاتلة على المروج الإنجليزية.",
    overviewEn: "A new adaptation of Emily Brontë's classic — a love story on the English moors.",
    runtime: 130, rating: "PG-13" },
  { month: 1, ar: "Good Luck, Have Fun, Don't Die", en: "Good Luck, Have Fun, Don't Die", genre: "scifi", date: "2026-02-26", language: 'en', mood: 'thrill',
    overview: "خيال علمي ملحمي من المخرج جوردن فاخت-فيتالي.",
    overviewEn: "An epic sci-fi from director Gore Verbinski.",
    runtime: 128, rating: "R" },

  // MARCH
  { month: 2, ar: "فرقة الموت", en: "Death Squad", genre: "arabic", date: "2026-03-05", language: 'ar', mood: 'thrill',
    overview: "فيلم أكشن سعودي عن فرقة عمليات خاصة.",
    overviewEn: "A Saudi action film about a special-ops squad.",
    runtime: 110, rating: "PG-13" },
  { month: 2, ar: "أسد", en: "Aseed", genre: "arabic", date: "2026-03-12",
    noPoster: true, language: 'ar', mood: 'deep',
    overview: "دراما سعودية عن صعود وسقوط بطل شعبي.",
    overviewEn: "A Saudi drama about the rise and fall of a folk hero.",
    runtime: 115, rating: "PG-13" },
  { month: 2, ar: "ابن العسل", en: "Son of Honey", genre: "arabic", date: "2026-03-19", language: 'ar', mood: 'family',
    overview: "قصة عائلية سعودية مؤثرة عن الجذور والانتماء.",
    overviewEn: "A heartfelt Saudi family story about roots and belonging.",
    runtime: 108, rating: "PG" },
  { month: 2, ar: "Hoppers", en: "Hoppers", genre: "family", date: "2026-03-19",
    tmdbId: 1327819, exp: ['imax', 'dolby'], language: 'en', mood: 'family',
    overview: "فيلم أنيميشن من بيكسار — بطلته فتاة تنتقل وعيها إلى جسم قندس روبوتي.",
    overviewEn: "A Pixar animation about a girl whose mind enters a robot beaver.",
    runtime: 98, rating: "PG" },
  { month: 2, ar: "شباب البومب 3", en: "Shabab Al Bomb 3", genre: "arabic", date: "2026-03-26", pick: true, language: 'ar', mood: 'fun',
    overview: "الجزء الثالث من المسلسل الكوميدي السعودي الأيقوني — عودة الشباب إلى السينما.",
    overviewEn: "The third chapter of Saudi Arabia's iconic comedy crew — back on the big screen.",
    runtime: 120, rating: "PG-13" },
  { month: 2, ar: "Project Hail Mary", en: "Project Hail Mary", genre: "scifi", date: "2026-03-26",
    tmdbId: 687163, exp: ['imax', 'dolby'], language: 'en', mood: 'thrill',
    overview: "اقتباس لرواية آندي واير — رائد فضاء يستيقظ ليجد نفسه وحيداً في مهمة لإنقاذ الأرض.",
    overviewEn: "An astronaut wakes up alone on a mission to save Earth — adapted from Andy Weir.",
    runtime: 135, rating: "PG-13" },

  // APRIL
  { month: 3, ar: "Super Mario Galaxy", en: "The Super Mario Galaxy Movie", genre: "family", date: "2026-04-03", pick: true,
    tmdbId: 1226863, exp: ['imax', '4dx'], language: 'en', mood: 'family',
    overview: "ماريو ولويجي ينطلقان في مغامرة كونية جديدة عبر المجرة.",
    overviewEn: "Mario and Luigi blast off across the galaxy.",
    runtime: 95, rating: "PG" },
  { month: 3, ar: "Michael", en: "Michael", genre: "drama", date: "2026-04-10",
    tmdbId: 936075, exp: ['dolby', 'suites'], language: 'en', mood: 'deep',
    overview: "سيرة ذاتية لملك البوب مايكل جاكسون.",
    overviewEn: "The biopic of the King of Pop, Michael Jackson.",
    runtime: 140, rating: "PG-13" },
  { month: 3, ar: "The Devil Wears Prada 2", en: "The Devil Wears Prada 2", genre: "comedy", date: "2026-04-17",
    tmdbId: 1314481, language: 'en', mood: 'fun',
    overview: "عودة ميراندا بريستلي بعد عقدين من الفيلم الأصلي.",
    overviewEn: "Miranda Priestly returns, two decades on.",
    runtime: 110, rating: "PG-13" },
  { month: 3, ar: "GOAT", en: "GOAT", genre: "family", date: "2026-04-24", language: 'en', mood: 'family',
    overview: "فيلم كرتون عائلي عن مغامرة شيّقة وممتعة للصغار والكبار.",
    overviewEn: "A family animated adventure full of laughs for kids and adults alike.",
    runtime: 95, rating: "PG" },

  // MAY
  { month: 4, ar: "Mortal Kombat 2", en: "Mortal Kombat 2", genre: "action", date: "2026-05-07",
    exp: ['screenx', '4dx'], language: 'en', mood: 'thrill',
    overview: "الجزء الثاني من فيلم القتال الأيقوني — عوالم جديدة ومعارك أضخم.",
    overviewEn: "The iconic fighting franchise — new realms, bigger battles.",
    runtime: 115, rating: "R" },
  { month: 4, ar: "Star Wars: The Mandalorian and Grogu", en: "The Mandalorian and Grogu", genre: "scifi", date: "2026-05-22", pick: true,
    tmdbId: 1228710, exp: ['imax', 'dolby', '4dx'], language: 'en', mood: 'thrill',
    overview: "أول فيلم سينمائي لسلسلة The Mandalorian — ماندو وغروغو في مغامرة جديدة.",
    overviewEn: "The first big-screen entry for The Mandalorian — Mando and Grogu return.",
    runtime: 130, rating: "PG" },
  { month: 4, ar: "The Sheep Detectives", en: "The Sheep Detectives", genre: "family", date: "2026-05-08",
    tmdbId: 1301421, language: 'en', mood: 'fun',
    overview: "ثلاثة خراف يحلّون جريمة قتل في قرية إيرلندية — تحقيق كوميدي مثير بأصوات هيو جاكمان وإيما تومبسون.",
    overviewEn: "Three sheep solve a murder in an Irish village — voiced by Hugh Jackman and Emma Thompson.",
    runtime: 96, rating: "PG" },

  // JUNE
  { month: 5, ar: "Scary Movie 6", en: "Scary Movie 6", genre: "comedy", date: "2026-06-12", language: 'en', mood: 'fun',
    overview: "الجزء السادس من سلسلة المحاكاة الكوميدية الشهيرة.",
    overviewEn: "The sixth chapter of the long-running spoof series.",
    runtime: 92, rating: "PG-13" },
  { month: 5, ar: "Supergirl", en: "Supergirl: Woman of Tomorrow", genre: "action", date: "2026-06-26",
    tmdbId: 1081003, exp: ['imax', 'screenx'], language: 'en', mood: 'thrill',
    overview: "كارا زور-إل تنطلق في مغامرة عبر المجرات.",
    overviewEn: "Kara Zor-El blasts off on a galactic odyssey.",
    runtime: 128, rating: "PG-13" },
  { month: 5, ar: "Disclosure Day", en: "Disclosure Day", genre: "scifi", date: "2026-06-11", pick: true, language: 'en', mood: 'thrill',
    featuredRank: 9, projectedAdmissions: 350000, badge: "Mystery Pick", badgeAr: "اختيار غامض",
    overview: "إثارة خيال علمي — يوم يُكشف فيه كل شيء.",
    overviewEn: "A sci-fi thriller — the day everything comes out.",
    runtime: 115, rating: "R" },
  { month: 5, ar: "Toy Story 5", en: "Toy Story 5", genre: "family", date: "2026-06-18", pick: true,
    tmdbId: 1084244, exp: ['imax', 'dolby', '4dx'], language: 'en', mood: 'family',
    featuredRank: 4, projectedAdmissions: 750000, badge: "Family Pick", badgeAr: "اختيار عائلي",
    overview: "ودي، باز، وكل اللعب عادوا — هذه المرة ضد تحدٍ تقني جديد.",
    overviewEn: "Woody, Buzz and the whole gang are back — this time taking on tech.",
    runtime: 102, rating: "G" },
  { month: 5, ar: "Master of the Universe", en: "Masters of the Universe", genre: "action", date: "2026-06-05",
    tmdbId: 454639, exp: ['imax', 'screenx', '4dx'], language: 'en', mood: 'thrill',
    overview: "هي-مان وأبطال Eternia في فيلم لايف آكشن جديد.",
    overviewEn: "He-Man and the heroes of Eternia in a new live-action.",
    runtime: 125, rating: "PG-13" },

  // JULY
  { month: 6, ar: "Minions & Monsters", en: "Minions & Monsters", genre: "family", date: "2026-07-02", pick: true, language: 'en', mood: 'family',
    featuredRank: 7, projectedAdmissions: 550000, badge: "Crowd Favorite", badgeAr: "مفضل جماهيري",
    overview: "المنيونز يخوضون مغامرة جديدة هذه المرة بمواجهة وحوش غريبة.",
    overviewEn: "The yellow gang faces a new wave of monsters in their wildest adventure yet.",
    runtime: 95, rating: "PG" },
  { month: 6, ar: "Moana", en: "Moana (Live Action)", genre: "family", date: "2026-07-09", pick: true,
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
  { month: 6, ar: "Spider-Man: Brand New Day", en: "Spider-Man: Brand New Day", genre: "action", date: "2026-07-30", pick: true,
    tmdbId: 969681, exp: ['imax', 'screenx', '4dx', 'dolby'], language: 'en', mood: 'thrill',
    featuredRank: 1, projectedAdmissions: 1000000, badge: "Top Pick", badgeAr: "الأكثر ترقبًا",
    overview: "الرجل العنكبوت في فصل جديد تماماً.",
    overviewEn: "Spider-Man begins a brand-new chapter.",
    runtime: 135, rating: "PG-13" },
  { month: 6, ar: "Evil Dead Burn", en: "Evil Dead Burn", genre: "horror", date: "2026-07-31", language: 'en', mood: 'thrill',
    overview: "الجزء الجديد من سلسلة Evil Dead — الشياطين تحترق.",
    overviewEn: "The new Evil Dead — the demons are on fire.",
    runtime: 100, rating: "R" },

  // AUGUST
  { month: 7, ar: "The End of Oak Street", en: "The End of Oak Street", genre: "thriller", date: "2026-08-13", language: 'en', mood: 'thrill',
    overview: "إثارة نفسية من وارنر براذرز عن أسرار شارع قديم.",
    overviewEn: "A psychological thriller about the secrets of an old street.",
    runtime: 108, rating: "R" },
  { month: 7, ar: "The Dog Stars", en: "The Dog Stars", genre: "scifi", date: "2026-08-27", language: 'en', mood: 'deep',
    overview: "ملحمة ما بعد الكارثة من المخرج ريدلي سكوت — آخر البشر يبحثون عن أمل.",
    overviewEn: "Ridley Scott's post-apocalyptic epic — the last humans look for hope.",
    runtime: 120, rating: "PG-13" },
  { month: 7, ar: "Insidious 6", en: "Insidious: 6", genre: "horror", date: "2026-08-07",
    exp: ['4dx'], language: 'en', mood: 'thrill',
    overview: "عودة عائلة Lambert إلى العالم الآخر.",
    overviewEn: "The Lambert family returns to The Further.",
    runtime: 108, rating: "PG-13" },
  { month: 7, ar: "Mutiny", en: "Mutiny", genre: "action", date: "2026-08-14", language: 'en', mood: 'thrill',
    overview: "أكشن بحري عن تمرد على سفينة قرصنة.",
    overviewEn: "A nautical action film about a pirate-ship mutiny.",
    runtime: 118, rating: "R" },
  { month: 7, ar: "Coyote vs. ACME", en: "Coyote vs. Acme", genre: "comedy", date: "2026-08-21", pick: true,
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
  { month: 8, ar: "Forgotten Island", en: "Forgotten Island", genre: "thriller", date: "2026-09-04", language: 'en', mood: 'thrill',
    overview: "إثارة على جزيرة مهجورة تخفي أسرار كثيرة.",
    overviewEn: "A thriller on a deserted island hiding too many secrets.",
    runtime: 112, rating: "PG-13" },
  { month: 8, ar: "Resident Evil", en: "Resident Evil", genre: "horror", date: "2026-09-17", pick: true,
    exp: ['screenx', '4dx'], language: 'en', mood: 'thrill',
    featuredRank: 10, projectedAdmissions: 300000, badge: "Horror Night", badgeAr: "ليلة رعب",
    overview: "إعادة تشغيل سلسلة Resident Evil — شركة أمبريلا تعود.",
    overviewEn: "Resident Evil reboots — Umbrella is back.",
    runtime: 130, rating: "R" },
  { month: 8, ar: "Clayface", en: "Clayface", genre: "horror", date: "2026-09-11",
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
  { month: 9, ar: "Street Fighter", en: "Street Fighter", genre: "action", date: "2026-10-16", pick: true,
    tmdbId: 1153576, exp: ['screenx', '4dx', 'imax'], language: 'en', mood: 'thrill',
    overview: "اقتباس لايف آكشن للعبة القتال الأيقونية.",
    overviewEn: "A live-action take on the legendary fighting game.",
    runtime: 120, rating: "PG-13" },
  { month: 9, ar: "Digger", en: "Digger", genre: "drama", date: "2026-10-02", language: 'en', mood: 'deep',
    overview: "دراما مؤثرة عن عمال المناجم.",
    overviewEn: "A moving drama about miners.",
    runtime: 118, rating: "PG-13" },
  { month: 9, ar: "The Social Reckoning", en: "The Social Reckoning", genre: "drama", date: "2026-10-09", language: 'en', mood: 'deep',
    overview: "فيلم عن الجانب المظلم لوسائل التواصل الاجتماعي.",
    overviewEn: "A film about the dark side of social media.",
    runtime: 125, rating: "R" },
  { month: 9, ar: "Remain", en: "Remain", genre: "thriller", date: "2026-10-23", language: 'en', mood: 'romance',
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
  { month: 10, ar: "Ebenezer Scrooge", en: "Ebenezer Scrooge", genre: "drama", date: "2026-11-12", language: 'en', mood: 'deep',
    overview: "جوني ديب في دور سكروج — تحويل أدبي حديث لقصة ديكنز الكلاسيكية.",
    overviewEn: "Johnny Depp plays Scrooge — a modern adaptation of Dickens.",
    runtime: 120, rating: "PG-13" },
  { month: 10, ar: "Meet the Parents 4", en: "Meet the Parents: A Little Fokking in the House", genre: "comedy", date: "2026-11-06", language: 'en', mood: 'fun',
    overview: "عودة غريغ فوكر وعائلته في مغامرة كوميدية جديدة.",
    overviewEn: "Greg Focker and family return for another chaotic comedy.",
    runtime: 108, rating: "PG-13" },
  { month: 10, ar: "Hexed", en: "Hexed", genre: "horror", date: "2026-11-13", language: 'en', mood: 'thrill',
    overview: "رعب عن لعنة قديمة تطارد عائلة.",
    overviewEn: "An old curse haunts a family.",
    runtime: 102, rating: "R" },
  { month: 10, ar: "The Cat in the Hat", en: "The Cat in the Hat", genre: "family", date: "2026-11-20", pick: true,
    tmdbId: 1074313, language: 'en', mood: 'family',
    overview: "قطة الدكتور سوس الشهيرة في نسخة أنيميشن جديدة.",
    overviewEn: "Dr. Seuss's iconic cat in a fresh animated take.",
    runtime: 92, rating: "G" },
  { month: 10, ar: "The Hunger Games", en: "The Hunger Games: Sunrise on the Reaping", genre: "action", date: "2026-11-20",
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
  { month: 11, ar: "Dune 3", en: "Dune: Part Three", genre: "scifi", date: "2026-12-17", pick: true,
    tmdbId: 1935783, exp: ['imax', 'dolby', 'screenx'], language: 'en', mood: 'deep',
    featuredRank: 8, projectedAdmissions: 350000, badge: "Premium Format Pick", badgeAr: "اختيار للشاشات المميزة",
    overview: "الجزء الثالث من ملحمة ديون — بول أتريديس إمبراطور الكون.",
    overviewEn: "The third chapter of Dune — Paul Atreides, emperor of the universe.",
    runtime: 170, rating: "PG-13" },
  { month: 11, ar: "Jumanji: Open World", en: "Jumanji: Open World", genre: "comedy", date: "2026-12-25", pick: true, language: 'en', mood: 'fun',
    featuredRank: 3, projectedAdmissions: 750000, badge: "Group Night", badgeAr: "اختيار للجماعة",
    overview: "عودة الأبطال إلى العالم الأكثر خطورة في ألعاب الفيديو.",
    overviewEn: "The crew returns to gaming's most dangerous world.",
    runtime: 118, rating: "PG-13" },
  { month: 11, ar: "Avengers: Doomsday", en: "Avengers: Doomsday", genre: "action", date: "2026-12-17", pick: true,
    tmdbId: 1003596, exp: ['imax', 'screenx', '4dx', 'dolby'], language: 'en', mood: 'thrill',
    featuredRank: 5, projectedAdmissions: 700000, badge: "Marvel Event", badgeAr: "حدث مارفل",
    overview: "المنتقمون يواجهون أخطر تهديد في تاريخ MCU — دكتور دووم.",
    overviewEn: "The Avengers face the MCU's biggest threat yet — Doctor Doom.",
    runtime: 160, rating: "PG-13" },
];

// Status helper — coming-soon vs now-showing vs released
function _statusFor(iso) {
  const days = Math.ceil((new Date(iso) - new Date()) / 86400000);
  if (days > 14) return 'soon';
  if (days >= -30) return 'now';
  return 'released';
}

window.CINEMAP_MOVIES = RAW_MOVIES.map(m => ({ ...m, status: _statusFor(m.date) }));

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
  indian:    { ar: "سينما هندية", en: "Indian",    color: "#FF8A00" },
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
  hi: { ar: "هندي",   en: "Hindi" },
};

window.CINEMAP_STATUSES = {
  soon:     { ar: "قريبًا",   en: "Coming Soon" },
  now:      { ar: "يعرض الآن", en: "Now Showing" },
  released: { ar: "تم الإصدار", en: "Released" },
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
    nav_how:          "كيف يعمل",
    nav_vision:       "الرؤية",
    nav_cta:          "ابنِ قائمتي",

    // hero
    hero_eyebrow:     "رفيقك السينمائي · 2026",
    hero_title:       "سنتك السينمائية تبدأ هنا.",
    hero_sub:         "اكتشف أهم الأفلام القادمة، احفظ مفضلاتك، وخلك أول من يعرف متى تفتح التذاكر.",
    hero_cta:         "استكشف أفلام 2026",
    hero_cta_2:       "ابنِ قائمتي",
    hero_chip:        "ذكّرني أول ما تفتح التذاكر",
    hero_pill_films:  "أكثر من 60 فيلم",
    hero_pill_year:   "السنة كاملة",
    hero_pill_local:  "إنتاج عربي",

    // journey 0
    j0_eyebrow:       "المرحلة 0 · الاكتشاف",
    j0_title:         "ابدأ بالأفلام القادمة.",
    j0_sub:           "Cinemap يبدأ كتقويم للاكتشاف — نلتقط شغف الجمهور قبل ما تفتح التذاكر بأسابيع.",
    j0_card1_title:   "اكتشف",
    j0_card1_body:    "تقويم كامل لأفلام 2026 — تصفّح حسب الشهر، المزاج، أو اللغة.",
    j0_card2_title:   "احفظ",
    j0_card2_body:    "قائمة شخصية تحفظها تلقائيًا — رجّع لها متى ما حبّيت.",
    j0_card3_title:   "تذكّر أول بأول",
    j0_card3_body:    "نخبرك أول ما تفتح التذاكر — بدون ما تفوتك أي أمسية.",

    // featured carousel
    feat_eyebrow:     "الأكثر ترقبًا · 2026",
    feat_title:       "أكبر أفلام 2026",
    feat_sub:         "أفلام متوقع لها أعلى حضور في السوق، احفظ اللي يحمسك وخلك أول من يعرف متى تفتح التذاكر.",
    feat_projected:   "متوقع له",
    feat_admissions:  "حضور",
    feat_rank:        "الترتيب",
    feat_swipe:       "اسحب لاكتشاف الأفلام",

    // calendar
    cal_eyebrow:      "تقويم 2026 · شهر بشهر",
    cal_title:        "كل أفلامك في مكان واحد.",
    cal_sub:          "اضغط على أي فيلم لعرض التفاصيل، أو احفظه لقائمتك.",
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
    saved:            "✓ محفوظ",
    notify:           "ذكّرني",
    notified:         "✓ مفعّل",
    trailer:          "شاهد الإعلان",
    share:            "شارك",
    days:             "يوم",

    // watchlist
    wl_eyebrow:       "قائمتك",
    wl_title:         "ابنِ قائمتك لأفلام 2026.",
    wl_sub:           "كل فيلم تحفظه يبقى معك — حتى تفتح التذاكر.",
    wl_empty:         "قائمتك تنتظر أول فيلم.",
    wl_empty_cta:     "ابدأ من التقويم",
    wl_share:         "شارك القائمة",
    wl_clear:         "مسح القائمة",
    wl_count:         "فيلم محفوظ",
    wl_count_pl:      "أفلام محفوظة",

    // investor proof
    ip_eyebrow:       "الإشارات",
    ip_title:         "من الاكتشاف إلى معرفة الطلب.",
    ip_sub:           "كل حفظ، كل تذكير، كل ضغطة على إعلان — نقطة بيانات تساعد Cinemap يفهم وش يبي السوق قبل ما تفتح التذاكر.",
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
    fc_title:         "وش بنشوف بعدين؟",
    fc_sub:           "ابنِ قائمتك لـ 2026 وخلّ Cinemap يذكّرك أول ما تفتح التذاكر.",
    fc_primary:       "استكشف الأفلام",
    fc_secondary:     "انضم لقائمة الانتظار",

    // footer
    footer_tag:       "رفيقك الذكي لليالي سينمائية أحلى.",
    footer_made:      "صُنع لمحبي السينما في 🇸🇦",
    footer_subtitle:  "© 2026 Cinemap — التواريخ قابلة للتغيير.",

    // toasts
    toast_saved:      "أضفناه لقائمتك.",
    toast_removed:    "أزلناه من قائمتك.",
    toast_notify_on:  "بنذكّرك أول ما تفتح التذاكر.",
    toast_notify_off: "ألغينا التذكير.",
    toast_trailer:    "الإعلان قريب.",
    toast_copied:     "نسخنا الرابط.",
    toast_wl_copied:  "نسخنا قائمتك — شاركها مع أصحابك.",
    toast_wl_empty:   "قائمتك فاضية — ضيف فيلم أول.",
    toast_wl_clear:   "مسحنا القائمة.",
    toast_waitlist:   "بنبلّغك أول ما يفتح المنتج.",

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
    notify_name_required: "الاسم مطلوب",
    notify_required:  "الإيميل مطلوب",
    notify_invalid:   "ما يبدو إيميل صحيح",
    notify_error:     "صار في مشكلة. حاول مرة ثانية.",
    notify_success:   "بنذكّرك أول ما تفتح التذاكر 🔔",
    notify_quick:     "بنذكّرك على هذا الفيلم 🔔",

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
    add_calendar:     "أضف للتقويم",
    google_cal:       "Google Calendar",
    apple_cal:        "Apple / iCal",
    outlook_cal:      "Outlook",
  },
  en: {
    nav_movies:       "Movies",
    nav_watchlist:    "Watchlist",
    nav_how:          "How It Works",
    nav_vision:       "Vision",
    nav_cta:          "Build My Watchlist",

    hero_eyebrow:     "Your movie companion · 2026",
    hero_title:       "Your movie year starts here.",
    hero_sub:         "Discover the biggest upcoming movies, save your favorites, and get notified when they're ready to watch.",
    hero_cta:         "Explore 2026 Movies",
    hero_cta_2:       "Build My Watchlist",
    hero_chip:        "Notify me when tickets open",
    hero_pill_films:  "60+ films",
    hero_pill_year:   "Full year",
    hero_pill_local:  "Local stories",

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
    saved:            "✓ Saved",
    notify:           "Notify Me",
    notified:         "✓ Notified",
    trailer:          "Watch Trailer",
    share:            "Share",
    days:             "days",

    wl_eyebrow:       "Your list",
    wl_title:         "Build your 2026 watchlist.",
    wl_sub:           "Every film you save is here — until tickets open.",
    wl_empty:         "Your watchlist is waiting for its first movie.",
    wl_empty_cta:     "Browse the calendar",
    wl_share:         "Share watchlist",
    wl_clear:         "Clear list",
    wl_count:         "saved",
    wl_count_pl:      "saved",

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

    toast_saved:      "Added to your list.",
    toast_removed:    "Removed from your list.",
    toast_notify_on:  "We'll let you know when tickets open.",
    toast_notify_off: "Reminder turned off.",
    toast_trailer:    "Trailer coming soon.",
    toast_copied:     "Link copied.",
    toast_wl_copied:  "Your list is copied — share it with friends.",
    toast_wl_empty:   "Your list is empty — save a movie first.",
    toast_wl_clear:   "Watchlist cleared.",
    toast_waitlist:   "We'll let you know when it's ready.",

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
    notify_name_required: "Name is required",
    notify_required:  "Email is required",
    notify_invalid:   "That doesn't look like a valid email",
    notify_error:     "Something went wrong. Please try again.",
    notify_success:   "We'll let you know when tickets open 🔔",
    notify_quick:     "Reminder set for this movie 🔔",

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
    add_calendar:     "Add to Calendar",
    google_cal:       "Google Calendar",
    apple_cal:        "Apple / iCal",
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
