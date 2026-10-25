/** Bihar districts and representative towns. Based on Bihar Govt district portal
 * https://bihar.s3waas.gov.in/ and official district registration offices.
 * This is a curated city selection, not an exhaustive village/block directory.
 * Geography is metadata stored in existing article tags until a reviewed schema migration.
 */
export type City = { slug: string; name: string };
export type District = { slug: string; name: string; cities: City[] };
export const BIHAR_DISTRICTS: District[] = [
  {
    "slug": "araria",
    "name": "अररिया",
    "cities": [
      {
        "slug": "araria",
        "name": "अररिया"
      },
      {
        "slug": "forbesganj",
        "name": "फारबिसगंज"
      },
      {
        "slug": "jokihat",
        "name": "जोकीहाट"
      }
    ]
  },
  {
    "slug": "arwal",
    "name": "अरवल",
    "cities": [
      {
        "slug": "arwal",
        "name": "अरवल"
      }
    ]
  },
  {
    "slug": "aurangabad",
    "name": "औरंगाबाद",
    "cities": [
      {
        "slug": "aurangabad",
        "name": "औरंगाबाद"
      },
      {
        "slug": "daudnagar",
        "name": "दाउदनगर"
      }
    ]
  },
  {
    "slug": "banka",
    "name": "बांका",
    "cities": [
      {
        "slug": "banka",
        "name": "बांका"
      }
    ]
  },
  {
    "slug": "begusarai",
    "name": "बेगूसराय",
    "cities": [
      {
        "slug": "begusarai",
        "name": "बेगूसराय"
      },
      {
        "slug": "teghra",
        "name": "तेघड़ा"
      },
      {
        "slug": "bakhri",
        "name": "बखरी"
      }
    ]
  },
  {
    "slug": "bhagalpur",
    "name": "भागलपुर",
    "cities": [
      {
        "slug": "bhagalpur",
        "name": "भागलपुर"
      },
      {
        "slug": "kahalgaon",
        "name": "कहलगांव"
      },
      {
        "slug": "bihpur",
        "name": "बिहपुर"
      }
    ]
  },
  {
    "slug": "bhojpur",
    "name": "भोजपुर",
    "cities": [
      {
        "slug": "arrah",
        "name": "आरा"
      },
      {
        "slug": "jagdishpur",
        "name": "जगदीशपुर"
      },
      {
        "slug": "piro",
        "name": "पीरो"
      }
    ]
  },
  {
    "slug": "buxar",
    "name": "बक्सर",
    "cities": [
      {
        "slug": "buxar",
        "name": "बक्सर"
      }
    ]
  },
  {
    "slug": "darbhanga",
    "name": "दरभंगा",
    "cities": [
      {
        "slug": "darbhanga",
        "name": "दरभंगा"
      },
      {
        "slug": "bahera",
        "name": "बहेड़ा"
      },
      {
        "slug": "kamtaul",
        "name": "कम्तौल"
      }
    ]
  },
  {
    "slug": "east-champaran",
    "name": "पूर्वी चंपारण",
    "cities": [
      {
        "slug": "motihari",
        "name": "मोतिहारी"
      },
      {
        "slug": "raxaul",
        "name": "रक्सौल"
      },
      {
        "slug": "chakia",
        "name": "चकिया"
      }
    ]
  },
  {
    "slug": "gaya",
    "name": "गया",
    "cities": [
      {
        "slug": "gaya",
        "name": "गया"
      },
      {
        "slug": "sherghati",
        "name": "शेरघाटी"
      },
      {
        "slug": "tekari",
        "name": "टेकारी"
      }
    ]
  },
  {
    "slug": "gopalganj",
    "name": "गोपालगंज",
    "cities": [
      {
        "slug": "gopalganj",
        "name": "गोपालगंज"
      },
      {
        "slug": "mirganj",
        "name": "मीरगंज"
      }
    ]
  },
  {
    "slug": "jamui",
    "name": "जमुई",
    "cities": [
      {
        "slug": "jamui",
        "name": "जमुई"
      },
      {
        "slug": "chakai",
        "name": "चकाई"
      }
    ]
  },
  {
    "slug": "jehanabad",
    "name": "जहानाबाद",
    "cities": [
      {
        "slug": "jehanabad",
        "name": "जहानाबाद"
      }
    ]
  },
  {
    "slug": "kaimur",
    "name": "कैमूर",
    "cities": [
      {
        "slug": "bhabua",
        "name": "भभुआ"
      },
      {
        "slug": "mohania",
        "name": "मोहनिया"
      }
    ]
  },
  {
    "slug": "katihar",
    "name": "कटिहार",
    "cities": [
      {
        "slug": "katihar",
        "name": "कटिहार"
      },
      {
        "slug": "barsoi",
        "name": "बारसोई"
      }
    ]
  },
  {
    "slug": "khagaria",
    "name": "खगड़िया",
    "cities": [
      {
        "slug": "khagaria",
        "name": "खगड़िया"
      },
      {
        "slug": "gogri",
        "name": "गोगरी"
      }
    ]
  },
  {
    "slug": "kishanganj",
    "name": "किशनगंज",
    "cities": [
      {
        "slug": "kishanganj",
        "name": "किशनगंज"
      },
      {
        "slug": "bahadurganj",
        "name": "बहादुरगंज"
      },
      {
        "slug": "thakurganj",
        "name": "ठाकुरगंज"
      }
    ]
  },
  {
    "slug": "lakhisarai",
    "name": "लखीसराय",
    "cities": [
      {
        "slug": "lakhisarai",
        "name": "लखीसराय"
      },
      {
        "slug": "suryagarha",
        "name": "सूर्यगढ़ा"
      }
    ]
  },
  {
    "slug": "madhepura",
    "name": "मधेपुरा",
    "cities": [
      {
        "slug": "madhepura",
        "name": "मधेपुरा"
      },
      {
        "slug": "uda-kishanganj",
        "name": "उदाकिशुनगंज"
      }
    ]
  },
  {
    "slug": "madhubani",
    "name": "मधुबनी",
    "cities": [
      {
        "slug": "madhubani",
        "name": "मधुबनी"
      },
      {
        "slug": "jainagar",
        "name": "जयनगर"
      },
      {
        "slug": "jhanjharpur",
        "name": "झंझारपुर"
      }
    ]
  },
  {
    "slug": "munger",
    "name": "मुंगेर",
    "cities": [
      {
        "slug": "munger",
        "name": "मुंगेर"
      },
      {
        "slug": "tarapur",
        "name": "तारापुर"
      }
    ]
  },
  {
    "slug": "muzaffarpur",
    "name": "मुजफ्फरपुर",
    "cities": [
      {
        "slug": "muzaffarpur",
        "name": "मुजफ्फरपुर"
      },
      {
        "slug": "motipur",
        "name": "मोतीपुर"
      },
      {
        "slug": "sakra",
        "name": "सकरा"
      }
    ]
  },
  {
    "slug": "nalanda",
    "name": "नालंदा",
    "cities": [
      {
        "slug": "biharsharif",
        "name": "बिहारशरीफ"
      },
      {
        "slug": "rajgir",
        "name": "राजगीर"
      },
      {
        "slug": "hilsa",
        "name": "हिलसा"
      }
    ]
  },
  {
    "slug": "nawada",
    "name": "नवादा",
    "cities": [
      {
        "slug": "nawada",
        "name": "नवादा"
      },
      {
        "slug": "rajauli",
        "name": "रजौली"
      }
    ]
  },
  {
    "slug": "patna",
    "name": "पटना",
    "cities": [
      {
        "slug": "patna",
        "name": "पटना"
      },
      {
        "slug": "patna-city",
        "name": "पटना सिटी"
      },
      {
        "slug": "danapur",
        "name": "दानापुर"
      },
      {
        "slug": "barh",
        "name": "बाढ़"
      }
    ]
  },
  {
    "slug": "purnia",
    "name": "पूर्णिया",
    "cities": [
      {
        "slug": "purnia",
        "name": "पूर्णिया"
      },
      {
        "slug": "dhamdaha",
        "name": "धमदाहा"
      },
      {
        "slug": "amour",
        "name": "अमौर"
      }
    ]
  },
  {
    "slug": "rohtas",
    "name": "रोहतास",
    "cities": [
      {
        "slug": "sasaram",
        "name": "सासाराम"
      },
      {
        "slug": "dehri",
        "name": "डेहरी"
      },
      {
        "slug": "bikramganj",
        "name": "बिक्रमगंज"
      }
    ]
  },
  {
    "slug": "saharsa",
    "name": "सहरसा",
    "cities": [
      {
        "slug": "saharsa",
        "name": "सहरसा"
      },
      {
        "slug": "simri-bakhtiyarpur",
        "name": "सिमरी बख्तियारपुर"
      }
    ]
  },
  {
    "slug": "samastipur",
    "name": "समस्तीपुर",
    "cities": [
      {
        "slug": "samastipur",
        "name": "समस्तीपुर"
      },
      {
        "slug": "dalsinghsarai",
        "name": "दलसिंहसराय"
      },
      {
        "slug": "rosera",
        "name": "रोसड़ा"
      }
    ]
  },
  {
    "slug": "saran",
    "name": "सारण",
    "cities": [
      {
        "slug": "chhapra",
        "name": "छपरा"
      },
      {
        "slug": "sonepur",
        "name": "सोनपुर"
      },
      {
        "slug": "marhaura",
        "name": "मढ़ौरा"
      }
    ]
  },
  {
    "slug": "sheikhpura",
    "name": "शेखपुरा",
    "cities": [
      {
        "slug": "sheikhpura",
        "name": "शेखपुरा"
      }
    ]
  },
  {
    "slug": "sheohar",
    "name": "शिवहर",
    "cities": [
      {
        "slug": "sheohar",
        "name": "शिवहर"
      }
    ]
  },
  {
    "slug": "sitamarhi",
    "name": "सीतामढ़ी",
    "cities": [
      {
        "slug": "sitamarhi",
        "name": "सीतामढ़ी"
      },
      {
        "slug": "pupri",
        "name": "पुपरी"
      },
      {
        "slug": "belsand",
        "name": "बेलसंड"
      }
    ]
  },
  {
    "slug": "siwan",
    "name": "सीवान",
    "cities": [
      {
        "slug": "siwan",
        "name": "सीवान"
      },
      {
        "slug": "maharajganj",
        "name": "महाराजगंज"
      }
    ]
  },
  {
    "slug": "supaul",
    "name": "सुपौल",
    "cities": [
      {
        "slug": "supaul",
        "name": "सुपौल"
      },
      {
        "slug": "nirmali",
        "name": "निर्मली"
      },
      {
        "slug": "triveniganj",
        "name": "त्रिवेणीगंज"
      }
    ]
  },
  {
    "slug": "vaishali",
    "name": "वैशाली",
    "cities": [
      {
        "slug": "hajipur",
        "name": "हाजीपुर"
      },
      {
        "slug": "mahua",
        "name": "महुआ"
      },
      {
        "slug": "mahnar",
        "name": "महनार"
      }
    ]
  },
  {
    "slug": "west-champaran",
    "name": "पश्चिमी चंपारण",
    "cities": [
      {
        "slug": "bettiah",
        "name": "बेतिया"
      },
      {
        "slug": "bagaha",
        "name": "बगहा"
      },
      {
        "slug": "narkatiaganj",
        "name": "नरकटियागंज"
      }
    ]
  }
];

export const districtTag = (slug: string) => `जिला:${slug}`;
export const cityTag = (slug: string) => `शहर:${slug}`;
export function findDistrict(slug: string | undefined): District | undefined {
  return BIHAR_DISTRICTS.find((district) => district.slug === slug);
}
export function isValidCity(district: District | undefined, city: string | undefined) {
  return !city || !!district?.cities.some((candidate) => candidate.slug === city);
}
