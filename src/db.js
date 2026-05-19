import { supabase } from './supabaseClient'

// ── SHARED HELPERS ────────────────────────────────────────────
// These are duplicated from ParcelComp.jsx so db.js can
// rehydrate records on load without a circular dependency.

const COUNTY_CODES = {
  "01":"ADAMS","02":"ALLEN","03":"BARTHOLOMEW","04":"BENTON","05":"BLACKFORD","06":"BOONE","07":"BROWN","08":"CARROLL",
  "09":"CASS","10":"CLARK","11":"CLAY","12":"CLINTON","13":"CRAWFORD","14":"DAVIESS","15":"DEARBORN","16":"DECATUR",
  "17":"DEKALB","18":"DELAWARE","19":"DUBOIS","20":"ELKHART","21":"FAYETTE","22":"FLOYD","23":"FOUNTAIN","24":"FRANKLIN",
  "25":"FULTON","26":"GIBSON","27":"GRANT","28":"GREENE","29":"HAMILTON","30":"HANCOCK","31":"HARRISON","32":"HENDRICKS",
  "33":"HENRY","34":"HOWARD","35":"HUNTINGTON","36":"JACKSON","37":"JASPER","38":"JAY","39":"JEFFERSON","40":"JENNINGS",
  "41":"JOHNSON","42":"KNOX","43":"KOSCIUSKO","44":"LAGRANGE","45":"LAKE","46":"LAPORTE","47":"LAWRENCE","48":"MADISON",
  "49":"MARION","50":"MARSHALL","51":"MARTIN","52":"MIAMI","53":"MONROE","54":"MONTGOMERY","55":"MORGAN","56":"NEWTON",
  "57":"NOBLE","58":"OHIO","59":"ORANGE","60":"OWEN","61":"PARKE","62":"PERRY","63":"PIKE","64":"PORTER","65":"POSEY",
  "66":"PULASKI","67":"PUTNAM","68":"RANDOLPH","69":"RIPLEY","70":"RUSH","71":"ST. JOSEPH","72":"SCOTT","73":"SHELBY",
  "74":"SPENCER","75":"STARKE","76":"STEUBEN","77":"SULLIVAN","78":"SWITZERLAND","79":"TIPPECANOE","80":"TIPTON",
  "81":"UNION","82":"VANDERBURGH","83":"VERMILLION","84":"VIGO","85":"WABASH","86":"WARREN","87":"WARRICK",
  "88":"WASHINGTON","89":"WAYNE","90":"WELLS","91":"WHITE","92":"WHITLEY",
}

const TAX_DISTRICTS = {
  "01_001":"NORTH BLUE CREEK TOWNSHIP","01_002":"SOUTH BLUE CREEK TOWNSHIP","01_003":"NORTH FRENCH TOWNSHIP",
  "02_038":"ABOITE TOWNSHIP (11)","02_039":"ADAMS TOWNSHIP (12)","02_040":"ADAMS TOWNSHIP-TRANSPORTATION",
  "03_001":"CLAY TOWNSHIP","03_002":"COLUMBUS CITY-CLAY TOWNSHIP","03_003":"CLIFTY TOWNSHIP",
  "04_001":"BOLIVAR TOWNSHIP","04_002":"OTTERBEIN (BOLIVAR)","04_003":"CENTER TOWNSHIP",
  "05_001":"HARRISON TOWNSHIP","05_002":"MONTPELIER CITY","05_003":"JACKSON TOWNSHIP",
  "06_001":"CENTER TOWNSHIP","06_002":"LEBANON CITY","06_003":"ULEN TOWN",
  "07_001":"HAMBLEN TOWNSHIP","07_002":"JACKSON TOWNSHIP","07_003":"VAN BUREN TOWNSHIP",
  "08_001":"ADAMS TWP","08_002":"BURLINGTON TOWNSHIP","08_003":"BURLINGTON (BURLINGTON)",
  "09_001":"ADAMS TOWNSHIP","09_002":"BETHLEHEM TOWNSHIP","09_003":"BOONE TOWNSHIP",
  "10_003":"CHARLESTOWN TWP","10_004":"CHARLESTOWN CITY","10_005":"JEFFERSONVILLE TWP-OFW",
  "11_001":"BRAZIL TOWNSHIP","11_002":"BRAZIL CITY - BRAZIL TOWNSHIP","11_003":"CASS TOWNSHIP",
  "12_001":"CENTER TOWNSHIP","12_003":"FOREST TOWNSHIP","12_004":"JACKSON TOWNSHIP",
  "13_001":"BOONE TOWNSHIP","13_002":"ALTON TOWN","13_003":"JENNINGS TOWNSHIP",
  "14_001":"BARR TOWNSHIP","14_002":"CANNELBURG TOWN","14_003":"MONTGOMERY TOWN",
  "15_001":"CAESAR CREEK TOWNSHIP","15_002":"CENTER TOWNSHIP","15_003":"AURORA CITY-CENTER TOWNSHIP",
  "16_001":"ADAMS TOWNSHIP","16_002":"ST. PAUL TOWN-ADAMS TOWNSHIP","16_003":"CLAY TOWNSHIP",
  "17_001":"BULTER TOWNSHIP","17_002":"CONCORD TOWNSHIP","17_003":"ST. JOE TOWN",
  "18_001":"CENTER TOWNSHIP","18_002":"CENTER TOWNSHIP - MUNCIE SANIT","18_003":"MUNCIE CITY - CENTER TOWNSHIP",
  "19_001":"BAINBRIDGE TOWNSHIP","19_002":"JASPER CITY","19_003":"BOONE TOWNSHIP",
  "20_001":"BAUGO TOWNSHIP","20_002":"ELKHART CITY-BAUGO TOWNSHIP","20_003":"BENTON TOWNSHIP",
  "21_001":"CONNERSVILLE CITY-CONNERSVILLE","21_002":"FAIRVIEW TOWNSHIP","21_003":"GLENWOOD TOWN-FAIRVIEW TOWNSHIP",
  "22_001":"GEORGETOWN TOWN","22_002":"GREENVILLE TOWNSHIP","22_003":"GREENVILLE TOWN",
  "23_001":"DAVIS TOWNSHIP","23_002":"FULTON TOWNSHIP","23_003":"JACKSON TOWNSHIP",
  "24_001":"BROOKVILLE TOWNSHIP","24_002":"BROOKVILLE TOWN","24_003":"BUTLER TOWNSHIP-EAST",
  "25_001":"AKRON TOWN","25_002":"LIBERTY TOWNSHIP","25_003":"FULTON TOWN",
  "26_001":"SOMERVILLE TOWN","26_002":"CENTER TOWNSHIP","26_003":"FRANCISCO TOWN",
  "27_001":"FAIRMONT TOWN","27_002":"FRANKLIN TOWNSHIP-MARION SCHOO","27_004":"FRANKLIN TOWNSHIP-OAK HILL SCH",
  "28_001":"NEWBERRY TOWN","28_002":"CENTER TOWNSHIP","28_003":"FAIRPLAY TOWNSHIP",
  "29_001":"CLAY TOWNSHIP","29_002":"DELAWARE TOWNSHIP","29_003":"FISHERS TOWN - DELAWARE TWP",
  "30_001":"SHIRLEY TOWN","30_002":"WILKINSON TOWN","30_003":"BUCK CREEK TOWNSHIP",
  "31_001":"LACONIA TOWN","31_002":"FRANKLIN TOWNSHIP","31_003":"LANESVILLE TOWN",
  "32_001":"EEL RIVER TOWNSHIP","32_002":"NORTH SALEM TOWN","32_003":"FRANKLIN TOWNSHIP",
  "33_001":"STRAUGHN TOWN","33_002":"FALL CREEK TOWNSHIP","33_003":"MIDDLETOWN TOWN",
  "34_001":"KOKOMO CITY - HARRISON TOWNSHIP","34_002":"KOKOMO CITY - HOWARD TOWNSHIP","34_003":"JACKSON TOWNSHIP",
  "35_001":"HUNTINGTON TOWNSHIP","35_002":"HUNTINGTON CITY","35_003":"JACKSON TOWNSHIP",
  "36_001":"MEDORA TOWN","36_002":"DRIFTWOOD TOWNSHIP","36_003":"GRASSY FORK TOWNSHIP",
  "37_002":"GILLAM TOWNSHIP","37_003":"HANGING GROVE TOWNSHIP","37_019":"JORDAN TOWNSHIP",
  "38_010":"BEARCREEK TOWNSHIP","38_011":"BRYANT TOWN","38_014":"GREENE TOWNSHIP",
  "39_001":"LANCASTER TOWNSHIP","39_002":"DUPONT TOWN","39_003":"MADISON TOWNSHIP",
  "40_001":"NORTH VERNON CITY","40_002":"COLUMBIA TOWNSHIP","40_003":"GENEVA TOWNSHIP",
  "41_001":"CLARK TOWNSHIP","41_002":"CLARK TOWNSHIP-NEEDHAM FPD","41_004":"CLARK TOWNSHIP-WHITELAND FPD",
  "42_001":"HARRISON TOWNSHIP","42_002":"MONROE CITY TOWN","42_003":"JOHNSON TOWNSHIP",
  "43_001":"ETNA GREEN TOWN","43_002":"FRANKLIN TOWNSHIP","43_003":"JACKSON TOWNSHIP",
  "44_001":"CLAY TOWNSHIP-EAST","44_002":"CLEARSPRING TOWNSHIP","44_003":"TOPEKA TOWN-CLEARSPRING TOWNSH",
  "45_001":"GARY CORP CALUMET TWP GARY SCH","45_002":"LAKE STATION CORP CALUMET TWP","45_003":"GRIFFITH CORP CALUMET TWP",
  "46_001":"WANATAH CORP - CASS TWP","46_002":"MICHIGAN CITY CORP - COOLSPRING TWP","46_009":"TRAIL CREEK CORP - COOLSPRING TWP",
  "47_001":"COOLSPRING TOWNSHIP 1 MC SANITARY","47_002":"BONO TOWNSHIP","47_003":"GUTHRIE TOWNSHIP",
  "48_001":"SPICE VALLEY TOWNSHIP-SOUTH","48_002":"ADAMS TOWNSHIP","48_003":"MARKLEVILLE TOWN",
  "49_101":"ANDERSON LAF.W.C.","49_102":"INDPLS CITY - CENTER TWP","49_200":"BEECH GROVE CITY - CENTER TWP",
  "50_001":"GREEN TOWNSHIP","50_002":"ARGOS-GREEN","50_005":"NORTH TOWNSHIP",
  "51_001":"LOST RIVER TOWNSHIP","51_002":"MITCHELTREE TOWNSHIP","51_003":"PERRY TOWNSHIP",
  "52_001":"DEER CREEK TOWNSHIP","52_002":"ERIE TOWNSHIP","52_003":"HARRISON TOWNSHIP",
  "52_004":"JACKSON TOWNSHIP","52_005":"AMBOY TOWN","52_006":"CONVERSE TOWN","52_007":"JEFFERSON TOWNSHIP",
  "52_009":"DENVER TOWN","52_010":"PERRY TOWNSHIP","52_011":"PERU TOWNSHIP","52_012":"PERU CITY-PERU TOWNSHIP",
  "52_013":"PIPE CREEK TOWNSHIP","52_014":"BUNKER HILL TOWN","52_015":"RICHLAND TOWNSHIP",
  "52_016":"UNION TOWNSHIP","52_017":"WASHINGTON TOWNSHIP","52_018":"PERU CITY-ANNEX-WASHINGTON TOW",
  "52_019":"PERU CITY SOUTH-WASHINGTON TOW","52_020":"BEAN BLOSSOM TOWNSHIP","52_021":"STINESVILLE TOWN",
  "52_022":"BENTON TOWNSHIP","52_023":"BLOOMINGTON TOWNSHIP","53_001":"BLOOMINGTON CITY-BLOOMINGTON T",
  "53_002":"CLEAR CREEK TOWNSHIP","53_003":"INDIAN CREEK TOWNSHIP",
  "54_001":"WAVELAND TOWN-LR CONSERVANCY","54_003":"CLARK TOWNSHIP","54_004":"LADOGA TOWN",
  "55_001":"MOORESVILLE TOWN","55_002":"CLAY TOWNSHIP","55_003":"BETHANY TOWN",
  "56_001":"GOODLAND CORP (GRANT)","56_002":"IROQUOIS TOWNSHIP","56_003":"BROOK CORP (IROQUOIS)",
  "57_001":"AVILLA TOWN","57_002":"ELKHART TOWNSHIP","57_003":"GREEN TOWNSHIP",
  "58_001":"UNION TOWNSHIP","58_002":"FRENCH LICK TOWNSHIP","58_003":"FRENCH LICK TOWN",
  "59_001":"JACKSON TOWNSHIP","59_002":"NORTHEAST TOWNSHIP","59_003":"NORTHWEST TOWNSHIP",
  "60_016":"JEFFERSON TOWNSHIP","60_017":"JENNINGS TOWNSHIP","60_018":"LAFAYETTE TOWNSHIP",
  "61_001":"GREENE TOWNSHIP","61_002":"HOWARD TOWNSHIP","61_003":"JACKSON TOWNSHIP",
  "62_001":"TOBIN TOWNSHIP","62_002":"TROY TOWNSHIP","62_003":"TELL CITY CITY",
  "63_001":"MADISON TOWNSHIP","63_002":"MARION TOWNSHIP","63_003":"MONROE TOWNSHIP",
  "64_001":"JACKSON TOWNSHIP","64_002":"LIBERTY TOWNSHIP","64_003":"CHESTERTON-LIBERTY TWP",
  "65_005":"POINT TOWNSHIP","65_006":"ROBB TOWNSHIP","65_007":"POSEYVILLE TOWN",
  "66_001":"FRANKLIN TOWNSHIP","66_002":"HARRISON TOWNSHIP","66_003":"INDIAN CREEK TOWNSHIP",
  "67_001":"FRANKLIN TOWNSHIP","67_002":"ROACHDALE TOWN","67_003":"GREENCASTLE TOWNSHIP",
  "68_001":"GREENSFORK TOWNSHIP","68_002":"JACKSON TOWNSHIP","68_003":"MONROE TOWNSHIP",
  "69_001":"BROWN TOWNSHIP","69_002":"CENTER TOWNSHIP","69_003":"OSGOOD TOWN",
  "70_001":"ORANGE TOWNSHIP","70_002":"POSEY TOWNSHIP","70_003":"RICHLAND TOWNSHIP",
  "71_001":"MISHAWAKA-CLAY","71_002":"INDIAN VILLAGE (CLAY)","71_003":"ROSELAND (CLAY)",
  "72_001":"LEXINGTON TOWNSHIP","72_002":"VIENNA TOWNSHIP","72_003":"SCOTTSBURG CITY",
  "73_001":"HANOVER TOWNSHIP","73_002":"MORRISTOWN TOWN","73_004":"HENDRICKS TOWNSHIP",
  "74_001":"SANTA CLAUS TOWN-CLAY TOWNSHIP","74_002":"GRASS TOWNSHIP","74_003":"CHRISNEY TOWN",
  "75_001":"JACKSON TOWNSHIP","75_002":"NORTH BEND TOWNSHIP","75_003":"OREGON TOWNSHIP",
  "76_001":"JAMESTOWN TOWNSHIP","76_002":"MILLGROVE TOWNSHIP","76_004":"ORLAND TOWN",
  "77_001":"SHELBURN TOWN","77_002":"FAIRBANKS TOWNSHIP","77_003":"GILL TOWNSHIP",
  "78_001":"PLEASANT TOWNSHIP","78_002":"POSEY TOWNSHIP","78_003":"PATRIOT TOWN",
  "79_001":"LAFAYETTE-FAIRFIELD TWP-TSC-B","79_002":"JACKSON TWP-TSC","79_003":"LAURAMIE TWP",
  "80_001":"LIBERTY TOWNSHIP","80_002":"SHARPSVILLE TOWN","80_003":"MADISON TOWNSHIP",
  "81_001":"HARRISON TOWNSHIP","81_002":"LIBERTY TOWNSHIP","81_003":"UNION TOWNSHIP",
  "82_017":"DARMSTADT TOWN CENTER TOWNSHIP","82_018":"GERMAN TOWNSHIP","82_019":"DARMSTADT TOWN-GERMAN TOWNSHIP",
  "83_001":"EUGENE TOWNSHIP","83_002":"CAYUGA CIVIL TOWN","83_003":"HELT TOWNSHIP",
  "84_001":"TERRE HAUTE CITY-HONEY CREEK T","84_002":"LINTON TOWNSHIP","84_003":"LOST CREEK TOWNSHIP",
  "85_001":"LIBERTY TOWNSHIP","85_002":"LAFONTAINE TOWN","85_003":"NOBLE TOWNSHIP",
  "86_001":"LIBERTY TOWNSHIP","86_002":"MEDINA TOWNSHIP","86_003":"MOUND TOWNSHIP",
  "87_001":"GREER TOWNSHIP","87_002":"ELBERFELD TOWN","87_003":"HART TOWNSHIP",
  "88_001":"LITTLE YORK TOWN","88_002":"HOWARD TOWNSHIP","88_003":"JACKSON TOWNSHIP",
  "89_001":"RICHMOND CITY -CENTER TWP","89_002":"CENTERVILLE TOWN","89_003":"CLAY TOWNSHIP",
  "90_001":"VERRA CRUZ TOWN","90_002":"JACKSON TOWNSHIP","90_003":"JEFFERSON TOWNSHIP",
  "91_001":"HONEY CREEK TOWNSHIP-TWIN LAKE","91_002":"REYNOLDS TOWN","91_003":"JACKSON TOWNSHIP",
  "92_001":"RICHLAND TOWNSHIP","92_002":"LARWILL TOWN","92_003":"SMITH TOWNSHIP",
}

// Resolves a numeric tax district code to a human-readable name
// Uses parcel prefix to identify county, with full-scan fallback
function resolveTaxDistrict(rawDistrict, parcelNumber) {
  if (!rawDistrict) return ""
  const raw = String(rawDistrict).trim()
  if (!/^\d+$/.test(raw)) return raw
  const paddedDistrict = raw.padStart(3, "0")

  // Try parcel prefix first
  if (parcelNumber) {
    const prefix = String(parcelNumber).trim().slice(0, 2)
    if (prefix) {
      const key = `${prefix}_${paddedDistrict}`
      if (TAX_DISTRICTS[key]) {
        const cname = COUNTY_CODES[prefix] || ""
        return `${TAX_DISTRICTS[key]}${cname ? " (" + cname + " CO.)" : ""}`
      }
    }
  }

  // Parcel prefix did not match — scan all counties
  // Handles cases where parcel prefix differs from DLGF county code
  const matches = []
  for (const [cc, cname] of Object.entries(COUNTY_CODES)) {
    const key = `${cc}_${paddedDistrict}`
    if (TAX_DISTRICTS[key]) {
      matches.push(`${TAX_DISTRICTS[key]} (${cname} CO.)`)
    }
  }
  if (matches.length === 1) return matches[0]
  if (matches.length > 1) return matches.join(" / ")

  return `DISTRICT ${raw}`
}

// Property class helpers
const PROPERTY_CLASSES = {
  100:"AGRICULTURAL - VACANT LAND",101:"AGRICULTURAL - CASH GRAIN/GENERAL FARM",102:"AGRICULTURAL - LIVESTOCK",
  103:"AGRICULTURAL - DAIRY FARM",104:"AGRICULTURAL - POULTRY FARM",105:"AGRICULTURAL - FRUIT & NUT FARM",
  106:"AGRICULTURAL - VEGETABLE FARM",107:"AGRICULTURAL - TOBACCO FARM",108:"AGRICULTURAL - NURSERY",
  109:"AGRICULTURAL - GREENHOUSES",110:"AGRICULTURAL - HOG FARM",111:"AGRICULTURAL - BEEF FARM",
  120:"AGRICULTURAL - TIMBER",141:"AGRICULTURAL LAND W/MOBILE HOME",149:"AGRICULTURAL LAND W/PP MOBILE HOME",
  198:"AGRICULTURAL BUILD LEASE LAND",199:"AGRICULTURAL - OTHER",200:"MINERAL",
  300:"INDUSTRIAL - VACANT LAND",309:"INDUSTRIAL - VACANT (SUPPORT LAND)",310:"INDUSTRIAL - FOOD & DRINK",
  320:"INDUSTRIAL - FOUNDRIES & HEAVY MFG",330:"INDUSTRIAL - MEDIUM MFG & ASSEMBLY",340:"INDUSTRIAL - LIGHT MFG & ASSEMBLY",
  345:"INDUSTRIAL - OFFICE",346:"INDUSTRIAL - R&D FACILITY",350:"INDUSTRIAL - WAREHOUSE",
  360:"INDUSTRIAL - TRUCK TERMINALS",370:"INDUSTRIAL - SMALL SHOPS",380:"INDUSTRIAL - MINES & QUARRIES",
  385:"INDUSTRIAL - LANDFILL",390:"INDUSTRIAL - GRAIN ELEVATORS",398:"INDUSTRIAL - BUILDING ON LEASED LAND",399:"INDUSTRIAL - OTHER STRUCTURES",
  400:"COMMERCIAL - VACANT LAND",401:"COMMERCIAL - 4-19 FAMILY APTS",402:"COMMERCIAL - 20-39 FAMILY APTS",
  403:"COMMERCIAL - 40+ FAMILY APTS",409:"COMMERCIAL - VACANT (SUPPORT LAND)",410:"COMMERCIAL - MOTELS/TOURIST CABINS",
  411:"COMMERCIAL - HOTELS",412:"COMMERCIAL - NURSING HOMES & HOSPITALS",415:"COMMERCIAL - MOBILE HOME PARKS",
  416:"COMMERCIAL - CAMPGROUNDS",419:"COMMERCIAL - OTHER HOUSING",420:"COMMERCIAL - SMALL RETAIL",
  421:"COMMERCIAL - SUPERMARKETS",422:"COMMERCIAL - DISCOUNT/JR DEPT STORES",424:"COMMERCIAL - FULL LINE DEPT STORES",
  425:"COMMERCIAL - NEIGHBORHOOD SHOPPING CTR",426:"COMMERCIAL - COMMUNITY SHOPPING CTR",427:"COMMERCIAL - REGIONAL SHOPPING CTR",
  428:"COMMERCIAL - CONVENIENCE MARKET",429:"COMMERCIAL - OTHER RETAIL",430:"COMMERCIAL - RESTAURANT/CAFE/BAR",
  431:"COMMERCIAL - FRANCHISE RESTAURANT",435:"COMMERCIAL - DRIVE-IN RESTAURANT",439:"COMMERCIAL - OTHER FOOD SERVICE",
  440:"COMMERCIAL - DRY CLEAN/LAUNDRY",441:"COMMERCIAL - FUNERAL HOME",442:"COMMERCIAL - MEDICAL CLINIC/OFFICES",
  443:"COMMERCIAL - DRIVE-UP BANK",444:"COMMERCIAL - FULL SERVICE BANK",445:"COMMERCIAL - SAVINGS & LOAN",
  447:"COMMERCIAL - OFFICE 1-2 STORY",448:"COMMERCIAL - OFFICE WALK-UP",449:"COMMERCIAL - OFFICE ELEVATOR",
  450:"COMMERCIAL - CONV MARKET W/GAS",451:"COMMERCIAL - CONV MKT/FRANCHISE W/GAS",452:"COMMERCIAL - AUTO SERVICE STATION",
  453:"COMMERCIAL - CAR WASH",454:"COMMERCIAL - AUTO SALES & SERVICE",455:"COMMERCIAL - GARAGE",
  456:"COMMERCIAL - PARKING LOT/STRUCTURE",460:"COMMERCIAL - THEATERS",461:"COMMERCIAL - DRIVE-IN THEATERS",
  462:"COMMERCIAL - GOLF RANGE/MINI COURSE",463:"COMMERCIAL - GOLF COURSE",464:"COMMERCIAL - BOWLING ALLEY",
  465:"COMMERCIAL - LODGE HALL",466:"COMMERCIAL - AMUSEMENT PARK",467:"COMMERCIAL - HEALTH CLUB",
  468:"COMMERCIAL - ICE RINK",469:"COMMERCIAL - RIVERBOAT GAMING",480:"COMMERCIAL - WAREHOUSE",
  481:"COMMERCIAL - MINI-WAREHOUSE",482:"COMMERCIAL - TRUCK TERMINALS",490:"COMMERCIAL - MARINE SERVICE",
  495:"COMMERCIAL - MARINA",496:"COMMERCIAL - MARINA SMALL BOATS",498:"COMMERCIAL - BUILDING ON LEASED LAND",499:"COMMERCIAL - OTHER STRUCTURE",
  500:"RESIDENTIAL - VACANT PLATTED LOT",501:"RESIDENTIAL - VACANT UNPLATTED 0-9.99 AC",502:"RESIDENTIAL - VACANT UNPLATTED 10-19.99 AC",
  503:"RESIDENTIAL - VACANT UNPLATTED 20-29.99 AC",504:"RESIDENTIAL - VACANT UNPLATTED 30-39.99 AC",505:"RESIDENTIAL - VACANT UNPLATTED 40+ AC",
  509:"RESIDENTIAL - VACANT (SUPPORT LAND)",510:"RESIDENTIAL - 1 FAMILY (PLATTED)",511:"RESIDENTIAL - 1 FAMILY 0-9.99 AC",
  512:"RESIDENTIAL - 1 FAMILY 10-19.99 AC",513:"RESIDENTIAL - 1 FAMILY 20-29.99 AC",514:"RESIDENTIAL - 1 FAMILY 30-39.99 AC",
  515:"RESIDENTIAL - 1 FAMILY 40+ AC",520:"RESIDENTIAL - 2 FAMILY (PLATTED)",530:"RESIDENTIAL - 3 FAMILY (PLATTED)",
  540:"RESIDENTIAL - MOBILE HOME (PLATTED)",550:"RESIDENTIAL - CONDO (PLATTED)",556:"RESIDENTIAL - CONDOMINIUMS",
  590:"RESIDENTIAL - PP MOBILE HOME (PLAT)",591:"RESIDENTIAL - PP MOBILE HOME (NO PLAT)",598:"RESIDENTIAL - ON LEASED LAND",599:"RESIDENTIAL - OTHER",
  600:"EXEMPT - US GOVERNMENT",610:"EXEMPT - STATE OF INDIANA",620:"EXEMPT - COUNTY",
  621:"EXEMPT - CERTIFIED FOR TREASURERS SALE",622:"EXEMPT - HELD FOR RESALE",630:"EXEMPT - TOWNSHIP",
  640:"EXEMPT - MUNICIPALITY",645:"EXEMPT - MUNICIPAL HOUSING AUTHORITY",650:"EXEMPT - BOARD OF EDUCATION",
  660:"EXEMPT - PARK DISTRICT",661:"EXEMPT - CONSERVANCY DISTRICT",662:"EXEMPT - SANITARY DISTRICT",
  665:"EXEMPT - PUBLIC LIBRARY",669:"EXEMPT - OTHER GOVERNMENTAL",670:"EXEMPT - PRIVATE ACADEMY/COLLEGE",
  680:"EXEMPT - CHARITABLE ORG",685:"EXEMPT - RELIGIOUS ORG",686:"EXEMPT - CHURCH/MOSQUE/SYNAGOGUE/TEMPLE",
  690:"EXEMPT - CEMETERY ORG",699:"EXEMPT - OTHER ORG",
  800:"UTILITY - VACANT LAND (COMM)",805:"UTILITY - VACANT LAND (IND)",820:"UTILITY - LIGHT/HEAT/POWER (LOCAL/COMM)",
  830:"UTILITY - PIPELINE (LOCAL/COMM)",840:"UTILITY - RAILROAD (LOCAL/COMM)",850:"UTILITY - SEWAGE (LOCAL/COMM)",
  860:"UTILITY - TELEPHONE/CABLE (LOCAL/COMM)",870:"UTILITY - WATER DISTRIBUTION (LOCAL/COMM)",
}

function getClassDesc(code) {
  return PROPERTY_CLASSES[parseInt(String(code).trim())] || `CLASS ${code}`
}

function getClassCat(code) {
  const n = parseInt(String(code).trim())
  if (n >= 100 && n < 200) return "AGRICULTURAL"
  if (n === 200) return "MINERAL"
  if (n >= 300 && n < 400) return "INDUSTRIAL"
  if (n >= 400 && n < 500) return "COMMERCIAL"
  if (n >= 500 && n < 600) return "RESIDENTIAL"
  if (n >= 600 && n < 700) return "EXEMPT"
  if (n >= 800) return "UTILITY"
  return "UNKNOWN"
}

function isAppraisalImproved(classCode) {
  const n = parseInt(String(classCode || "0").trim())
  if (isNaN(n)) return false
  if (n >= 100 && n < 200) return false
  if (n === 200) return false
  if (n === 300 || n === 309) return false
  if (n >= 310 && n < 400) return true
  if (n === 400 || n === 409) return false
  if (n >= 410 && n < 500) return true
  if (n >= 500 && n <= 509) return false
  if (n >= 510 && n < 600) return true
  return false
}

// FMV helpers needed for rehydration
const COMMON_SURNAMES = new Set(["smith","johnson","williams","brown","jones","miller","davis","wilson","anderson","taylor","thomas","jackson","white","harris","martin","thompson","moore","young","allen","king","wright","scott","green","baker","adams","nelson","carter","mitchell","roberts","turner","phillips","campbell","parker","evans","edwards","collins","stewart","morris","rogers","reed","cook","morgan","bell","murphy","bailey","cooper","cox","howard","ward","peterson","gray","james","watson","brooks","kelly","sanders","price","ross","henderson"])
const NAME_NOISE = new Set(["llc","inc","corp","co","trust","rev","revocable","living","family","the","of","and","an","a","ltd","lp","lllp","et","al","ux","vir","jr","sr","ii","iii","iv","trustee","trustees","estate","pr","personal","representative","by","his","her","their","agent"])
function nameTokens(s) { return (s||"").toLowerCase().split(/[\s,./&-]+/).filter(t=>t.length>1&&!NAME_NOISE.has(t)) }

const NON_ARM_KEYWORDS = ["sheriff","foreclosure","tax sale","quitclaim","quit claim","quit-claim","trustee sale","estate of","probate","bankruptcy","divorce","dissolution","correction deed","corrective deed","guardian","conservator","relocation","government","dept of","department of","county of","city of","town of","state of indiana","united states","u.s.","federal","hud ","fnma","freddie","fannie","va ","veterans","habitat for humanity","land bank","redevelopment","economic development","housing authority"]

function assessFMV(comp) {
  const flags = []
  const sellerStr = (comp.sellerName+" "+comp.sellerCompany).toLowerCase().trim()
  const buyerStr  = (comp.buyerName+" "+comp.buyerCompany).toLowerCase().trim()
  const c5 = (comp.c5Other||"").toLowerCase()
  const price = comp.salePrice
  if (sellerStr && buyerStr && sellerStr.length > 1 && buyerStr.length > 1) {
    const st = nameTokens(sellerStr); const bt = nameTokens(buyerStr)
    const shared = new Set(st.filter(t => bt.includes(t)))
    const uncommon = [...shared].filter(t => !COMMON_SURNAMES.has(t))
    const common   = [...shared].filter(t =>  COMMON_SURNAMES.has(t))
    if (uncommon.length >= 1) flags.push({level: price<=100?"flag":"warn", reason:`POSSIBLE RELATED PARTY: seller "${comp.sellerName}" and buyer "${comp.buyerName}" share surname "${uncommon[0].toUpperCase()}" — verify arm's length`})
    else if (shared.size >= 2) flags.push({level: price<=100?"flag":"warn", reason:`POSSIBLE RELATED PARTY: seller "${comp.sellerName}" and buyer "${comp.buyerName}" share multiple name tokens — verify arm's length`})
    else if (common.length >= 1 && price <= 100) flags.push({level:"flag", reason:`POSSIBLE RELATED PARTY: shared surname "${common[0].toUpperCase()}" with nominal price $${price} — likely gift/family transfer`})
  }
  if (price === 0) flags.push({level:"flag", reason:`ZERO SALE PRICE — gift, estate transfer, or correction deed; not a market transaction`})
  else if (price > 0 && price <= 10) flags.push({level:"flag", reason:`NOMINAL PRICE: $${price} — token consideration, not FMV`})
  else if (price > 10 && price <= 100) flags.push({level:"flag", reason:`VERY LOW PRICE: $${price} — not consistent with arm's length market transaction`})
  else if (price > 100 && price <= 1000) flags.push({level:"warn", reason:`LOW PRICE: $${price} — warrants verification of arm's length status`})
  const allText = `${sellerStr} ${buyerStr} ${c5}`
  for (const kw of NON_ARM_KEYWORDS) {
    if (allText.includes(kw)) {
      const isForcedSale = ["sheriff","foreclosure","tax sale","trustee sale"].some(nk => allText.includes(nk))
      flags.push({level: isForcedSale?"flag":"warn", reason:`NON-ARM'S LENGTH: "${kw.toUpperCase()}" detected in transaction parties or notes`})
      break
    }
  }
  if (getClassCat(comp.propertyClassCode) === "EXEMPT") flags.push({level:"warn", reason:`EXEMPT PROPERTY CLASS ${comp.propertyClassCode} — exempt properties rarely reflect open-market FMV`})
  if (comp.avTotal > 0 && price > 1000 && price < comp.avTotal * 0.20) {
    const pct = Math.round((price / comp.avTotal) * 100)
    flags.push({level:"warn", reason:`PRICE vs. AV: Sale at ${pct}% of assessed value ($${price.toLocaleString()} vs. AV $${comp.avTotal.toLocaleString()}) — verify arm's length`})
  }
  return flags
}

function getFMVBadge(flags) {
  if (!flags || !flags.length) return null
  return flags.some(f => f.level === "flag") ? "flag" : "warn"
}

// Full rehydration — calculates all derived fields from stored fields
function rehydrateComp(comp) {
  const classCode = comp.propertyClassCode || ""
  const parcel    = comp.parcel || ""
  const taxRaw    = comp.taxDistrictRaw || ""

  const taxDistrictName = resolveTaxDistrict(taxRaw, parcel)

  const rehydrated = {
    ...comp,
    propertyClassDesc:  getClassDesc(classCode),
    propertyCategory:   getClassCat(classCode),
    taxDistrictName,
    allAddresses:       comp.allAddresses  || comp.address || "",
    allClassCodes:      comp.allClassCodes || classCode,
    sellerAddress:      "",
    buyerAddress:       "",
    preparerAddress:    "",
    preparerCompany:    comp.preparerCompany || "",
    appraisalImproved:  isAppraisalImproved(classCode),
  }
  const fmvFlags = assessFMV(rehydrated)
  rehydrated.fmvFlags = fmvFlags
  rehydrated.fmvBadge = getFMVBadge(fmvFlags)
  return rehydrated
}

// ── TRANSACTIONS ──────────────────────────────────────────────

export async function loadDB() {
  const PAGE_SIZE = 1000;
  let allRows = [];
  let from = 0;
  let keepGoing = true;

  while (keepGoing) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    if (data && data.length > 0) {
      allRows = allRows.concat(data);
      from += PAGE_SIZE;
      keepGoing = data.length === PAGE_SIZE;
    } else {
      keepGoing = false;
    }
  }

  return allRows.map(row => ({
    parcel: (row.parcel_number ?? row.parcel ?? '').trim(),
    address:      row.address         ?? '',
    township:     row.township        ?? '',
    subdivision:  row.subdivision     ?? '',
    salePrice:    Number(row.sale_price   ?? row.saleprice   ?? 0),
    saleDate:     row.sale_date       ?? row.saledate       ?? '',
    sqft:         Number(row.sqft         ?? row.gla          ?? 0),
    acreage:      Number(row.acreage      ?? row.acres        ?? 0),
    style:        row.style           ?? row.prop_style   ?? '',
    beds:         Number(row.beds         ?? row.bedrooms     ?? 0),
    baths:        Number(row.baths        ?? row.bathrooms    ?? 0),
    yearBuilt:    Number(row.year_built   ?? row.yearbuilt    ?? 0),
    quality:      row.quality         ?? '',
    condition:    row.condition       ?? '',
    garage:       row.garage          ?? '',
    basement:     row.basement        ?? '',
    neighborhood: row.neighborhood    ?? '',
    notes:        row.notes           ?? '',
  }));
}

  // Map DB snake_case → app camelCase, then rehydrate all derived fields
  return allRows.map(row => rehydrateComp({
    id:                row.id,
    sdfId:             row.sdf_id,
    parcel:            row.parcel,
    allParcels:        row.all_parcels,
    address:           row.address,
    propertyClassCode: row.property_class_code,
    taxDistrictRaw:    row.tax_district_raw,
    // Use stored name if present, rehydrateComp will recalculate if null
    taxDistrictName:   row.tax_district_name || "",
    neighborhood:      row.neighborhood,
    saleDate:          row.sale_date,
    conveyanceDate:    row.conveyance_date,
    transferDate:      row.transfer_date,
    dateReceived:      row.date_received,
    salePrice:         Number(row.sale_price)      || 0,
    acreage:           Number(row.acreage)          || 0,
    pricePerAcre:      Number(row.price_per_acre)   || 0,
    avLand:            Number(row.av_land)           || 0,
    avImprovement:     Number(row.av_improvement)   || 0,
    avTotal:           Number(row.av_total)          || 0,
    validTrending:     row.valid_trending,
    sellerName:        row.seller_name,
    sellerCompany:     row.seller_company,
    buyerName:         row.buyer_name,
    buyerCompany:      row.buyer_company,
    preparerName:      row.preparer_name,
    c5Other:           row.c5_other,
    tractCount:        row.tract_count || 1,
    allAddresses:      row.all_addresses,
    allClassCodes:     row.all_class_codes,
    mixedClasses:      row.mixed_classes,
    importedAt:        row.imported_at,
  }))
}

export async function saveDB(comps) {
  const rows = comps.map(c => ({
    id:                  c.id,
    sdf_id:              c.sdfId,
    parcel:              c.parcel,
    all_parcels:         c.allParcels   || c.parcel,
    address:             c.address,
    property_class_code: c.propertyClassCode,
    // Save resolved name so future loads have it immediately
    tax_district_raw:    c.taxDistrictRaw,
    tax_district_name:   c.taxDistrictName || resolveTaxDistrict(c.taxDistrictRaw, c.parcel),
    neighborhood:        c.neighborhood,
    sale_date:           c.saleDate,
    conveyance_date:     c.conveyanceDate,
    transfer_date:       c.transferDate,
    date_received:       c.dateReceived,
    sale_price:          c.salePrice,
    acreage:             c.acreage,
    price_per_acre:      c.pricePerAcre,
    av_land:             c.avLand,
    av_improvement:      c.avImprovement,
    av_total:            c.avTotal,
    valid_trending:      c.validTrending,
    seller_name:         c.sellerName,
    seller_company:      c.sellerCompany,
    buyer_name:          c.buyerName,
    buyer_company:       c.buyerCompany,
    preparer_name:       c.preparerName,
    c5_other:            c.c5Other,
    tract_count:         c.tractCount,
    all_addresses:       c.allAddresses,
    all_class_codes:     c.allClassCodes,
    mixed_classes:       c.mixedClasses,
    imported_at:         c.importedAt,
  }))

  // Insert in batches of 500
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500)
    const { error } = await supabase
      .from('transactions')
      .upsert(chunk, { onConflict: 'id' })
    if (error) {
      console.error('saveDB error:', error)
      throw error
    }
  }
}

export async function clearDB() {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .neq('id', '')
  if (error) throw error
}

// ── NOTES ─────────────────────────────────────────────────────

export async function loadAllNotes(sdfIds) {
  const uniqueIds = [...new Set(sdfIds.filter(Boolean))]
  if (!uniqueIds.length) return {}

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .in('sdf_id', uniqueIds)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('loadAllNotes error:', error)
    return {}
  }

  return (data || []).reduce((acc, row) => {
    if (!acc[row.sdf_id]) acc[row.sdf_id] = []
    acc[row.sdf_id].push({
      id:        row.id,
      text:      row.text,
      author:    row.author,
      verified:  row.verified,
      timestamp: new Date(row.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      })
    })
    return acc
  }, {})
}

export async function insertNote(sdfId, text, author, verified) {
  const { data, error } = await supabase
    .from('notes')
    .insert({ sdf_id: sdfId, text, author, verified })
    .select()
    .single()
  if (error) {
    console.error('insertNote error:', error)
    throw error
  }
  return data
}

export async function deleteNoteById(noteId) {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
  if (error) {
    console.error('deleteNote error:', error)
    throw error
  }
}

// ── IMPORT LOG ────────────────────────────────────────────────

export async function loadImportLog() {
  const { data, error } = await supabase
    .from('import_log')
    .select('*')
    .order('imported_at', { ascending: false })
    .limit(20)
  if (error) return []
  return (data || []).map(r => ({
    fileName:    r.file_name,
    importedAt:  r.imported_at,
    newCount:    r.new_count,
    dupeCount:   r.dupe_count,
    totalInFile: r.total_in_file,
  }))
}

export async function appendImportLog(entry) {
  const { error } = await supabase.from('import_log').insert({
    file_name:     entry.fileName,
    new_count:     entry.newCount,
    dupe_count:    entry.dupeCount,
    total_in_file: entry.totalInFile,
  })
  if (error) console.error('appendImportLog error:', error)
}
