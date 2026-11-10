/**
 * Universal Typography Registry & Font Loader for AI Chartor
 * 
 * Provides a single source of truth for:
 * 1. Curated font families (Google Fonts + Standard System Fonts)
 * 2. Proper CSS font-family strings with fallbacks
 * 3. Dynamic Google Font loading via the CSS Font Loading API
 * 4. Standardized numeric font weights (300 - 900)
 */

export interface FontFamilyOption {
  id: string
  label: string
  value: string
  category: 'sans-serif' | 'serif' | 'display' | 'monospace' | 'handwriting'
  isGoogleFont: boolean
  googleFontName?: string
  weights?: number[]
  aliases?: string[]
}

export interface FontWeightOption {
  label: string
  value: string
  numeric: number
}

// ── Standard Numeric Font Weights ─────────────────────────────
export const FONT_WEIGHT_OPTIONS: FontWeightOption[] = [
  { label: 'Light (300)', value: '300', numeric: 300 },
  { label: 'Regular (400)', value: '400', numeric: 400 },
  { label: 'Medium (500)', value: '500', numeric: 500 },
  { label: 'Semi Bold (600)', value: '600', numeric: 600 },
  { label: 'Bold (700)', value: '700', numeric: 700 },
  { label: 'Extra Bold (800)', value: '800', numeric: 800 },
  { label: 'Black (900)', value: '900', numeric: 900 },
]

/**
 * Normalizes any font weight (numeric or descriptive) to a standard numeric string ('300'-'900').
 */
export function normalizeFontWeight(input?: string | number): string {
  if (input === undefined || input === null || input === '') return '400'
  const str = String(input).trim().toLowerCase()
  if (str === 'normal' || str === 'regular') return '400'
  if (str === 'bold') return '700'
  if (str === 'bolder' || str === 'black' || str === 'heavy') return '900'
  if (str === 'lighter' || str === 'light') return '300'
  if (str === 'medium') return '500'
  if (str === 'semibold' || str === 'semi-bold' || str === 'demibold') return '600'
  if (str === 'extrabold' || str === 'extra-bold') return '800'
  if (str === 'thin') return '300'
  if (str === 'extralight' || str === 'extra-light') return '300'

  const num = parseInt(str, 10)
  if (!isNaN(num)) {
    const closest = FONT_WEIGHT_OPTIONS.reduce((prev, curr) =>
      Math.abs(curr.numeric - num) < Math.abs(prev.numeric - num) ? curr : prev
    )
    return closest.value
  }
  return '400'
}

// ── Unified Font Families Registry ────────────────────────────
export const UNIFIED_FONT_FAMILIES: FontFamilyOption[] = [
  {
    "id": "default",
    "label": "Default",
    "value": "default",
    "category": "sans-serif",
    "isGoogleFont": false,
    "aliases": [
      "inherit",
      "initial"
    ]
  },
  {
    "id": "inter",
    "label": "Inter",
    "value": "'Inter', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Inter",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "inter"
    ]
  },
  {
    "id": "roboto",
    "label": "Roboto",
    "value": "'Roboto', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Roboto",
    "weights": [
      300,
      400,
      500,
      700,
      900
    ],
    "aliases": [
      "roboto"
    ]
  },
  {
    "id": "poppins",
    "label": "Poppins",
    "value": "'Poppins', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Poppins",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "poppins"
    ]
  },
  {
    "id": "open-sans",
    "label": "Open Sans",
    "value": "'Open Sans', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Open Sans",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "aliases": [
      "open sans",
      "opensans"
    ]
  },
  {
    "id": "plus-jakarta-sans",
    "label": "Plus Jakarta Sans",
    "value": "'Plus Jakarta Sans', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Plus Jakarta Sans",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "aliases": [
      "plus jakarta sans",
      "plusjakartasans",
      "jakarta sans"
    ]
  },
  {
    "id": "lato",
    "label": "Lato",
    "value": "'Lato', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Lato",
    "weights": [
      300,
      400,
      700,
      900
    ],
    "aliases": [
      "lato"
    ]
  },
  {
    "id": "montserrat",
    "label": "Montserrat",
    "value": "'Montserrat', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Montserrat",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "montserrat"
    ]
  },
  {
    "id": "outfit",
    "label": "Outfit",
    "value": "'Outfit', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Outfit",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "outfit"
    ]
  },
  {
    "id": "dm-sans",
    "label": "DM Sans",
    "value": "'DM Sans', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "DM Sans",
    "weights": [
      400,
      500,
      700
    ],
    "aliases": [
      "dm sans",
      "dmsans"
    ]
  },
  {
    "id": "space-grotesk",
    "label": "Space Grotesk",
    "value": "'Space Grotesk', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Space Grotesk",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "aliases": [
      "space grotesk",
      "spacegrotesk"
    ]
  },
  {
    "id": "raleway",
    "label": "Raleway",
    "value": "'Raleway', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Raleway",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "raleway"
    ]
  },
  {
    "id": "nunito",
    "label": "Nunito",
    "value": "'Nunito', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Nunito",
    "weights": [
      300,
      400,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "nunito"
    ]
  },
  {
    "id": "cabin",
    "label": "Cabin",
    "value": "'Cabin', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Cabin",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "aliases": [
      "cabin"
    ]
  },
  {
    "id": "ubuntu",
    "label": "Ubuntu",
    "value": "'Ubuntu', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Ubuntu",
    "weights": [
      300,
      400,
      500,
      700
    ],
    "aliases": [
      "ubuntu"
    ]
  },
  {
    "id": "source-sans-3",
    "label": "Source Sans 3",
    "value": "'Source Sans 3', 'Source Sans Pro', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Source Sans 3",
    "weights": [
      300,
      400,
      600,
      700,
      900
    ],
    "aliases": [
      "source-sans-pro",
      "source sans pro",
      "source sans 3"
    ]
  },
  {
    "id": "work-sans",
    "label": "Work Sans",
    "value": "'Work Sans', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Work Sans",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "aliases": [
      "work sans",
      "worksans"
    ]
  },
  {
    "id": "manrope",
    "label": "Manrope",
    "value": "'Manrope', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Manrope",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "aliases": [
      "manrope"
    ]
  },
  {
    "id": "lexend",
    "label": "Lexend",
    "value": "'Lexend', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Lexend",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "aliases": [
      "lexend"
    ]
  },
  {
    "id": "rubik",
    "label": "Rubik",
    "value": "'Rubik', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Rubik",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "rubik"
    ]
  },
  {
    "id": "quicksand",
    "label": "Quicksand",
    "value": "'Quicksand', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Quicksand",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "aliases": [
      "quicksand"
    ]
  },
  {
    "id": "figtree",
    "label": "Figtree",
    "value": "'Figtree', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Figtree",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "figtree"
    ]
  },
  {
    "id": "albert-sans",
    "label": "Albert Sans",
    "value": "'Albert Sans', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Albert Sans",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "aliases": [
      "albert sans",
      "albertsans"
    ]
  },
  {
    "id": "urbanist",
    "label": "Urbanist",
    "value": "'Urbanist', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Urbanist",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "urbanist"
    ]
  },
  {
    "id": "jost",
    "label": "Jost",
    "value": "'Jost', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Jost",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "jost"
    ]
  },
  {
    "id": "be-vietnam-pro",
    "label": "Be Vietnam Pro",
    "value": "'Be Vietnam Pro', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Be Vietnam Pro",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "aliases": [
      "be vietnam pro",
      "bevietnampro"
    ]
  },
  {
    "id": "red-hat-display",
    "label": "Red Hat Display",
    "value": "'Red Hat Display', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Red Hat Display",
    "weights": [
      400,
      500,
      600,
      700,
      900
    ],
    "aliases": [
      "red hat display",
      "redhatdisplay"
    ]
  },
  {
    "id": "barlow",
    "label": "Barlow",
    "value": "'Barlow', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Barlow",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "aliases": [
      "barlow"
    ]
  },
  {
    "id": "karla",
    "label": "Karla",
    "value": "'Karla', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Karla",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "aliases": [
      "karla"
    ]
  },
  {
    "id": "mulish",
    "label": "Mulish",
    "value": "'Mulish', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Mulish",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "mulish"
    ]
  },
  {
    "id": "overpass",
    "label": "Overpass",
    "value": "'Overpass', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Overpass",
    "weights": [
      300,
      400,
      600,
      700,
      800
    ],
    "aliases": [
      "overpass"
    ]
  },
  {
    "id": "kanit",
    "label": "Kanit",
    "value": "'Kanit', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Kanit",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "aliases": [
      "kanit"
    ]
  },
  {
    "id": "arial",
    "label": "Arial",
    "value": "Arial, 'Helvetica Neue', Helvetica, sans-serif",
    "category": "sans-serif",
    "isGoogleFont": false,
    "aliases": [
      "arial"
    ]
  },
  {
    "id": "helvetica",
    "label": "Helvetica",
    "value": "'Helvetica Neue', Helvetica, Arial, sans-serif",
    "category": "sans-serif",
    "isGoogleFont": false,
    "aliases": [
      "helvetica",
      "helvetica neue"
    ]
  },
  {
    "id": "playfair-display",
    "label": "Playfair Display",
    "value": "'Playfair Display', Georgia, serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "Playfair Display",
    "weights": [
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "playfair display",
      "playfairdisplay"
    ]
  },
  {
    "id": "merriweather",
    "label": "Merriweather",
    "value": "'Merriweather', Georgia, serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "Merriweather",
    "weights": [
      300,
      400,
      700,
      900
    ],
    "aliases": [
      "merriweather"
    ]
  },
  {
    "id": "lora",
    "label": "Lora",
    "value": "'Lora', Georgia, serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "Lora",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "aliases": [
      "lora"
    ]
  },
  {
    "id": "pt-serif",
    "label": "PT Serif",
    "value": "'PT Serif', Georgia, serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "PT Serif",
    "weights": [
      400,
      700
    ],
    "aliases": [
      "pt serif",
      "ptserif"
    ]
  },
  {
    "id": "cormorant-garamond",
    "label": "Cormorant Garamond",
    "value": "'Cormorant Garamond', Georgia, serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "Cormorant Garamond",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "aliases": [
      "cormorant garamond",
      "cormorantgaramond"
    ]
  },
  {
    "id": "cinzel",
    "label": "Cinzel",
    "value": "'Cinzel', serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "Cinzel",
    "weights": [
      400,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "cinzel"
    ]
  },
  {
    "id": "libre-baskerville",
    "label": "Libre Baskerville",
    "value": "'Libre Baskerville', Georgia, serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "Libre Baskerville",
    "weights": [
      400,
      700
    ],
    "aliases": [
      "libre baskerville",
      "librebaskerville"
    ]
  },
  {
    "id": "eb-garamond",
    "label": "EB Garamond",
    "value": "'EB Garamond', Georgia, serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "EB Garamond",
    "weights": [
      400,
      500,
      600,
      700,
      800
    ],
    "aliases": [
      "eb garamond",
      "ebgaramond"
    ]
  },
  {
    "id": "bodoni-moda",
    "label": "Bodoni Moda",
    "value": "'Bodoni Moda', serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "Bodoni Moda",
    "weights": [
      400,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "bodoni moda",
      "bodonimoda"
    ]
  },
  {
    "id": "crimson-text",
    "label": "Crimson Text",
    "value": "'Crimson Text', Georgia, serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "Crimson Text",
    "weights": [
      400,
      600,
      700
    ],
    "aliases": [
      "crimson text",
      "crimsontext"
    ]
  },
  {
    "id": "bitter",
    "label": "Bitter",
    "value": "'Bitter', serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "Bitter",
    "weights": [
      300,
      400,
      600,
      700,
      800
    ],
    "aliases": [
      "bitter"
    ]
  },
  {
    "id": "dm-serif-display",
    "label": "DM Serif Display",
    "value": "'DM Serif Display', serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "DM Serif Display",
    "weights": [
      400
    ],
    "aliases": [
      "dm serif display",
      "dmserifdisplay"
    ]
  },
  {
    "id": "fraunces",
    "label": "Fraunces",
    "value": "'Fraunces', serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "Fraunces",
    "weights": [
      300,
      400,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "fraunces"
    ]
  },
  {
    "id": "prata",
    "label": "Prata",
    "value": "'Prata', serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "Prata",
    "weights": [
      400
    ],
    "aliases": [
      "prata"
    ]
  },
  {
    "id": "newsreader",
    "label": "Newsreader",
    "value": "'Newsreader', serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "Newsreader",
    "weights": [
      300,
      400,
      600,
      700
    ],
    "aliases": [
      "newsreader"
    ]
  },
  {
    "id": "marcellus",
    "label": "Marcellus",
    "value": "'Marcellus', serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "Marcellus",
    "weights": [
      400
    ],
    "aliases": [
      "marcellus"
    ]
  },
  {
    "id": "spectral",
    "label": "Spectral",
    "value": "'Spectral', serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "Spectral",
    "weights": [
      300,
      400,
      600,
      700
    ],
    "aliases": [
      "spectral"
    ]
  },
  {
    "id": "cardo",
    "label": "Cardo",
    "value": "'Cardo', serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "Cardo",
    "weights": [
      400,
      700
    ],
    "aliases": [
      "cardo"
    ]
  },
  {
    "id": "vollkorn",
    "label": "Vollkorn",
    "value": "'Vollkorn', serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "Vollkorn",
    "weights": [
      400,
      600,
      700,
      900
    ],
    "aliases": [
      "vollkorn"
    ]
  },
  {
    "id": "domine",
    "label": "Domine",
    "value": "'Domine', serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "Domine",
    "weights": [
      400,
      600,
      700
    ],
    "aliases": [
      "domine"
    ]
  },
  {
    "id": "georgia",
    "label": "Georgia",
    "value": "Georgia, 'Times New Roman', Times, serif",
    "category": "serif",
    "isGoogleFont": false,
    "aliases": [
      "georgia"
    ]
  },
  {
    "id": "bebas-neue",
    "label": "Bebas Neue",
    "value": "'Bebas Neue', sans-serif",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Bebas Neue",
    "weights": [
      400
    ],
    "aliases": [
      "bebas neue",
      "bebasneue"
    ]
  },
  {
    "id": "oswald",
    "label": "Oswald",
    "value": "'Oswald', sans-serif",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Oswald",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "aliases": [
      "oswald"
    ]
  },
  {
    "id": "anton",
    "label": "Anton",
    "value": "'Anton', sans-serif",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Anton",
    "weights": [
      400
    ],
    "aliases": [
      "anton"
    ]
  },
  {
    "id": "bangers",
    "label": "Bangers",
    "value": "'Bangers', cursive",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Bangers",
    "weights": [
      400
    ],
    "aliases": [
      "bangers"
    ]
  },
  {
    "id": "bungee",
    "label": "Bungee",
    "value": "'Bungee', cursive",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Bungee",
    "weights": [
      400
    ],
    "aliases": [
      "bungee"
    ]
  },
  {
    "id": "righteous",
    "label": "Righteous",
    "value": "'Righteous', cursive",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Righteous",
    "weights": [
      400
    ],
    "aliases": [
      "righteous"
    ]
  },
  {
    "id": "alfa-slab-one",
    "label": "Alfa Slab One",
    "value": "'Alfa Slab One', serif",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Alfa Slab One",
    "weights": [
      400
    ],
    "aliases": [
      "alfa slab one",
      "alfaslabone"
    ]
  },
  {
    "id": "fredoka",
    "label": "Fredoka",
    "value": "'Fredoka', sans-serif",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Fredoka",
    "weights": [
      400,
      600,
      700
    ],
    "aliases": [
      "fredoka"
    ]
  },
  {
    "id": "syne",
    "label": "Syne",
    "value": "'Syne', sans-serif",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Syne",
    "weights": [
      400,
      600,
      700,
      800
    ],
    "aliases": [
      "syne"
    ]
  },
  {
    "id": "archivo-black",
    "label": "Archivo Black",
    "value": "'Archivo Black', sans-serif",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Archivo Black",
    "weights": [
      400
    ],
    "aliases": [
      "archivo black",
      "archivoblack"
    ]
  },
  {
    "id": "abril-fatface",
    "label": "Abril Fatface",
    "value": "'Abril Fatface', serif",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Abril Fatface",
    "weights": [
      400
    ],
    "aliases": [
      "abril fatface",
      "abrilfatface"
    ]
  },
  {
    "id": "shrikhand",
    "label": "Shrikhand",
    "value": "'Shrikhand', cursive",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Shrikhand",
    "weights": [
      400
    ],
    "aliases": [
      "shrikhand"
    ]
  },
  {
    "id": "paytone-one",
    "label": "Paytone One",
    "value": "'Paytone One', sans-serif",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Paytone One",
    "weights": [
      400
    ],
    "aliases": [
      "paytone one",
      "paytoneone"
    ]
  },
  {
    "id": "titan-one",
    "label": "Titan One",
    "value": "'Titan One', cursive",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Titan One",
    "weights": [
      400
    ],
    "aliases": [
      "titan one",
      "titanone"
    ]
  },
  {
    "id": "passion-one",
    "label": "Passion One",
    "value": "'Passion One', cursive",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Passion One",
    "weights": [
      400,
      700,
      900
    ],
    "aliases": [
      "passion one",
      "passionone"
    ]
  },
  {
    "id": "rowdies",
    "label": "Rowdies",
    "value": "'Rowdies', cursive",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Rowdies",
    "weights": [
      300,
      400,
      700
    ],
    "aliases": [
      "rowdies"
    ]
  },
  {
    "id": "russo-one",
    "label": "Russo One",
    "value": "'Russo One', sans-serif",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Russo One",
    "weights": [
      400
    ],
    "aliases": [
      "russo one",
      "russoone"
    ]
  },
  {
    "id": "black-ops-one",
    "label": "Black Ops One",
    "value": "'Black Ops One', cursive",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Black Ops One",
    "weights": [
      400
    ],
    "aliases": [
      "black ops one",
      "blackopsone"
    ]
  },
  {
    "id": "monoton",
    "label": "Monoton",
    "value": "'Monoton', cursive",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Monoton",
    "weights": [
      400
    ],
    "aliases": [
      "monoton"
    ]
  },
  {
    "id": "lobster",
    "label": "Lobster",
    "value": "'Lobster', cursive",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Lobster",
    "weights": [
      400
    ],
    "aliases": [
      "lobster"
    ]
  },
  {
    "id": "staatliches",
    "label": "Staatliches",
    "value": "'Staatliches', cursive",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Staatliches",
    "weights": [
      400
    ],
    "aliases": [
      "staatliches"
    ]
  },
  {
    "id": "orbitron",
    "label": "Orbitron",
    "value": "'Orbitron', sans-serif",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Orbitron",
    "weights": [
      400,
      600,
      700,
      900
    ],
    "aliases": [
      "orbitron"
    ]
  },
  {
    "id": "audiowide",
    "label": "Audiowide",
    "value": "'Audiowide', cursive",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Audiowide",
    "weights": [
      400
    ],
    "aliases": [
      "audiowide"
    ]
  },
  {
    "id": "special-elite",
    "label": "Special Elite",
    "value": "'Special Elite', cursive",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Special Elite",
    "weights": [
      400
    ],
    "aliases": [
      "special elite",
      "specialelite"
    ]
  },
  {
    "id": "caveat",
    "label": "Caveat",
    "value": "'Caveat', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Caveat",
    "weights": [
      400,
      600,
      700
    ],
    "aliases": [
      "caveat"
    ]
  },
  {
    "id": "pacifico",
    "label": "Pacifico",
    "value": "'Pacifico', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Pacifico",
    "weights": [
      400
    ],
    "aliases": [
      "pacifico"
    ]
  },
  {
    "id": "kalam",
    "label": "Kalam",
    "value": "'Kalam', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Kalam",
    "weights": [
      400,
      700
    ],
    "aliases": [
      "kalam"
    ]
  },
  {
    "id": "permanent-marker",
    "label": "Permanent Marker",
    "value": "'Permanent Marker', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Permanent Marker",
    "weights": [
      400
    ],
    "aliases": [
      "permanent marker",
      "permanentmarker"
    ]
  },
  {
    "id": "rock-salt",
    "label": "Rock Salt",
    "value": "'Rock Salt', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Rock Salt",
    "weights": [
      400
    ],
    "aliases": [
      "rock salt",
      "rocksalt"
    ]
  },
  {
    "id": "shadows-into-light",
    "label": "Shadows Into Light",
    "value": "'Shadows Into Light', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Shadows Into Light",
    "weights": [
      400
    ],
    "aliases": [
      "shadows into light",
      "shadowsintolight"
    ]
  },
  {
    "id": "indie-flower",
    "label": "Indie Flower",
    "value": "'Indie Flower', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Indie Flower",
    "weights": [
      400
    ],
    "aliases": [
      "indie flower",
      "indieflower"
    ]
  },
  {
    "id": "satisfy",
    "label": "Satisfy",
    "value": "'Satisfy', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Satisfy",
    "weights": [
      400
    ],
    "aliases": [
      "satisfy"
    ]
  },
  {
    "id": "dancing-script",
    "label": "Dancing Script",
    "value": "'Dancing Script', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Dancing Script",
    "weights": [
      400,
      600,
      700
    ],
    "aliases": [
      "dancing script",
      "dancingscript"
    ]
  },
  {
    "id": "sacramento",
    "label": "Sacramento",
    "value": "'Sacramento', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Sacramento",
    "weights": [
      400
    ],
    "aliases": [
      "sacramento"
    ]
  },
  {
    "id": "great-vibes",
    "label": "Great Vibes",
    "value": "'Great Vibes', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Great Vibes",
    "weights": [
      400
    ],
    "aliases": [
      "great vibes",
      "greatvibes"
    ]
  },
  {
    "id": "yellowtail",
    "label": "Yellowtail",
    "value": "'Yellowtail', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Yellowtail",
    "weights": [
      400
    ],
    "aliases": [
      "yellowtail"
    ]
  },
  {
    "id": "covered-by-your-grace",
    "label": "Covered By Your Grace",
    "value": "'Covered By Your Grace', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Covered By Your Grace",
    "weights": [
      400
    ],
    "aliases": [
      "covered by your grace",
      "coveredbyyourgrace"
    ]
  },
  {
    "id": "homemade-apple",
    "label": "Homemade Apple",
    "value": "'Homemade Apple', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Homemade Apple",
    "weights": [
      400
    ],
    "aliases": [
      "homemade apple",
      "homemadeapple"
    ]
  },
  {
    "id": "patrick-hand",
    "label": "Patrick Hand",
    "value": "'Patrick Hand', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Patrick Hand",
    "weights": [
      400
    ],
    "aliases": [
      "patrick hand",
      "patrickhand"
    ]
  },
  {
    "id": "gochi-hand",
    "label": "Gochi Hand",
    "value": "'Gochi Hand', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Gochi Hand",
    "weights": [
      400
    ],
    "aliases": [
      "gochi hand",
      "gochihand"
    ]
  },
  {
    "id": "amatic-sc",
    "label": "Amatic SC",
    "value": "'Amatic SC', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Amatic SC",
    "weights": [
      400,
      700
    ],
    "aliases": [
      "amatic sc",
      "amaticsc"
    ]
  },
  {
    "id": "alex-brush",
    "label": "Alex Brush",
    "value": "'Alex Brush', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Alex Brush",
    "weights": [
      400
    ],
    "aliases": [
      "alex brush",
      "alexbrush"
    ]
  },
  {
    "id": "parisienne",
    "label": "Parisienne",
    "value": "'Parisienne', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Parisienne",
    "weights": [
      400
    ],
    "aliases": [
      "parisienne"
    ]
  },
  {
    "id": "courgette",
    "label": "Courgette",
    "value": "'Courgette', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Courgette",
    "weights": [
      400
    ],
    "aliases": [
      "courgette"
    ]
  },
  {
    "id": "jetbrains-mono",
    "label": "JetBrains Mono",
    "value": "'JetBrains Mono', monospace",
    "category": "monospace",
    "isGoogleFont": true,
    "googleFontName": "JetBrains Mono",
    "weights": [
      300,
      400,
      500,
      700
    ],
    "aliases": [
      "jetbrains mono",
      "jetbrainsmono"
    ]
  },
  {
    "id": "fira-code",
    "label": "Fira Code",
    "value": "'Fira Code', monospace",
    "category": "monospace",
    "isGoogleFont": true,
    "googleFontName": "Fira Code",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "aliases": [
      "fira code",
      "firacode"
    ]
  },
  {
    "id": "roboto-mono",
    "label": "Roboto Mono",
    "value": "'Roboto Mono', monospace",
    "category": "monospace",
    "isGoogleFont": true,
    "googleFontName": "Roboto Mono",
    "weights": [
      300,
      400,
      500,
      700
    ],
    "aliases": [
      "roboto mono",
      "robotomono"
    ]
  },
  {
    "id": "space-mono",
    "label": "Space Mono",
    "value": "'Space Mono', monospace",
    "category": "monospace",
    "isGoogleFont": true,
    "googleFontName": "Space Mono",
    "weights": [
      400,
      700
    ],
    "aliases": [
      "space mono",
      "spacemono"
    ]
  },
  {
    "id": "inconsolata",
    "label": "Inconsolata",
    "value": "'Inconsolata', monospace",
    "category": "monospace",
    "isGoogleFont": true,
    "googleFontName": "Inconsolata",
    "weights": [
      300,
      400,
      600,
      700
    ],
    "aliases": [
      "inconsolata"
    ]
  },
  {
    "id": "source-code-pro",
    "label": "Source Code Pro",
    "value": "'Source Code Pro', monospace",
    "category": "monospace",
    "isGoogleFont": true,
    "googleFontName": "Source Code Pro",
    "weights": [
      300,
      400,
      600,
      700
    ],
    "aliases": [
      "source code pro",
      "sourcecodepro"
    ]
  },
  {
    "id": "ibm-plex-mono",
    "label": "IBM Plex Mono",
    "value": "'IBM Plex Mono', monospace",
    "category": "monospace",
    "isGoogleFont": true,
    "googleFontName": "IBM Plex Mono",
    "weights": [
      300,
      400,
      600,
      700
    ],
    "aliases": [
      "ibm plex mono",
      "ibmplexmono"
    ]
  },
  {
    "id": "share-tech-mono",
    "label": "Share Tech Mono",
    "value": "'Share Tech Mono', monospace",
    "category": "monospace",
    "isGoogleFont": true,
    "googleFontName": "Share Tech Mono",
    "weights": [
      400
    ],
    "aliases": [
      "share tech mono",
      "sharetechmono"
    ]
  },
  {
    "id": "courier-prime",
    "label": "Courier Prime",
    "value": "'Courier Prime', monospace",
    "category": "monospace",
    "isGoogleFont": true,
    "googleFontName": "Courier Prime",
    "weights": [
      400,
      700
    ],
    "aliases": [
      "courier prime",
      "courierprime"
    ]
  },
  {
    "id": "dm-mono",
    "label": "DM Mono",
    "value": "'DM Mono', monospace",
    "category": "monospace",
    "isGoogleFont": true,
    "googleFontName": "DM Mono",
    "weights": [
      400,
      500
    ],
    "aliases": [
      "dm mono",
      "dmmono"
    ]
  },
  {
    "id": "vt323",
    "label": "VT323 (Retro Terminal)",
    "value": "'VT323', monospace",
    "category": "monospace",
    "isGoogleFont": true,
    "googleFontName": "VT323",
    "weights": [
      400
    ],
    "aliases": [
      "vt323"
    ]
  },
  {
    "id": "courier-new",
    "label": "Courier New",
    "value": "'Courier New', Courier, monospace",
    "category": "monospace",
    "isGoogleFont": false,
    "aliases": [
      "courier new",
      "courier"
    ]
  },
  {
    "id": "times-new-roman",
    "label": "Times New Roman",
    "value": "'Times New Roman', Times, Georgia, serif",
    "category": "serif",
    "isGoogleFont": false,
    "aliases": [
      "times new roman",
      "times",
      "timesnewroman",
      "tnr"
    ]
  },
  {
    "id": "garamond",
    "label": "Garamond",
    "value": "Garamond, Baskerville, 'Times New Roman', serif",
    "category": "serif",
    "isGoogleFont": false,
    "aliases": [
      "garamond"
    ]
  },
  {
    "id": "palatino",
    "label": "Palatino",
    "value": "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    "category": "serif",
    "isGoogleFont": false,
    "aliases": [
      "palatino",
      "palatino linotype"
    ]
  },
  {
    "id": "verdana",
    "label": "Verdana",
    "value": "Verdana, Geneva, Tahoma, sans-serif",
    "category": "sans-serif",
    "isGoogleFont": false,
    "aliases": [
      "verdana"
    ]
  },
  {
    "id": "trebuchet-ms",
    "label": "Trebuchet MS",
    "value": "'Trebuchet MS', 'Lucida Sans Unicode', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": false,
    "aliases": [
      "trebuchet ms",
      "trebuchet"
    ]
  },
  {
    "id": "tahoma",
    "label": "Tahoma",
    "value": "Tahoma, Verdana, Segoe, sans-serif",
    "category": "sans-serif",
    "isGoogleFont": false,
    "aliases": [
      "tahoma"
    ]
  },
  {
    "id": "segoe-ui",
    "label": "Segoe UI",
    "value": "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    "category": "sans-serif",
    "isGoogleFont": false,
    "aliases": [
      "segoe ui",
      "segoe"
    ]
  },
  {
    "id": "impact",
    "label": "Impact",
    "value": "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
    "category": "display",
    "isGoogleFont": false,
    "aliases": [
      "impact"
    ]
  },
  {
    "id": "comic-sans-ms",
    "label": "Comic Sans MS",
    "value": "'Comic Sans MS', 'Comic Sans', cursive, sans-serif",
    "category": "handwriting",
    "isGoogleFont": false,
    "aliases": [
      "comic sans",
      "comic sans ms",
      "comicsans"
    ]
  },
  {
    "id": "lucida-console",
    "label": "Lucida Console",
    "value": "'Lucida Console', Monaco, monospace",
    "category": "monospace",
    "isGoogleFont": false,
    "aliases": [
      "lucida console",
      "lucidaconsole"
    ]
  },
  {
    "id": "roboto-condensed",
    "label": "Roboto Condensed",
    "value": "'Roboto Condensed', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Roboto Condensed",
    "weights": [
      100,
      200,
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "roboto condensed",
      "robotocondensed"
    ]
  },
  {
    "id": "roboto-slab",
    "label": "Roboto Slab",
    "value": "'Roboto Slab', Georgia, serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "Roboto Slab",
    "weights": [
      100,
      200,
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "roboto slab",
      "robotoslab"
    ]
  },
  {
    "id": "pt-sans",
    "label": "PT Sans",
    "value": "'PT Sans', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "PT Sans",
    "weights": [
      400,
      700
    ],
    "aliases": [
      "pt sans",
      "ptsans"
    ]
  },
  {
    "id": "noto-sans",
    "label": "Noto Sans",
    "value": "'Noto Sans', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Noto Sans",
    "weights": [
      100,
      200,
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "noto sans",
      "notosans"
    ]
  },
  {
    "id": "noto-serif",
    "label": "Noto Serif",
    "value": "'Noto Serif', Georgia, serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "Noto Serif",
    "weights": [
      100,
      200,
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "noto serif",
      "notoserif"
    ]
  },
  {
    "id": "fira-sans",
    "label": "Fira Sans",
    "value": "'Fira Sans', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Fira Sans",
    "weights": [
      100,
      200,
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "fira sans",
      "firasans"
    ]
  },
  {
    "id": "barlow-condensed",
    "label": "Barlow Condensed",
    "value": "'Barlow Condensed', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Barlow Condensed",
    "weights": [
      100,
      200,
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "barlow condensed",
      "barlowcondensed"
    ]
  },
  {
    "id": "titillium-web",
    "label": "Titillium Web",
    "value": "'Titillium Web', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Titillium Web",
    "weights": [
      200,
      300,
      400,
      600,
      700,
      900
    ],
    "aliases": [
      "titillium web",
      "titilliumweb"
    ]
  },
  {
    "id": "josefin-sans",
    "label": "Josefin Sans",
    "value": "'Josefin Sans', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Josefin Sans",
    "weights": [
      100,
      200,
      300,
      400,
      500,
      600,
      700
    ],
    "aliases": [
      "josefin sans",
      "josefinsans"
    ]
  },
  {
    "id": "libre-franklin",
    "label": "Libre Franklin",
    "value": "'Libre Franklin', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Libre Franklin",
    "weights": [
      100,
      200,
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "libre franklin",
      "librefranklin"
    ]
  },
  {
    "id": "arimo",
    "label": "Arimo",
    "value": "'Arimo', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Arimo",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "aliases": [
      "arimo"
    ]
  },
  {
    "id": "dosis",
    "label": "Dosis",
    "value": "'Dosis', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Dosis",
    "weights": [
      200,
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "aliases": [
      "dosis"
    ]
  },
  {
    "id": "heebo",
    "label": "Heebo",
    "value": "'Heebo', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Heebo",
    "weights": [
      100,
      200,
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "heebo"
    ]
  },
  {
    "id": "oxygen",
    "label": "Oxygen",
    "value": "'Oxygen', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Oxygen",
    "weights": [
      300,
      400,
      700
    ],
    "aliases": [
      "oxygen"
    ]
  },
  {
    "id": "comfortaa",
    "label": "Comfortaa",
    "value": "'Comfortaa', cursive, sans-serif",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Comfortaa",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "aliases": [
      "comfortaa"
    ]
  },
  {
    "id": "exo-2",
    "label": "Exo 2",
    "value": "'Exo 2', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Exo 2",
    "weights": [
      100,
      200,
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "exo 2",
      "exo2"
    ]
  },
  {
    "id": "league-spartan",
    "label": "League Spartan",
    "value": "'League Spartan', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "League Spartan",
    "weights": [
      100,
      200,
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "league spartan",
      "leaguespartan"
    ]
  },
  {
    "id": "ibm-plex-sans",
    "label": "IBM Plex Sans",
    "value": "'IBM Plex Sans', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "IBM Plex Sans",
    "weights": [
      100,
      200,
      300,
      400,
      500,
      600,
      700
    ],
    "aliases": [
      "ibm plex sans",
      "ibmplexsans"
    ]
  },
  {
    "id": "ibm-plex-serif",
    "label": "IBM Plex Serif",
    "value": "'IBM Plex Serif', Georgia, serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "IBM Plex Serif",
    "weights": [
      100,
      200,
      300,
      400,
      500,
      600,
      700
    ],
    "aliases": [
      "ibm plex serif",
      "ibmplexserif"
    ]
  },
  {
    "id": "teko",
    "label": "Teko",
    "value": "'Teko', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Teko",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "aliases": [
      "teko"
    ]
  },
  {
    "id": "rajdhani",
    "label": "Rajdhani",
    "value": "'Rajdhani', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Rajdhani",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "aliases": [
      "rajdhani"
    ]
  },
  {
    "id": "allura",
    "label": "Allura",
    "value": "'Allura', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Allura",
    "weights": [
      400
    ],
    "aliases": [
      "allura"
    ]
  },
  {
    "id": "kaushan-script",
    "label": "Kaushan Script",
    "value": "'Kaushan Script', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Kaushan Script",
    "weights": [
      400
    ],
    "aliases": [
      "kaushan script",
      "kaushanscript"
    ]
  },
  {
    "id": "nunito-sans",
    "label": "Nunito Sans",
    "value": "'Nunito Sans', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Nunito Sans",
    "weights": [
      200,
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "nunito sans",
      "nunitosans"
    ]
  },
  {
    "id": "archivo",
    "label": "Archivo",
    "value": "'Archivo', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Archivo",
    "weights": [
      100,
      200,
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "archivo"
    ]
  },
  {
    "id": "bricolage-grotesque",
    "label": "Bricolage Grotesque",
    "value": "'Bricolage Grotesque', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Bricolage Grotesque",
    "weights": [
      200,
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "aliases": [
      "bricolage grotesque",
      "bricolagegrotesque"
    ]
  },
  {
    "id": "public-sans",
    "label": "Public Sans",
    "value": "'Public Sans', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Public Sans",
    "weights": [
      100,
      200,
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "public sans",
      "publicsans"
    ]
  },
  {
    "id": "geist",
    "label": "Geist",
    "value": "'Geist', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Geist",
    "weights": [
      100,
      200,
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "geist"
    ]
  },
  {
    "id": "geist-mono",
    "label": "Geist Mono",
    "value": "'Geist Mono', Monaco, monospace",
    "category": "monospace",
    "isGoogleFont": true,
    "googleFontName": "Geist Mono",
    "weights": [
      100,
      200,
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "geist mono",
      "geistmono"
    ]
  },
  {
    "id": "sora",
    "label": "Sora",
    "value": "'Sora', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Sora",
    "weights": [
      100,
      200,
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "aliases": [
      "sora"
    ]
  },
  {
    "id": "instrument-serif",
    "label": "Instrument Serif",
    "value": "'Instrument Serif', Georgia, serif",
    "category": "serif",
    "isGoogleFont": true,
    "googleFontName": "Instrument Serif",
    "weights": [
      400
    ],
    "aliases": [
      "instrument serif",
      "instrumentserif"
    ]
  },
  {
    "id": "instrument-sans",
    "label": "Instrument Sans",
    "value": "'Instrument Sans', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Instrument Sans",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "aliases": [
      "instrument sans",
      "instrumentsans"
    ]
  },
  {
    "id": "fjalla-one",
    "label": "Fjalla One",
    "value": "'Fjalla One', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Fjalla One",
    "weights": [
      400
    ],
    "aliases": [
      "fjalla one",
      "fjallaone"
    ]
  },
  {
    "id": "lobster-two",
    "label": "Lobster Two",
    "value": "'Lobster Two', cursive, sans-serif",
    "category": "display",
    "isGoogleFont": true,
    "googleFontName": "Lobster Two",
    "weights": [
      400,
      700
    ],
    "aliases": [
      "lobster two",
      "lobstertwo"
    ]
  },
  {
    "id": "cairo",
    "label": "Cairo",
    "value": "'Cairo', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Cairo",
    "weights": [
      200,
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "cairo"
    ]
  },
  {
    "id": "assistant",
    "label": "Assistant",
    "value": "'Assistant', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Assistant",
    "weights": [
      200,
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "aliases": [
      "assistant"
    ]
  },
  {
    "id": "epilogue",
    "label": "Epilogue",
    "value": "'Epilogue', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Epilogue",
    "weights": [
      100,
      200,
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "aliases": [
      "epilogue"
    ]
  },
  {
    "id": "merriweather-sans",
    "label": "Merriweather Sans",
    "value": "'Merriweather Sans', sans-serif",
    "category": "sans-serif",
    "isGoogleFont": true,
    "googleFontName": "Merriweather Sans",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "aliases": [
      "merriweather sans",
      "merriweathersans"
    ]
  },
  {
    "id": "zeyada",
    "label": "Zeyada",
    "value": "'Zeyada', cursive",
    "category": "handwriting",
    "isGoogleFont": true,
    "googleFontName": "Zeyada",
    "weights": [
      400
    ],
    "aliases": [
      "zeyada"
    ]
  }
]
// ── Cache for Loaded Fonts & Runtime Dynamic Registry ─────────
const loadedFontsCache = new Set<string>()
const DYNAMIC_FONT_REGISTRY = new Map<string, FontFamilyOption>()

/**
 * Registers a dynamic runtime font (e.g. from Google Fonts live search API).
 */
export function registerDynamicFont(font: FontFamilyOption) {
  DYNAMIC_FONT_REGISTRY.set(font.id, font)
  if (font.googleFontName) {
    DYNAMIC_FONT_REGISTRY.set(font.googleFontName.toLowerCase(), font)
  }
}

/**
 * Normalizes any font family input string to find the matching registry font.
 * Handles inputs like:
 * - "Space Grotesk"
 * - "'Space Grotesk', sans-serif"
 * - "Space Grotesk, sans-serif"
 * - "source-sans-pro" / "Source Sans Pro" / "source sans 3"
 * - "Arial"
 * - Dynamic fonts loaded via Google Fonts API
 */
export function findFontByInput(input?: string): FontFamilyOption | undefined {
  if (!input) return undefined
  const raw = input.trim()
  if (!raw || raw === 'default' || raw === 'inherit') {
    return UNIFIED_FONT_FAMILIES.find(f => f.id === 'default')
  }

  // 1. Exact value match (e.g. "'Inter', sans-serif")
  const directValueMatch = UNIFIED_FONT_FAMILIES.find(f => f.value.toLowerCase() === raw.toLowerCase())
  if (directValueMatch) return directValueMatch

  // Clean primary family name (e.g., "'Space Grotesk', sans-serif" -> "space grotesk")
  const cleaned = raw.split(',')[0].replace(/['"]/g, '').trim().toLowerCase()
  if (!cleaned) return undefined

  // 2. Exact match in standard registry
  const match = UNIFIED_FONT_FAMILIES.find(f =>
    f.id.toLowerCase() === cleaned ||
    f.label.toLowerCase() === cleaned ||
    f.googleFontName?.toLowerCase() === cleaned ||
    f.aliases?.some(alias => alias.toLowerCase() === cleaned)
  )
  if (match) return match

  // 3. Dynamic runtime registry match
  if (DYNAMIC_FONT_REGISTRY.has(cleaned)) {
    return DYNAMIC_FONT_REGISTRY.get(cleaned)
  }

  // 4. Substring matching in standard registry
  const subMatch = UNIFIED_FONT_FAMILIES.find(f =>
    cleaned.includes(f.label.toLowerCase()) ||
    f.aliases?.some(alias => cleaned.includes(alias.toLowerCase()))
  )
  if (subMatch) return subMatch

  // 5. On-the-fly dynamic font creation for any Google Font or system font
  const displayName = raw.split(',')[0].replace(/['"]/g, '').trim()
  if (displayName) {
    const dynamicFont: FontFamilyOption = {
      id: displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      label: displayName,
      value: raw.includes(',') ? raw : `'${displayName}', sans-serif`,
      category: 'sans-serif',
      isGoogleFont: true,
      googleFontName: displayName,
      weights: [400, 500, 600, 700],
    }
    registerDynamicFont(dynamicFont)
    return dynamicFont
  }
}

/**
 * Injects preconnect links for Google Fonts to accelerate DNS/TLS handshakes.
 */
function ensureGoogleFontPreconnect() {
  if (typeof document === 'undefined') return
  if (!document.getElementById('gf-preconnect-api')) {
    const l1 = document.createElement('link')
    l1.id = 'gf-preconnect-api'
    l1.rel = 'preconnect'
    l1.href = 'https://fonts.googleapis.com'
    document.head.appendChild(l1)

    const l2 = document.createElement('link')
    l2.id = 'gf-preconnect-static'
    l2.rel = 'preconnect'
    l2.crossOrigin = 'anonymous'
    l2.href = 'https://fonts.gstatic.com'
    document.head.appendChild(l2)
  }
}

/**
 * Ensures a Google Font stylesheet is injected and loaded into the browser.
 * Safe to call repeatedly; uses a cache to avoid redundant DOM operations.
 */
export async function ensureGoogleFontLoaded(fontInput?: string): Promise<boolean> {
  if (typeof window === 'undefined' || !fontInput || fontInput === 'default') {
    return true
  }

  const font = findFontByInput(fontInput)
  if (!font || !font.isGoogleFont || !font.googleFontName) {
    return true // System font or unknown, no network load needed
  }

  const fontName = font.googleFontName
  const cacheKey = fontName.toLowerCase()

  if (loadedFontsCache.has(cacheKey)) {
    return true
  }

  try {
    ensureGoogleFontPreconnect()

    const linkId = `google-font-${font.id}`
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      const encodedName = encodeURIComponent(fontName).replace(/%20/g, '+')
      if (font.weights && font.weights.length > 0) {
        link.href = `https://fonts.googleapis.com/css2?family=${encodedName}:wght@${font.weights.join(';')}&display=swap`
      } else {
        link.href = `https://fonts.googleapis.com/css2?family=${encodedName}&display=swap`
      }
      document.head.appendChild(link)
    }

    // Await document.fonts readiness for this specific family
    if ('fonts' in document && typeof (document.fonts as any).load === 'function') {
      await Promise.race([
        (document.fonts as any).load(`16px "${fontName}"`),
        new Promise(resolve => setTimeout(resolve, 1500)) // 1.5s timeout safety
      ])
    }

    loadedFontsCache.add(cacheKey)
    return true
  } catch (err) {
    console.warn(`[Typography] Failed to load Google Font "${fontName}":`, err)
    return false
  }
}

/**
 * Batch loads multiple font families simultaneously.
 */
export async function ensureFontsLoaded(fonts: (string | undefined)[]): Promise<void> {
  const promises = fonts.filter(Boolean).map(f => ensureGoogleFontLoaded(f))
  await Promise.all(promises)
}

