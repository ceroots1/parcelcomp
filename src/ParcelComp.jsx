import { useState, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";

// ─────────────────────────────────────────────────────────────
//  STORAGE  (Supabase-ready stubs — swap window.storage calls
//  for supabase.from(...) equivalents when deploying to prod)
// ─────────────────────────────────────────────────────────────
const DB_KEY_PREFIX = "parcelcomp_comps_v1_chunk_";
const DB_META_KEY   = "parcelcomp_comps_v1_meta";
const CHUNK_SIZE    = 200;

const STRIP_FIELDS = new Set([
  "tracts","fmvFlags","propertyClassDesc","propertyCategory","taxDistrictName",
  "allAddresses","allClassCodes","sellerAddress","buyerAddress","preparerAddress","preparerCompany",
]);
function stripForStorage(comp) {
  const lean = {};
  for (const [k, v] of Object.entries(comp)) { if (!STRIP_FIELDS.has(k)) lean[k] = v; }
  return lean;
}

const NOTES_PREFIX = "parcelcomp_note_v1_";
async function loadNote(sdfId) {
  if (!sdfId) return [];
  try { const r = await window.storage.get(NOTES_PREFIX+sdfId, true); return r ? JSON.parse(r.value) : []; } catch { return []; }
}
async function saveNote(sdfId, notes) {
  try { await window.storage.set(NOTES_PREFIX+sdfId, JSON.stringify(notes), true); } catch(e) { console.error(e); }
}
async function loadAllNotes(sdfIds) {
  const map = {};
  await Promise.all([...new Set(sdfIds.filter(Boolean))].map(async id => {
    const n = await loadNote(id); if (n.length) map[id] = n;
  }));
  return map;
}

const IMPORT_LOG_KEY = "parcelcomp_import_log_v1";
async function loadImportLog() {
  try { const r = await window.storage.get(IMPORT_LOG_KEY, true); return r ? JSON.parse(r.value) : []; } catch { return []; }
}
async function appendImportLog(entry) {
  const log = await loadImportLog();
  log.unshift(entry);
  try { await window.storage.set(IMPORT_LOG_KEY, JSON.stringify(log.slice(0,50)), true); } catch{}
}

// ─────────────────────────────────────────────────────────────
//  INDIANA REFERENCE DATA
// ─────────────────────────────────────────────────────────────
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
};

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
};

function resolveTaxDistrict(rawDistrict, parcelNumber) {
  if (!rawDistrict) return "";
  const raw = String(rawDistrict).trim();
  if (!/^\d+$/.test(raw)) return raw;
  const paddedDistrict = raw.padStart(3, "0");
  if (parcelNumber) {
    const m = String(parcelNumber).trim().match(/^(\d{2})/);
    if (m) {
      const key = `${m[1]}_${paddedDistrict}`;
      if (TAX_DISTRICTS[key]) {
        const cname = COUNTY_CODES[m[1]] || "";
        return `${TAX_DISTRICTS[key]}${cname ? " (" + cname + " CO.)" : ""}`;
      }
    }
  }
  for (const [cc, cname] of Object.entries(COUNTY_CODES)) {
    const key = `${cc}_${paddedDistrict}`;
    if (TAX_DISTRICTS[key]) return `${TAX_DISTRICTS[key]} (${cname} CO.)`;
  }
  return `DISTRICT ${raw}`;
}

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
};
function getClassDesc(code){return PROPERTY_CLASSES[parseInt(String(code).trim())]||`CLASS ${code}`;}
function getClassCat(code){
  const n=parseInt(String(code).trim());
  if(n>=100&&n<200)return"AGRICULTURAL";if(n===200)return"MINERAL";
  if(n>=300&&n<400)return"INDUSTRIAL";if(n>=400&&n<500)return"COMMERCIAL";
  if(n>=500&&n<600)return"RESIDENTIAL";if(n>=600&&n<700)return"EXEMPT";
  if(n>=800)return"UTILITY";return"UNKNOWN";
}
function getClassColor(code){
  const c={AGRICULTURAL:"#4a7c59",MINERAL:"#7a6a5a",INDUSTRIAL:"#3a6a9a",COMMERCIAL:"#b8932a",
    RESIDENTIAL:"#8a3a3a",EXEMPT:"#5a4a8a",UTILITY:"#8a6a3a",UNKNOWN:"#4a5a6a"};
  return c[getClassCat(code)]||"#4a5a6a";
}

// ─────────────────────────────────────────────────────────────
//  FMV ANALYSIS ENGINE
// ─────────────────────────────────────────────────────────────
const COMMON_SURNAMES=new Set(["smith","johnson","williams","brown","jones","miller","davis","wilson","anderson","taylor","thomas","jackson","white","harris","martin","thompson","moore","young","allen","king","wright","scott","green","baker","adams","nelson","carter","mitchell","roberts","turner","phillips","campbell","parker","evans","edwards","collins","stewart","morris","rogers","reed","cook","morgan","bell","murphy","bailey","cooper","cox","howard","ward","peterson","gray","james","watson","brooks","kelly","sanders","price","ross","henderson"]);
const NAME_NOISE=new Set(["llc","inc","corp","co","trust","rev","revocable","living","family","the","of","and","an","a","ltd","lp","lllp","et","al","ux","vir","jr","sr","ii","iii","iv","trustee","trustees","estate","pr","personal","representative","by","his","her","their","agent"]);
function nameTokens(s){return (s||"").toLowerCase().split(/[\s,./&-]+/).filter(t=>t.length>1&&!NAME_NOISE.has(t));}
function isAppraisalImproved(classCode){
  const n=parseInt(String(classCode||"0").trim());
  if(isNaN(n)) return false;
  if(n>=100&&n<200) return false; if(n===200) return false;
  if(n===300||n===309) return false; if(n>=310&&n<400) return true;
  if(n===400||n===409) return false; if(n>=410&&n<500) return true;
  if(n>=500&&n<=509) return false; if(n>=510&&n<600) return true;
  return false;
}
const NON_ARM_KEYWORDS=["sheriff","foreclosure","tax sale","quitclaim","quit claim","quit-claim","trustee sale","estate of","probate","bankruptcy","divorce","dissolution","correction deed","corrective deed","guardian","conservator","relocation","government","dept of","department of","county of","city of","town of","state of indiana","united states","u.s.","federal","hud ","fnma","freddie","fannie","va ","veterans","habitat for humanity","land bank","redevelopment","economic development","housing authority"];
function assessFMV(comp){
  const flags=[];
  const sellerStr=(comp.sellerName+" "+comp.sellerCompany).toLowerCase().trim();
  const buyerStr=(comp.buyerName+" "+comp.buyerCompany).toLowerCase().trim();
  const c5=(comp.c5Other||"").toLowerCase();
  const price=comp.salePrice;
  if(sellerStr&&buyerStr&&sellerStr.length>1&&buyerStr.length>1){
    const st=nameTokens(sellerStr); const bt=nameTokens(buyerStr);
    const shared=new Set(st.filter(t=>bt.includes(t)));
    const uncommon=[...shared].filter(t=>!COMMON_SURNAMES.has(t));
    const common=[...shared].filter(t=>COMMON_SURNAMES.has(t));
    if(uncommon.length>=1) flags.push({level:price<=100?"flag":"warn",reason:`POSSIBLE RELATED PARTY: seller "${comp.sellerName}" and buyer "${comp.buyerName}" share surname "${uncommon[0].toUpperCase()}" — verify arm's length`});
    else if(shared.size>=2) flags.push({level:price<=100?"flag":"warn",reason:`POSSIBLE RELATED PARTY: seller "${comp.sellerName}" and buyer "${comp.buyerName}" share multiple name tokens — verify arm's length`});
    else if(common.length>=1&&price<=100) flags.push({level:"flag",reason:`POSSIBLE RELATED PARTY: shared surname "${common[0].toUpperCase()}" with nominal price $${price} — likely gift/family transfer`});
  }
  if(price===0) flags.push({level:"flag",reason:`ZERO SALE PRICE — gift, estate transfer, or correction deed; not a market transaction`});
  else if(price>0&&price<=10) flags.push({level:"flag",reason:`NOMINAL PRICE: $${price} — token consideration, not FMV`});
  else if(price>10&&price<=100) flags.push({level:"flag",reason:`VERY LOW PRICE: $${price} — not consistent with arm's length market transaction`});
  else if(price>100&&price<=1000) flags.push({level:"warn",reason:`LOW PRICE: $${price} — warrants verification of arm's length status`});
  const allText=`${sellerStr} ${buyerStr} ${c5}`;
  for(const kw of NON_ARM_KEYWORDS){
    if(allText.includes(kw)){
      const isForcedSale=["sheriff","foreclosure","tax sale","trustee sale"].some(nk=>allText.includes(nk));
      flags.push({level:isForcedSale?"flag":"warn",reason:`NON-ARM'S LENGTH: "${kw.toUpperCase()}" detected in transaction parties or notes`});
      break;
    }
  }
  if(getClassCat(comp.propertyClassCode)==="EXEMPT") flags.push({level:"warn",reason:`EXEMPT PROPERTY CLASS ${comp.propertyClassCode} — exempt properties rarely reflect open-market FMV`});
  if(comp.avTotal>0&&price>1000&&price<comp.avTotal*0.20){
    const pct=Math.round((price/comp.avTotal)*100);
    flags.push({level:"warn",reason:`PRICE vs. AV: Sale at ${pct}% of assessed value ($${price.toLocaleString()} vs. AV $${comp.avTotal.toLocaleString()}) — verify arm's length`});
  }
  return flags;
}
function getFMVBadge(flags){if(!flags||!flags.length)return null;return flags.some(f=>f.level==="flag")?"flag":"warn";}

function rehydrateComp(comp) {
  const classCode = comp.propertyClassCode || "";
  const rehydrated = {
    ...comp,
    propertyClassDesc:getClassDesc(classCode), propertyCategory:getClassCat(classCode),
    taxDistrictName:resolveTaxDistrict(comp.taxDistrictRaw||"",comp.parcel||""),
    allAddresses:comp.address||"", allClassCodes:comp.propertyClassCode||"",
    sellerAddress:"", buyerAddress:"", preparerAddress:"", preparerCompany:comp.preparerCompany||"",
  };
  rehydrated.appraisalImproved=isAppraisalImproved(rehydrated.propertyClassCode);
  const fmvFlags=assessFMV(rehydrated);
  rehydrated.fmvFlags=fmvFlags; rehydrated.fmvBadge=getFMVBadge(fmvFlags);
  return rehydrated;
}

// ─────────────────────────────────────────────────────────────
//  DB LAYER
// ─────────────────────────────────────────────────────────────
async function saveDB(rows) {
  const lean=rows.map(stripForStorage);
  const chunks=[];
  for(let i=0;i<lean.length;i+=CHUNK_SIZE) chunks.push(lean.slice(i,i+CHUNK_SIZE));
  for(let i=0;i<chunks.length;i++) await window.storage.set(DB_KEY_PREFIX+i,JSON.stringify(chunks[i]),true);
  await window.storage.set(DB_META_KEY,JSON.stringify({chunks:chunks.length,total:lean.length,savedAt:new Date().toISOString()}));
  for(let i=chunks.length;i<chunks.length+20;i++){try{await window.storage.delete(DB_KEY_PREFIX+i,true);}catch{}}
}
async function loadDB() {
  try{
    const metaR=await window.storage.get(DB_META_KEY,true);
    if(!metaR)return[];
    const meta=JSON.parse(metaR.value);
    const rows=[];
    for(let i=0;i<meta.chunks;i++){const r=await window.storage.get(DB_KEY_PREFIX+i,true).catch(()=>null);if(r)rows.push(...JSON.parse(r.value).map(rehydrateComp));}
    return rows;
  }catch{return[];}
}

// ─────────────────────────────────────────────────────────────
//  PARSE / NORMALIZE / CONSOLIDATE
// ─────────────────────────────────────────────────────────────
async function parseFile(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=(e)=>{try{const wb=XLSX.read(e.target.result,{type:"array"});const ws=wb.Sheets[wb.SheetNames[0]];resolve(XLSX.utils.sheet_to_json(ws,{defval:"",raw:false}));}catch(err){reject(err);}};
    reader.onerror=reject; reader.readAsArrayBuffer(file);
  });
}
function normalizeRow(row){
  const get=(key)=>{if(row[key]!==undefined&&row[key]!==null&&row[key]!=="")return row[key];const k=Object.keys(row).find(k=>k.toLowerCase()===key.toLowerCase());return(k!==undefined&&row[k]!==null&&row[k]!=="")? row[k]:"";};
  const num=v=>{const n=parseFloat(String(v).replace(/[^0-9.-]/g,""));return isNaN(n)?0:n;};
  const parcel=String(get("ParcelNumber")||"").trim();
  const rawDist=String(get("TaxDistrict")||"").trim();
  const classCode=String(get("PropertyClassCode")||"").trim();
  return{sdfId:String(get("SDF_ID")||"").trim(),parcel,address:String(get("ParcelAddress")||"").trim(),propertyClassCode:classCode,propertyClassDesc:getClassDesc(classCode),propertyCategory:getClassCat(classCode),taxDistrictRaw:rawDist,taxDistrictName:resolveTaxDistrict(rawDist,parcel),neighborhood:String(get("NeighborhoodCode")||"").trim(),saleDate:String(get("SaleDate")||"").trim(),conveyanceDate:String(get("ConvenyanceDate")||"").trim(),transferDate:String(get("TransferDate")||"").trim(),dateReceived:String(get("DateReceived")||"").trim(),salePrice:num(get("SalesPrice")),acreage:num(get("ParcelAcreage")),avLand:num(get("AVLand")),avImprovement:num(get("AVImprovement")),avTotal:num(get("AVTotal")),validTrending:String(get("ValidTrending")||"").trim(),sellerName:String(get("SellerName")||"").trim(),sellerCompany:String(get("SellerCompany")||"").trim(),sellerAddress:String(get("SellerAddress")||"").trim(),buyerName:String(get("BuyerName")||"").trim(),buyerCompany:String(get("BuyerCompany")||"").trim(),buyerAddress:String(get("BuyerAddress")||"").trim(),preparerName:String(get("PreparerName")||"").trim(),preparerCompany:String(get("PreparerCompany")||"").trim(),preparerAddress:String(get("PreparerAddress")||"").trim(),c5Other:String(get("C5_Other")||"").trim()};
}
function consolidateTracts(rows){
  const groups={},order=[];
  for(const row of rows){
    const key=row.sdfId||`__nosdf_${Math.random()}`;
    if(!groups[key]){order.push(key);groups[key]={...row,tracts:[row],tractCount:1,allParcels:row.parcel,allAddresses:row.address,allClassCodes:row.propertyClassCode,mixedClasses:false};}
    else{const g=groups[key];g.tractCount++;g.tracts.push(row);g.acreage=parseFloat((g.acreage+row.acreage).toFixed(4));g.avLand+=row.avLand;g.avImprovement+=row.avImprovement;g.avTotal+=row.avTotal;if(row.parcel&&!g.allParcels.split(",").map(p=>p.trim()).includes(row.parcel))g.allParcels+=`, ${row.parcel}`;if(row.address&&!g.allAddresses.includes(row.address))g.allAddresses+=` | ${row.address}`;if(row.propertyClassCode&&row.propertyClassCode!==g.propertyClassCode){g.mixedClasses=true;if(!g.allClassCodes.includes(row.propertyClassCode))g.allClassCodes+=`, ${row.propertyClassCode}`;}}
  }
  return order.map((key,idx)=>{const g=groups[key];const ppa=g.acreage>0&&g.salePrice>0?parseFloat((g.salePrice/g.acreage).toFixed(2)):0;const fmvFlags=assessFMV(g);return{...g,id:`comp_${Date.now()}_${idx}`,pricePerAcre:ppa,appraisalImproved:isAppraisalImproved(g.propertyClassCode),fmvFlags,fmvBadge:getFMVBadge(fmvFlags),importedAt:new Date().toISOString()};});
}

// ─────────────────────────────────────────────────────────────
//  AI FILTER
// ─────────────────────────────────────────────────────────────
const _filterCache=new Map();
function localFilter(query){
  const q=query.toLowerCase().trim();
  const f={propertyCategory:null,propertyClassCode:null,propertyClassDescContains:null,taxDistrictContains:null,minPrice:null,maxPrice:null,minAcreage:null,maxAcreage:null,minPricePerAcre:null,maxPricePerAcre:null,minAVTotal:null,maxAVTotal:null,minAVImprovement:null,hasImprovements:null,sellerContains:null,buyerContains:null,addressContains:null,validTrending:null,saleDateAfter:null,saleDateBefore:null,minTractCount:null,fmvBadge:null,armLengthOnly:null,explanation:""};
  let matched=false;
  if(/\bagricult|\bfarm|\bcrop|\bgrain/.test(q)){f.propertyCategory="AGRICULTURAL";matched=true;}
  else if(/\bcommercial|\bretail|\boffice|\bshopping/.test(q)){f.propertyCategory="COMMERCIAL";matched=true;}
  else if(/\bindustrial|\bwarehouse|\bmfg|\bmanufact/.test(q)){f.propertyCategory="INDUSTRIAL";matched=true;}
  else if(/\bresidential|\bdwelling|\bhouse|\bhome/.test(q)){f.propertyCategory="RESIDENTIAL";matched=true;}
  else if(/\bvacant|\bunimproved/.test(q)){f.hasImprovements=false;matched=true;}
  else if(/\bimproved/.test(q)){f.hasImprovements=true;matched=true;}
  if(/arm.{0,5}length|clean sale/.test(q)){f.armLengthOnly=true;matched=true;}
  if(/flag|not arm|non.arm/.test(q)){f.fmvBadge="flag";matched=true;}
  if(/warn/.test(q)){f.fmvBadge="warn";matched=true;}
  const acreRange=q.match(/(\d+\.?\d*)\s*(?:to|-)\s*(\d+\.?\d*)\s*a(?:cres?|c)\b/);
  const acreBetween=q.match(/between\s*(\d+\.?\d*)\s*and\s*(\d+\.?\d*)\s*a(?:cres?|c)\b/);
  const acreOver=q.match(/(?:over|more than|>|at least|greater than)\s*(\d+\.?\d*)\s*a(?:cres?|c)\b/);
  const acreUnder=q.match(/(?:under|less than|<|below|fewer than)\s*(\d+\.?\d*)\s*a(?:cres?|c)\b/);
  if(acreBetween){f.minAcreage=parseFloat(acreBetween[1]);f.maxAcreage=parseFloat(acreBetween[2]);matched=true;}
  else if(acreRange){f.minAcreage=parseFloat(acreRange[1]);f.maxAcreage=parseFloat(acreRange[2]);matched=true;}
  else if(acreOver){f.minAcreage=parseFloat(acreOver[1]);matched=true;}
  else if(acreUnder){f.maxAcreage=parseFloat(acreUnder[1]);matched=true;}
  const parseMoney=(n,suffix)=>{let v=parseFloat(n.replace(/,/g,""));if(/^m/i.test(suffix||""))v*=1000000;else if(/^k/i.test(suffix||""))v*=1000;return v;};
  const priceOver=q.match(/(?:over|more than|above|>)\s*\$([\d,]+)\s*([km](?:illion)?)?/);
  const priceUnder=q.match(/(?:under|less than|below|<)\s*\$([\d,]+)\s*([km](?:illion)?)?/);
  const priceMillOver=q.match(/(?:over|more than|above)\s*(\d+\.?\d*)\s*million/);
  const priceMillUnder=q.match(/(?:under|less than|below)\s*(\d+\.?\d*)\s*million/);
  if(priceOver){f.minPrice=parseMoney(priceOver[1],priceOver[2]);matched=true;}
  if(priceUnder){f.maxPrice=parseMoney(priceUnder[1],priceUnder[2]);matched=true;}
  if(priceMillOver){f.minPrice=parseFloat(priceMillOver[1])*1000000;matched=true;}
  if(priceMillUnder){f.maxPrice=parseFloat(priceMillUnder[1])*1000000;matched=true;}
  const dateAfter=q.match(/(?:after|since|from)\s*(20\d{2})/);
  const dateBefore=q.match(/(?:before|prior to|until)\s*(20\d{2})/);
  const dateYear=q.match(/\b(20\d{2})\b(?!\s*(?:sf|sq))/);
  if(dateAfter){f.saleDateAfter=dateAfter[1]+"-01-01";matched=true;}
  if(dateBefore){f.saleDateBefore=dateBefore[1]+"-12-31";matched=true;}
  else if(dateYear&&!dateAfter){f.saleDateAfter=dateYear[1]+"-01-01";f.saleDateBefore=dateYear[1]+"-12-31";matched=true;}
  if(/multi.?tract|multiple tract/.test(q)){f.minTractCount=2;matched=true;}
  const buyerMatch=q.match(/buyer(?:\s+(?:is|contains?|named?|=))?\s+([a-z][a-z\s]{2,20})/);
  const sellerMatch=q.match(/seller(?:\s+(?:is|contains?|named?|=))?\s+([a-z][a-z\s]{2,20})/);
  if(buyerMatch){f.buyerContains=buyerMatch[1].trim();matched=true;}
  if(sellerMatch){f.sellerContains=sellerMatch[1].trim();matched=true;}
  const twnMatch=q.match(/\b([a-z]+)\s+township/);
  if(twnMatch){f.taxDistrictContains=twnMatch[1];matched=true;}
  const countyMatch=q.match(/\b([a-z]+)\s+county\b/);
  if(countyMatch&&countyMatch[1]!=="per"){const countyName=countyMatch[1].toUpperCase();f.taxDistrictContains=(f.taxDistrictContains?f.taxDistrictContains+" ":"")+countyName;matched=true;}
  const classMatch=q.match(/class\s+(\d{3})/);
  if(classMatch){f.propertyClassCode=classMatch[1];matched=true;}
  if(!matched)return null;
  const parts=[];
  if(f.propertyCategory)parts.push(f.propertyCategory.toLowerCase());
  if(f.hasImprovements===false)parts.push("unimproved land");
  if(f.hasImprovements===true)parts.push("improved properties");
  if(f.minAcreage||f.maxAcreage)parts.push(`${f.minAcreage||0}–${f.maxAcreage||"∞"} acres`);
  if(f.minPrice||f.maxPrice)parts.push(`$${(f.minPrice||0).toLocaleString()}–${f.maxPrice?"$"+f.maxPrice.toLocaleString():"∞"}`);
  if(f.saleDateAfter)parts.push(`from ${f.saleDateAfter.slice(0,4)}`);
  if(f.saleDateBefore)parts.push(`to ${f.saleDateBefore.slice(0,4)}`);
  if(f.armLengthOnly)parts.push("arm's length only");
  if(f.fmvBadge)parts.push(`fmv=${f.fmvBadge}`);
  if(f.taxDistrictContains)parts.push("district:"+f.taxDistrictContains);
  if(f.buyerContains)parts.push("buyer:"+f.buyerContains);
  if(f.sellerContains)parts.push("seller:"+f.sellerContains);
  f.explanation=`Showing: ${parts.join(", ")}`;
  return f;
}
async function aiFilter(query,comps){
  const cacheKey=query.trim().toLowerCase();
  if(_filterCache.has(cacheKey)){const cached=_filterCache.get(cacheKey);cached.explanation=cached.explanation.replace(" (cached)",")") + " (cached)";return cached;}
  const localResult=localFilter(query);
  if(localResult){_filterCache.set(cacheKey,localResult);return localResult;}
  const sample=comps.slice(0,5).map(c=>({parcel:c.parcel,address:c.address,tractCount:c.tractCount,propertyClassCode:c.propertyClassCode,propertyClassDesc:c.propertyClassDesc,propertyCategory:c.propertyCategory,taxDistrictName:c.taxDistrictName,saleDate:c.saleDate,salePrice:c.salePrice,acreage:c.acreage,pricePerAcre:c.pricePerAcre,avTotal:c.avTotal,fmvBadge:c.fmvBadge}));
  const system=`Indiana SDF analyst. KEY FIELDS: saleDate, salePrice, acreage(ACRES), pricePerAcre, propertyClassCode(100s=AG,300s=IND,400s=COMM,500s=RES,600s=EXEMPT,800s=UTIL), propertyCategory, taxDistrictName, avLand, avImprovement, avTotal, tractCount, fmvBadge(flag/warn/null). Respond ONLY valid JSON: {"propertyCategory":null,"propertyClassCode":null,"propertyClassDescContains":null,"taxDistrictContains":null,"minPrice":null,"maxPrice":null,"minAcreage":null,"maxAcreage":null,"minPricePerAcre":null,"maxPricePerAcre":null,"minAVTotal":null,"maxAVTotal":null,"minAVImprovement":null,"hasImprovements":null,"sellerContains":null,"buyerContains":null,"addressContains":null,"saleDateAfter":null,"saleDateBefore":null,"minTractCount":null,"fmvBadge":null,"armLengthOnly":null,"explanation":"one sentence"}`;
  for(let attempt=0;attempt<3;attempt++){
    try{
      if(attempt>0)await new Promise(r=>setTimeout(r,[2000,5000,10000][attempt-1]));
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:500,system,messages:[{role:"user",content:`Filter: "${query}"\nSample:\n${JSON.stringify(sample)}`}]})});
      if(resp.status===429&&attempt<2)continue;
      const data=await resp.json();
      if(data.error&&data.error.type==="rate_limit_error"&&attempt<2)continue;
      const text=(data.content||[]).map(b=>b.text||"").join("").trim();
      let result={};
      try{result=JSON.parse(text);}catch{const m=text.match(/\{[\s\S]*\}/);if(m)try{result=JSON.parse(m[0]);}catch{}}
      _filterCache.set(cacheKey,result);
      if(_filterCache.size>50)_filterCache.delete(_filterCache.keys().next().value);
      return result;
    }catch(e){if(attempt===2)throw new Error("Search unavailable. Please wait 30 seconds and try again.");}
  }
  return{};
}
function applyFilter(comps,f){
  return comps.filter(c=>{
    const has=(field,val)=>!val||String(c[field]||"").toLowerCase().includes(String(val).toLowerCase());
    if(f.propertyCategory&&!has("propertyCategory",f.propertyCategory))return false;
    if(f.propertyClassCode&&!String(c.propertyClassCode||"").startsWith(String(f.propertyClassCode)))return false;
    if(f.propertyClassDescContains&&!has("propertyClassDesc",f.propertyClassDescContains))return false;
    if(f.taxDistrictContains&&!has("taxDistrictName",f.taxDistrictContains)&&!has("taxDistrictRaw",f.taxDistrictContains))return false;
    if(f.addressContains&&!has("address",f.addressContains)&&!has("allAddresses",f.addressContains))return false;
    if(f.sellerContains&&!has("sellerName",f.sellerContains)&&!has("sellerCompany",f.sellerContains))return false;
    if(f.buyerContains&&!has("buyerName",f.buyerContains)&&!has("buyerCompany",f.buyerContains))return false;
    if(f.fmvBadge&&c.fmvBadge!==f.fmvBadge)return false;
    if(f.armLengthOnly===true&&c.fmvBadge!==null)return false;
    if(f.minPrice!=null&&c.salePrice<f.minPrice)return false;
    if(f.maxPrice!=null&&c.salePrice>f.maxPrice)return false;
    if(f.minAcreage!=null&&c.acreage<f.minAcreage)return false;
    if(f.maxAcreage!=null&&c.acreage>f.maxAcreage)return false;
    if(f.minPricePerAcre!=null&&c.pricePerAcre<f.minPricePerAcre)return false;
    if(f.maxPricePerAcre!=null&&c.pricePerAcre>f.maxPricePerAcre)return false;
    if(f.minAVTotal!=null&&c.avTotal<f.minAVTotal)return false;
    if(f.maxAVTotal!=null&&c.avTotal>f.maxAVTotal)return false;
    if(f.minAVImprovement!=null&&c.avImprovement<f.minAVImprovement)return false;
    if(f.hasImprovements===true&&!isAppraisalImproved(c.propertyClassCode))return false;
    if(f.hasImprovements===false&&isAppraisalImproved(c.propertyClassCode))return false;
    if(f.minTractCount!=null&&c.tractCount<f.minTractCount)return false;
    if(f.saleDateAfter&&c.saleDate&&c.saleDate<f.saleDateAfter)return false;
    if(f.saleDateBefore&&c.saleDate&&c.saleDate>f.saleDateBefore)return false;
    return true;
  });
}

// ─────────────────────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────────────────────
const fmt$=n=>n>0?`$${Number(n).toLocaleString()}`:"\u2014";
const fmtAc=n=>n>0?`${Number(n).toFixed(2)} ac`:"\u2014";
const fmtPAc=n=>n>0?`$${Number(n).toLocaleString()}/ac`:"\u2014";
function calcStats(comps){
  const prices=comps.map(c=>c.salePrice).filter(v=>v>0);
  const acres=comps.map(c=>c.acreage).filter(v=>v>0);
  const ppac=comps.map(c=>c.pricePerAcre).filter(v=>v>0);
  const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
  const med=a=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y);const m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;};
  return{count:comps.length,avgPrice:avg(prices),medPrice:med(prices),avgAcres:avg(acres),medAcres:med(acres),avgPPAc:avg(ppac),medPPAc:med(ppac),totalVolume:prices.reduce((a,b)=>a+b,0),multiTract:comps.filter(c=>c.tractCount>1).length,flagged:comps.filter(c=>c.fmvBadge==="flag").length,warned:comps.filter(c=>c.fmvBadge==="warn").length,clean:comps.filter(c=>!c.fmvBadge).length};
}
function exportCSV(comps,notesMap={}){
  const cols=["sdfId","tractCount","parcel","allParcels","address","propertyClassCode","propertyClassDesc","propertyCategory","taxDistrictRaw","taxDistrictName","saleDate","conveyanceDate","salePrice","acreage","pricePerAcre","avLand","avImprovement","avTotal","validTrending","fmvBadge","sellerName","sellerCompany","buyerName","buyerCompany","preparerName","c5Other"];
  const fmvCol=(c)=>c.fmvFlags&&c.fmvFlags.length?c.fmvFlags.map(f=>f.reason).join(" | "):"";
  const notesCol=(c)=>{const n=notesMap[c.sdfId]||[];return n.map(nt=>`[${nt.verified?"VERIFIED":"NOTE"} ${nt.timestamp} ${nt.author}] ${nt.text}`).join(" | ");};
  const header=[...cols,"fmvNotes","userNotes"].join(",");
  const dq=(s)=>String(s||"").split('"').join('""');
  const rows=comps.map(c=>[...cols.map(k=>`"${dq(c[k])}"`),`"${dq(fmvCol(c))}"`,`"${dq(notesCol(c))}"`].join(","));
  Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([[header,...rows].join("\n")],{type:"text/csv"})),download:"parcelcomp_export.csv"}).click();
}

// ─────────────────────────────────────────────────────────────
//  DESIGN TOKENS — CRE Consulting / ParcelComp palette
//  Navy + warm white + gold accent, professional CRE aesthetic
// ─────────────────────────────────────────────────────────────
const T = {
  // Backgrounds
  bg:         "#f4f2ee",   // warm off-white — feels like paper/professional
  surface:    "#ffffff",
  surfaceAlt: "#f9f7f4",
  navy:       "#1a2744",   // deep navy — primary brand
  navyMid:    "#243358",
  navyLight:  "#2e4070",
  navyTint:   "#eaecf2",   // very light navy for row stripes
  // Accents
  gold:       "#b8932a",   // muted gold — CRE professional
  goldLight:  "#d4a83a",
  goldBg:     "#fdf8ee",
  // Text
  text:       "#1a2032",
  textMid:    "#3d4a62",
  textLight:  "#6b7a96",
  textFaint:  "#9aa3b5",
  // Borders
  border:     "#d8dae2",
  borderMid:  "#c4c8d5",
  // Status
  flagRed:    "#b53a3a",
  flagBg:     "#fdf2f2",
  flagBorder: "#e8c4c4",
  warnAmber:  "#b87a1a",
  warnBg:     "#fdf8f0",
  warnBorder: "#e8d4b0",
  okGreen:    "#2a6b44",
  okBg:       "#f2faf5",
  okBorder:   "#b0d8c0",
};

const APP_CSS=`
@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&family=Merriweather:wght@400;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:${T.bg};color:${T.text};font-family:'Lato',sans-serif;}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:${T.surfaceAlt}}
::-webkit-scrollbar-thumb{background:${T.borderMid};border-radius:3px}
.row-hover:hover{background:${T.navyTint}!important;cursor:pointer}
.sort-th:hover{color:${T.gold}!important;cursor:pointer}
.pill-btn:hover{border-color:${T.navy}!important;color:${T.navy}!important}
.sel-row{outline:2px solid ${T.gold}!important;outline-offset:-2px;}
input[type=checkbox]{accent-color:${T.navy};width:14px;height:14px;cursor:pointer;}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 0.9s linear infinite;display:inline-block}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}.pulse{animation:pulse 2.5s infinite}
.modal-overlay{position:fixed;inset:0;background:rgba(20,30,60,0.55);z-index:1000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px);}
.modal{background:#fff;border-radius:8px;padding:32px;max-width:580px;width:92%;max-height:82vh;overflow-y:auto;box-shadow:0 20px 60px rgba(20,30,60,0.25);}
textarea:focus,input:focus{outline:2px solid ${T.gold}!important;outline-offset:0}
`;

// ─────────────────────────────────────────────────────────────
//  HEADER
// ─────────────────────────────────────────────────────────────
function Header({allComps,stats,exportMode,setExportMode,clearSelection,selectedIds,exportLoading,exportMD26,setShowImport,setShowSettings,showAdmin,setShowAdmin,daysSinceLastImport}){
  return(
    <header style={{background:T.navy,color:"#fff",height:"58px",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 12px rgba(20,30,60,0.18)"}}>
      <div style={{display:"flex",alignItems:"center",gap:"20px"}}>
        {/* Wordmark */}
        <div style={{display:"flex",flexDirection:"column",lineHeight:1,cursor:"default"}} onClick={()=>setShowAdmin(v=>!v)}>
          <div style={{display:"flex",alignItems:"baseline",gap:"2px"}}>
            <span style={{fontFamily:"Merriweather,serif",fontWeight:700,fontSize:"20px",letterSpacing:"-0.02em",color:"#fff"}}>Parcel</span>
            <span style={{fontFamily:"Merriweather,serif",fontWeight:700,fontSize:"20px",letterSpacing:"-0.02em",color:T.goldLight}}>Comp</span>
          </div>
          <span style={{fontSize:"8px",letterSpacing:"0.22em",color:showAdmin?"#6aaa7a":"rgba(255,255,255,0.32)",marginTop:"1px",textTransform:"uppercase"}}>
            {showAdmin?"Admin Mode · ":""}CRE Consulting · Indiana SDF
          </span>
        </div>
        {/* Live indicator */}
        {allComps.length>0&&(
          <div style={{display:"flex",alignItems:"center",gap:"8px",borderLeft:"1px solid rgba(255,255,255,0.15)",paddingLeft:"20px"}}>
            <div className="pulse" style={{width:7,height:7,borderRadius:"50%",background:"#5dba7d"}}/>
            <span style={{color:"rgba(255,255,255,0.6)",fontSize:"12px"}}>{allComps.length.toLocaleString()} transactions</span>
            {stats.flagged>0&&<span style={{background:"rgba(181,58,58,0.25)",color:"#f4a0a0",fontSize:"11px",padding:"1px 8px",borderRadius:"12px",border:"1px solid rgba(181,58,58,0.4)"}}>⚠ {stats.flagged} flagged</span>}
          </div>
        )}
        {daysSinceLastImport!==null&&daysSinceLastImport>=30&&(
          <span style={{background:"rgba(184,147,42,0.2)",color:T.goldLight,fontSize:"11px",padding:"2px 10px",borderRadius:"12px",border:"1px solid rgba(184,147,42,0.4)"}}>Data {daysSinceLastImport}d old</span>
        )}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
        {exportMode&&selectedIds.size>0&&(
          <button onClick={exportMD26} disabled={exportLoading}
            style={{background:exportLoading?"rgba(255,255,255,0.08)":T.gold,color:exportLoading?"rgba(255,255,255,0.4)":"#fff",border:"none",borderRadius:"5px",padding:"7px 16px",fontFamily:"Lato,sans-serif",fontWeight:700,fontSize:"12px",cursor:exportLoading?"wait":"pointer",letterSpacing:"0.04em"}}>
            {exportLoading?<span><span className="spin">↻</span> Generating…</span>:`Export MD-26 (${selectedIds.size})`}
          </button>
        )}
        <button onClick={()=>{setExportMode(v=>!v);clearSelection();}}
          style={{background:exportMode?"rgba(184,147,42,0.2)":"rgba(255,255,255,0.08)",color:exportMode?T.goldLight:"rgba(255,255,255,0.7)",border:"1px solid "+(exportMode?"rgba(184,147,42,0.4)":"rgba(255,255,255,0.15)"),borderRadius:"5px",padding:"6px 14px",fontFamily:"Lato,sans-serif",fontSize:"12px",cursor:"pointer"}}>
          {exportMode?"✓ Selecting":"MD-26 Export"}
        </button>
        <div style={{width:"1px",height:"22px",background:"rgba(255,255,255,0.12)"}}/>
        {showAdmin&&(
          <button onClick={()=>setShowImport(true)}
            style={{background:"rgba(93,186,125,0.15)",color:"#8ae0a8",border:"1px solid rgba(93,186,125,0.3)",borderRadius:"5px",padding:"6px 14px",fontFamily:"Lato,sans-serif",fontSize:"12px",cursor:"pointer"}}>
            Import Data
          </button>
        )}
        <button onClick={()=>setShowSettings(true)}
          style={{background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.6)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"5px",padding:"6px 14px",fontFamily:"Lato,sans-serif",fontSize:"12px",cursor:"pointer"}}>
          Settings
        </button>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────────────────────
export default function App(){
  const [allComps,setAllComps]=useState([]);
  const [filtered,setFiltered]=useState([]);
  const [loading,setLoading]=useState(true);
  const [importing,setImporting]=useState(false);
  const [aiLoading,setAiLoading]=useState(false);
  const [query,setQuery]=useState("");
  const [filterMeta,setFilterMeta]=useState(null);
  const [activeTab,setActiveTab]=useState("comps");
  const [sortCol,setSortCol]=useState("saleDate");
  const [sortDir,setSortDir]=useState("desc");
  const [toast,setToast]=useState(null);
  const [dragOver,setDragOver]=useState(false);
  const [expandedRow,setExpandedRow]=useState(null);
  const [fmvFilter,setFmvFilter]=useState("all");
  const [selectedIds,setSelectedIds]=useState(new Set());
  const [exportMode,setExportMode]=useState(false);
  const [exportLoading,setExportLoading]=useState(false);
  const [showImport,setShowImport]=useState(false);
  const [showSettings,setShowSettings]=useState(false);
  const [showAdmin,setShowAdmin]=useState(false);
  const [googleApiKey,setGoogleApiKey]=useState("");
  const [notesMap,setNotesMap]=useState({});
  const [noteInput,setNoteInput]=useState({id:null,text:"",author:"",verified:false});
  const [showNoteFor,setShowNoteFor]=useState(null);
  const [importLog,setImportLog]=useState([]);
  const fileRef=useRef();
  const settingsKey="parcelcomp_settings_v1";

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),4500);};

  useEffect(()=>{
    const el=document.createElement("style");el.textContent=APP_CSS;document.head.appendChild(el);
    return()=>{document.head.removeChild(el);};
  },[]);

  useEffect(()=>{
    Promise.all([loadDB(),window.storage.get(settingsKey).catch(()=>null),loadImportLog()]).then(async([rows,settingsR,log])=>{
      setAllComps(rows);setFiltered(rows);
      if(settingsR)try{const s=JSON.parse(settingsR.value);setGoogleApiKey(s.googleApiKey||"");}catch{}
      setImportLog(log||[]);
      if(rows.length){const nm=await loadAllNotes(rows.map(r=>r.sdfId));setNotesMap(nm);}
      setLoading(false);
    });
  },[]);

  // ADMIN ONLY: import handler
  const handleFiles=useCallback(async(files)=>{
    const file=files[0];if(!file)return;
    setImporting(true);
    try{
      const raw=await parseFile(file);
      const consolidated=consolidateTracts(raw.map(normalizeRow));
      const existingIds=new Set(allComps.map(c=>c.sdfId).filter(Boolean));
      const newComps=consolidated.filter(c=>!c.sdfId||!existingIds.has(c.sdfId));
      const dupeCount=consolidated.length-newComps.length;
      const updated=[...allComps,...newComps];
      setAllComps(updated);setFiltered(updated);await saveDB(updated);
      const logEntry={fileName:file.name,importedAt:new Date().toISOString(),newCount:newComps.length,dupeCount,totalInFile:consolidated.length};
      await appendImportLog(logEntry);setImportLog(prev=>[logEntry,...prev].slice(0,50));
      showToast(`${newComps.length} transactions added${dupeCount>0?" · "+dupeCount+" duplicates skipped":""} from ${file.name}`);
    }catch(e){showToast("Import failed: "+e.message,"error");}
    setImporting(false);
  },[allComps]);

  const handleDrop=useCallback((e)=>{e.preventDefault();setDragOver(false);handleFiles(e.dataTransfer.files);},[handleFiles]);

  const handleSearch=async()=>{
    if(!query.trim()||!allComps.length)return;
    setAiLoading(true);setFilterMeta(null);
    try{const f=await aiFilter(query,allComps);setFiltered(applyFilter(allComps,f));setFilterMeta(f);}
    catch(e){showToast(e.message,"error");}
    setAiLoading(false);
  };
  const clearFilter=()=>{setFiltered(allComps);setQuery("");setFilterMeta(null);setFmvFilter("all");};
  const clearAllData=async()=>{
    if(!confirm("Remove all transaction data from the database? This cannot be undone."))return;
    setAllComps([]);setFiltered([]);setFilterMeta(null);setFmvFilter("all");
    await saveDB([]);showToast("Database cleared");
  };

  // Notes — read-only for regular users, write-capable for all authenticated
  const openNote=(comp)=>{setShowNoteFor(comp.id);setNoteInput({id:comp.sdfId,text:"",author:"",verified:false});};
  const submitNote=async()=>{
    if(!noteInput.text.trim()||!noteInput.id)return;
    const newNote={text:noteInput.text.trim(),author:noteInput.author.trim()||"Anonymous",timestamp:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),verified:noteInput.verified};
    const updated=[...(notesMap[noteInput.id]||[]),newNote];
    await saveNote(noteInput.id,updated);
    setNotesMap(prev=>({...prev,[noteInput.id]:updated}));
    setNoteInput({id:null,text:"",author:"",verified:false});setShowNoteFor(null);
    showToast(newNote.verified?"Verification saved and shared with team":"Note saved and shared with team");
  };
  const deleteNote=async(sdfId,idx)=>{
    if(!confirm("Delete this note?"))return;
    const updated=(notesMap[sdfId]||[]).filter((_,i)=>i!==idx);
    await saveNote(sdfId,updated);setNotesMap(prev=>({...prev,[sdfId]:updated}));
  };

  const daysSinceLastImport=importLog.length?Math.floor((Date.now()-new Date(importLog[0].importedAt).getTime())/(1000*60*60*24)):null;
  const displayComps=fmvFilter==="all"?filtered:fmvFilter==="clean"?filtered.filter(c=>!c.fmvBadge):filtered.filter(c=>c.fmvBadge===fmvFilter);
  const sorted=[...displayComps].sort((a,b)=>{const av=a[sortCol]??"",bv=b[sortCol]??"";const n=typeof av==="number"?av-bv:String(av).localeCompare(String(bv));return sortDir==="asc"?n:-n;});
  const handleSort=col=>{if(sortCol===col)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortCol(col);setSortDir("desc");}};
  const toggleSelect=(id)=>{setSelectedIds(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});};
  const selectAll=()=>setSelectedIds(new Set(sorted.slice(0,300).map(c=>c.id)));
  const clearSelection=()=>setSelectedIds(new Set());

  const exportMD26=async()=>{
    const selected=allComps.filter(c=>selectedIds.has(c.id));
    if(!selected.length){showToast("Select at least one record to export","error");return;}
    setExportLoading(true);
    try{
      const compData=await Promise.all(selected.map(async comp=>{
        const aiResp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:500,system:"You are a certified Indiana real estate appraiser completing form MD-26. Respond ONLY with a JSON object, no markdown.",messages:[{role:"user",content:`Generate MD-26 field values for this sale:\n${JSON.stringify({address:comp.address,saleDate:comp.saleDate,salePrice:comp.salePrice,acreage:comp.acreage,pricePerAcre:comp.pricePerAcre,sellerName:comp.sellerName,buyerName:comp.buyerName,propertyClassCode:comp.propertyClassCode,propertyClassDesc:comp.propertyClassDesc,propertyCategory:comp.propertyCategory,taxDistrictName:comp.taxDistrictName,avLand:comp.avLand,avImprovement:comp.avImprovement,fmvBadge:comp.fmvBadge,fmvFlags:comp.fmvFlags?.map(f=>f.reason),c5Other:comp.c5Other})}\nReturn JSON: {"conditionOfSale":"","highestBestUse":"","landDescription":"","dimensionsSize":"","landImprovements":"","availableServices":"","topography":"","drainage":"","qualityOfSoils":"","financing":""}`}]})});
        const aiData=await aiResp.json();const aiText=(aiData.content||[]).map(b=>b.text||"").join("").trim();
        let aiFields={};try{aiFields=JSON.parse(aiText);}catch{}
        const distMatch=(comp.taxDistrictName||"").match(/^(.+?)\s*((.+?)\s+CO.)$/);
        return{comp,aiFields,township:distMatch?distMatch[1]:(comp.taxDistrictName||""),county:distMatch?distMatch[2]:""};
      }));
      const html=buildMD26HTML(compData,googleApiKey);
      const blob=new Blob([html],{type:"text/html"});
      const url=URL.createObjectURL(blob);
      Object.assign(document.createElement("a"),{href:url,download:`ParcelComp_MD26_${new Date().toISOString().slice(0,10)}.html`}).click();
      showToast(`MD-26 exported for ${selected.length} record${selected.length>1?"s":""} — open in browser and print to PDF`);
    }catch(e){showToast("Export failed: "+e.message,"error");}
    setExportLoading(false);
  };

  const stats=calcStats(filtered);
  const catDist=filtered.reduce((acc,c)=>{acc[c.propertyCategory]=(acc[c.propertyCategory]||0)+1;return acc;},{});
  const topCats=Object.entries(catDist).sort((a,b)=>b[1]-a[1]);

  const Divider=()=><div style={{width:"1px",height:"18px",background:T.border}}/>;

  return(
    <div style={{background:T.bg,minHeight:"100vh",fontFamily:"Lato,sans-serif"}}>
      <Header allComps={allComps} stats={stats} exportMode={exportMode} setExportMode={setExportMode}
        clearSelection={clearSelection} selectedIds={selectedIds} exportLoading={exportLoading}
        exportMD26={exportMD26} setShowImport={setShowImport} setShowSettings={setShowSettings}
        showAdmin={showAdmin} setShowAdmin={setShowAdmin} daysSinceLastImport={daysSinceLastImport}/>

      <div style={{maxWidth:"1540px",margin:"0 auto",padding:"20px 24px"}}>

        {/* ── SEARCH BAR ── */}
        <div style={{marginBottom:"14px"}}>
          <div style={{display:"flex",gap:"0",alignItems:"stretch",background:T.surface,border:"1px solid "+T.border,borderRadius:"7px",overflow:"hidden",boxShadow:"0 1px 4px rgba(20,30,60,0.06)"}}>
            <div style={{background:T.navy,display:"flex",alignItems:"center",padding:"0 14px"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
            <input type="text" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSearch()} autoFocus
              placeholder={allComps.length>0?"Search: e.g. vacant ag land Hamilton County 20–80 acres arm's length 2021–2024":"No data loaded — contact your administrator"}
              style={{flex:1,background:"transparent",border:"none",color:allComps.length>0?T.text:"#9aa3b5",fontFamily:"Lato,sans-serif",fontSize:"14px",outline:"none",padding:"13px 14px"}}
            />
            {query&&<button onClick={()=>{setQuery("");clearFilter();}} style={{background:"none",border:"none",color:T.textFaint,cursor:"pointer",padding:"0 12px",fontSize:"18px",lineHeight:1}}>×</button>}
            <button onClick={handleSearch} disabled={aiLoading||!allComps.length}
              style={{background:allComps.length&&!aiLoading?T.navy:"#d0d4de",color:"#fff",border:"none",padding:"0 24px",fontFamily:"Lato,sans-serif",fontWeight:700,fontSize:"13px",cursor:allComps.length&&!aiLoading?"pointer":"default",letterSpacing:"0.04em",whiteSpace:"nowrap"}}>
              {aiLoading?<span><span className="spin" style={{marginRight:6}}>↻</span>Searching…</span>:"Search"}
            </button>
          </div>

          {/* Quick filters */}
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginTop:"8px",alignItems:"center"}}>
            <span style={{color:T.textFaint,fontSize:"11px",marginRight:"2px"}}>Quick:</span>
            {[["Vacant Land","vacant unimproved land"],["Agricultural","agricultural"],["Arm's Length","arms length only"],["30+ Acres","more than 30 acres"],["Since 2023","after 2023"],["Commercial","commercial"],["Flagged","flagged non-arms length"]].map(([label,val])=>(
              <button key={label} onClick={()=>setQuery(val)} disabled={!allComps.length} className="pill-btn"
                style={{background:"none",border:"1px solid "+T.border,borderRadius:"20px",padding:"3px 11px",color:allComps.length?T.textMid:"#c0c8d8",fontFamily:"Lato,sans-serif",fontSize:"11px",cursor:allComps.length?"pointer":"default",transition:"all 0.15s"}}>
                {label}
              </button>
            ))}
            <div style={{flex:1}}/>
            {/* FMV quick filter */}
            <span style={{color:T.textFaint,fontSize:"11px"}}>FMV:</span>
            {[["all","All",[T.navy,T.navy,T.navyTint]],["clean","✓ "+stats.clean,[T.okGreen,T.okBorder,T.okBg]],["warn","? "+stats.warned,[T.warnAmber,T.warnBorder,T.warnBg]],["flag","⚠ "+stats.flagged,[T.flagRed,T.flagBorder,T.flagBg]]].map(([val,label,[color,border,bg]])=>(
              <button key={val} onClick={()=>setFmvFilter(val)}
                style={{background:fmvFilter===val?bg:"none",border:"1px solid "+(fmvFilter===val?border:T.border),borderRadius:"20px",padding:"3px 11px",color:fmvFilter===val?color:T.textLight,fontFamily:"Lato,sans-serif",fontSize:"11px",cursor:"pointer",transition:"all 0.15s",fontWeight:fmvFilter===val?700:400}}>
                {label}
              </button>
            ))}
          </div>

          {/* Active filter strip */}
          {(filterMeta||fmvFilter!=="all")&&(
            <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginTop:"8px",alignItems:"center",background:T.goldBg,border:"1px solid "+T.warnBorder,borderRadius:"6px",padding:"6px 12px"}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              {filterMeta?.explanation&&<span style={{color:T.warnAmber,fontSize:"12px",fontWeight:600}}>{filterMeta.explanation.slice(0,80)}</span>}
              {fmvFilter!=="all"&&<span style={{color:T.warnAmber,fontSize:"12px",fontWeight:600}}>FMV: {fmvFilter}</span>}
              <button onClick={clearFilter} style={{background:"none",border:"1px solid "+T.warnBorder,borderRadius:"4px",padding:"1px 8px",color:T.warnAmber,fontFamily:"Lato,sans-serif",fontSize:"11px",cursor:"pointer"}}>Clear</button>
              <span style={{color:T.textLight,fontSize:"12px",marginLeft:"4px"}}>{displayComps.length.toLocaleString()} of {allComps.length.toLocaleString()} transactions</span>
            </div>
          )}
        </div>

        {/* ── LOADING ── */}
        {loading&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"50vh",gap:"16px"}}>
            <div className="spin" style={{fontSize:"32px",color:T.navy}}>↻</div>
            <p style={{color:T.textLight,fontSize:"13px",letterSpacing:"0.05em"}}>Loading transaction database…</p>
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {!loading&&allComps.length===0&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"55vh",textAlign:"center",animation:"fadeUp 0.5s ease"}}>
            <div style={{width:"64px",height:"64px",background:T.navyTint,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"20px"}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.navy} strokeWidth="1.8"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </div>
            <h2 style={{fontFamily:"Merriweather,serif",fontSize:"24px",color:T.navy,marginBottom:"8px",fontWeight:700}}>ParcelComp</h2>
            <p style={{color:T.textLight,fontSize:"13px",maxWidth:"400px",lineHeight:"1.7",marginBottom:"28px"}}>Indiana SDF comparable sales database for right-of-way appraisals, eminent domain, and commercial real estate analysis.</p>
            <div style={{background:T.surface,border:"1px solid "+T.border,borderRadius:"8px",padding:"24px 32px",maxWidth:"460px",width:"100%",textAlign:"left",boxShadow:"0 2px 12px rgba(20,30,60,0.06)"}}>
              <p style={{color:T.textMid,fontSize:"12px",fontWeight:700,letterSpacing:"0.08em",marginBottom:"12px",textTransform:"uppercase"}}>Example Searches</p>
              {["vacant ag land Hamilton County 30–80 acres","commercial sales Marion County 2022–2024 arm's length","residential over 5 acres after 2021 under $200,000","class 510 sales flagged non-arms length"].map(ex=>(
                <div key={ex} onClick={()=>setQuery(ex)} style={{color:T.textMid,fontSize:"12px",padding:"6px 0",borderBottom:"1px solid "+T.border,cursor:"pointer",display:"flex",alignItems:"center",gap:"8px"}}>
                  <span style={{color:T.gold,fontWeight:700}}>›</span>{ex}
                </div>
              ))}
            </div>
            <p style={{color:T.textFaint,fontSize:"11px",marginTop:"20px"}}>Transaction data is loaded by your administrator. Contact <a href="mailto:info@consultcre.com" style={{color:T.navy}}>info@consultcre.com</a> for access.</p>
          </div>
        )}

        {/* ── TABS ── */}
        {allComps.length>0&&(
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",borderBottom:"2px solid "+T.border,marginBottom:"16px"}}>
            <div style={{display:"flex",gap:"0"}}>
              {[["comps",`Transactions (${displayComps.length.toLocaleString()})`],["stats","Statistics"]].map(([t,l])=>(
                <button key={t} onClick={()=>setActiveTab(t)}
                  style={{background:"none",border:"none",borderBottom:"2px solid "+(activeTab===t?T.navy:"transparent"),marginBottom:"-2px",cursor:"pointer",padding:"9px 18px",fontFamily:"Lato,sans-serif",fontWeight:activeTab===t?700:400,fontSize:"13px",color:activeTab===t?T.navy:T.textLight,transition:"all 0.2s",letterSpacing:"0.02em"}}>
                  {l}
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:"6px",paddingBottom:"6px",alignItems:"center"}}>
              {exportMode&&(
                <>
                  <button onClick={selectAll} style={{background:"none",border:"1px solid "+T.border,borderRadius:"4px",padding:"4px 10px",color:T.textMid,fontFamily:"Lato,sans-serif",fontSize:"11px",cursor:"pointer"}}>Select All</button>
                  <button onClick={clearSelection} style={{background:"none",border:"1px solid "+T.border,borderRadius:"4px",padding:"4px 10px",color:T.textMid,fontFamily:"Lato,sans-serif",fontSize:"11px",cursor:"pointer"}}>Clear</button>
                  <Divider/>
                </>
              )}
              <button onClick={()=>exportCSV(displayComps,notesMap)}
                style={{background:"none",border:"1px solid "+T.border,borderRadius:"4px",padding:"5px 12px",color:T.textMid,fontFamily:"Lato,sans-serif",fontSize:"11px",cursor:"pointer",fontWeight:600}}>
                Export CSV
              </button>
              {showAdmin&&<button onClick={clearAllData} style={{background:"none",border:"1px solid #f0c8c8",borderRadius:"4px",padding:"5px 12px",color:"#b06060",fontFamily:"Lato,sans-serif",fontSize:"11px",cursor:"pointer"}}>Clear DB</button>}
            </div>
          </div>
        )}

        {/* ── TRANSACTIONS TABLE ── */}
        {activeTab==="comps"&&allComps.length>0&&(
          <div style={{animation:"fadeUp 0.3s ease",borderRadius:"7px",border:"1px solid "+T.border,overflow:"hidden",boxShadow:"0 2px 8px rgba(20,30,60,0.05)"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:"1160px"}}>
                <thead>
                  <tr style={{background:T.navy}}>
                    {exportMode&&<th style={{padding:"10px 12px",width:"38px"}}><input type="checkbox" checked={selectedIds.size===Math.min(sorted.length,300)&&sorted.length>0} onChange={e=>e.target.checked?selectAll():clearSelection()}/></th>}
                    {[["fmvBadge","Status"],["propertyClassCode","Class"],["address","Address"],["taxDistrictName","Tax District"],["saleDate","Sale Date"],["salePrice","Sale Price"],["acreage","Acres"],["pricePerAcre","$/Acre"],["avTotal","AV Total"],["sellerName","Seller"],["buyerName","Buyer"]].map(([k,l])=>(
                      <th key={k} onClick={()=>handleSort(k)} className="sort-th"
                        style={{padding:"11px 13px",textAlign:"left",color:sortCol===k?"#f0d080":"rgba(255,255,255,0.7)",fontWeight:600,fontSize:"11px",letterSpacing:"0.07em",textTransform:"uppercase",whiteSpace:"nowrap",cursor:"pointer",userSelect:"none",borderRight:"1px solid rgba(255,255,255,0.08)",transition:"color 0.15s"}}>
                        {l}{sortCol===k?(sortDir==="asc"?" ↑":" ↓"):""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.slice(0,300).map((c,i)=>{
                    const isSelected=selectedIds.has(c.id);
                    const rowBg=isSelected?T.navyTint:c.fmvBadge==="flag"?T.flagBg:c.fmvBadge==="warn"?T.warnBg:(i%2===0?T.surface:T.surfaceAlt);
                    return(
                      <React.Fragment key={c.id}>
                        <tr className={"row-hover"+(isSelected?" sel-row":"")}
                          onClick={()=>exportMode?toggleSelect(c.id):setExpandedRow(expandedRow===c.id?null:c.id)}
                          style={{background:rowBg,borderBottom:"1px solid "+T.border,transition:"background 0.1s"}}>
                          {exportMode&&<td style={{padding:"9px 12px"}} onClick={e=>{e.stopPropagation();toggleSelect(c.id);}}><input type="checkbox" checked={isSelected} onChange={()=>toggleSelect(c.id)}/></td>}
                          {/* Status */}
                          <td style={{padding:"9px 13px",width:"90px"}}>
                            {c.fmvBadge==="flag"
                              ?<span title={(c.fmvFlags||[]).map(f=>f.reason).join("\n")} style={{background:T.flagBg,border:"1px solid "+T.flagBorder,color:T.flagRed,borderRadius:"4px",padding:"2px 8px",fontSize:"10px",fontWeight:700,whiteSpace:"nowrap",cursor:"help",letterSpacing:"0.04em"}}>⚠ FLAG</span>
                              :c.fmvBadge==="warn"
                              ?<span title={(c.fmvFlags||[]).map(f=>f.reason).join("\n")} style={{background:T.warnBg,border:"1px solid "+T.warnBorder,color:T.warnAmber,borderRadius:"4px",padding:"2px 8px",fontSize:"10px",fontWeight:700,whiteSpace:"nowrap",cursor:"help",letterSpacing:"0.04em"}}>? VERIFY</span>
                              :<span style={{color:T.okGreen,fontSize:"10px",fontWeight:700,letterSpacing:"0.04em"}}>✓ OK</span>
                            }
                            {(notesMap[c.sdfId]||[]).length>0&&<div style={{color:T.navy,fontSize:"9px",marginTop:"3px",fontWeight:600}}>📝 {(notesMap[c.sdfId]||[]).length} note{(notesMap[c.sdfId]||[]).length>1?"s":""}</div>}
                          </td>
                          {/* Class */}
                          <td style={{padding:"9px 13px"}}>
                            <div style={{display:"flex",flexDirection:"column",gap:"2px"}}>
                              <span style={{background:getClassColor(c.propertyClassCode)+"18",border:"1px solid "+getClassColor(c.propertyClassCode)+"40",borderRadius:"4px",padding:"1px 7px",color:getClassColor(c.propertyClassCode),fontSize:"10px",fontWeight:700,whiteSpace:"nowrap",display:"inline-block"}}>{c.propertyClassCode}</span>
                              <span style={{color:T.textFaint,fontSize:"10px"}}>{c.propertyCategory}</span>
                              {c.tractCount>1&&<span style={{color:T.okGreen,fontSize:"9px",fontWeight:600}}>{c.tractCount} tracts</span>}
                            </div>
                          </td>
                          <td style={{padding:"9px 13px",color:T.text,maxWidth:"170px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:"13px"}}>{c.address||"—"}</td>
                          <td style={{padding:"9px 13px",color:T.textMid,fontSize:"12px",maxWidth:"160px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.taxDistrictName||c.taxDistrictRaw||"—"}</td>
                          <td style={{padding:"9px 13px",color:T.textLight,fontSize:"12px",whiteSpace:"nowrap"}}>{c.saleDate||"—"}</td>
                          <td style={{padding:"9px 13px",color:T.text,fontWeight:700,fontSize:"13px",whiteSpace:"nowrap"}}>{fmt$(c.salePrice)}</td>
                          <td style={{padding:"9px 13px",color:T.textMid,fontSize:"12px",whiteSpace:"nowrap"}}>{fmtAc(c.acreage)}</td>
                          <td style={{padding:"9px 13px",color:c.pricePerAcre>0?T.okGreen:T.textFaint,fontSize:"12px",fontWeight:c.pricePerAcre>0?700:400,whiteSpace:"nowrap"}}>{fmtPAc(c.pricePerAcre)}</td>
                          <td style={{padding:"9px 13px",color:T.textLight,fontSize:"12px",whiteSpace:"nowrap"}}>{fmt$(c.avTotal)}</td>
                          <td style={{padding:"9px 13px",color:T.textMid,fontSize:"12px",maxWidth:"130px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.sellerName||"—"}</td>
                          <td style={{padding:"9px 13px",color:T.textMid,fontSize:"12px",maxWidth:"130px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.buyerName||"—"}</td>
                        </tr>

                        {/* ── EXPANDED DETAIL ── */}
                        {!exportMode&&expandedRow===c.id&&(
                          <tr key={c.id+"-exp"} style={{background:c.fmvBadge==="flag"?T.flagBg:c.fmvBadge==="warn"?T.warnBg:T.navyTint,borderBottom:"2px solid "+T.border}}>
                            <td colSpan={12} style={{padding:"20px 24px"}}>
                              {/* FMV warnings */}
                              {c.fmvFlags&&c.fmvFlags.length>0&&(
                                <div style={{marginBottom:"16px",display:"flex",flexDirection:"column",gap:"6px"}}>
                                  {c.fmvFlags.map((fl,fi)=>(
                                    <div key={fi} style={{background:fl.level==="flag"?T.flagBg:T.warnBg,border:"1px solid "+(fl.level==="flag"?T.flagBorder:T.warnBorder),borderRadius:"5px",padding:"10px 14px",display:"flex",gap:"10px",alignItems:"flex-start"}}>
                                      <span style={{color:fl.level==="flag"?T.flagRed:T.warnAmber,fontWeight:700,fontSize:"11px",whiteSpace:"nowrap",letterSpacing:"0.04em"}}>{fl.level==="flag"?"⚠ FLAG":"? VERIFY"}</span>
                                      <span style={{color:fl.level==="flag"?T.flagRed:T.warnAmber,fontSize:"12px",lineHeight:"1.5"}}>{fl.reason}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {/* Class badge */}
                              <div style={{background:getClassColor(c.propertyClassCode)+"10",border:"1px solid "+getClassColor(c.propertyClassCode)+"30",borderRadius:"5px",padding:"8px 14px",marginBottom:"16px",display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"}}>
                                <span style={{color:getClassColor(c.propertyClassCode),fontWeight:700,fontSize:"13px"}}>Class {c.propertyClassCode}</span>
                                <span style={{color:T.textFaint}}>·</span>
                                <span style={{color:T.textMid,fontSize:"12px"}}>{c.propertyClassDesc}</span>
                                {c.tractCount>1&&<><span style={{color:T.textFaint}}>·</span><span style={{color:T.okGreen,fontSize:"11px",fontWeight:600}}>{c.tractCount} consolidated tracts · acreage & AV summed · price not summed</span></>}
                              </div>
                              {/* Field grid */}
                              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:"12px 28px",marginBottom:"20px"}}>
                                {[["SDF ID",c.sdfId],["Parcel",c.allParcels||c.parcel],["Address",c.allAddresses||c.address],["Property Class",c.propertyClassCode+" — "+c.propertyClassDesc],["Tax District",c.taxDistrictName||"(unresolved)"],["Neighborhood",c.neighborhood],["Sale Date",c.saleDate],["Conveyance Date",c.conveyanceDate],["Transfer Date",c.transferDate],["Sale Price",fmt$(c.salePrice)+" (not summed across tracts)"],["Total Acreage",fmtAc(c.acreage)+(c.tractCount>1?" (summed)":"")],["Price / Acre",fmtPAc(c.pricePerAcre)],["AV Land",fmt$(c.avLand)+(c.tractCount>1?" (summed)":"")],["AV Improvement",fmt$(c.avImprovement)+(c.tractCount>1?" (summed)":"")],["AV Total",fmt$(c.avTotal)+(c.tractCount>1?" (summed)":"")],["Valid / Trending",c.validTrending],["Seller",c.sellerName||"—"],["Seller Company",c.sellerCompany||"—"],["Buyer",c.buyerName||"—"],["Buyer Company",c.buyerCompany||"—"],["Preparer",c.preparerName||"—"],["C5 Other Notes",c.c5Other||"—"]].map(([label,val])=>(
                                  <div key={label}>
                                    <div style={{color:T.textFaint,fontSize:"10px",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"2px",fontWeight:600}}>{label}</div>
                                    <div style={{color:val&&val!=="—"?T.text:T.textFaint,fontSize:"13px",wordBreak:"break-word"}}>{val||"—"}</div>
                                  </div>
                                ))}
                              </div>

                              {/* ── NOTES SECTION ── */}
                              <div style={{borderTop:"1px solid "+T.border,paddingTop:"16px"}}>
                                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
                                  <div>
                                    <span style={{color:T.navy,fontSize:"12px",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>Field Notes & Verifications</span>
                                    {(notesMap[c.sdfId]||[]).length>0&&<span style={{color:T.gold,fontSize:"12px",fontWeight:700,marginLeft:"8px"}}>({(notesMap[c.sdfId]||[]).length})</span>}
                                    <span style={{color:T.textFaint,fontSize:"11px",marginLeft:"8px"}}>· visible to all team members</span>
                                  </div>
                                  {showNoteFor!==c.id&&(
                                    <button onClick={e=>{e.stopPropagation();openNote(c);}}
                                      style={{background:T.navy,color:"#fff",border:"none",borderRadius:"5px",padding:"6px 14px",fontFamily:"Lato,sans-serif",fontWeight:700,fontSize:"11px",cursor:"pointer",letterSpacing:"0.04em"}}>
                                      + Add Note
                                    </button>
                                  )}
                                </div>
                                {(notesMap[c.sdfId]||[]).map((note,ni)=>(
                                  <div key={ni} style={{background:note.verified?T.okBg:T.surface,border:"1px solid "+(note.verified?T.okBorder:T.border),borderRadius:"6px",padding:"12px 16px",marginBottom:"8px",display:"flex",gap:"14px",alignItems:"flex-start"}}>
                                    <div style={{flex:1}}>
                                      {note.verified&&<span style={{background:T.okGreen,color:"#fff",fontSize:"9px",letterSpacing:"0.08em",padding:"2px 8px",borderRadius:"3px",marginRight:"8px",fontWeight:700,textTransform:"uppercase"}}>✓ Verified</span>}
                                      <span style={{color:T.text,fontSize:"13px",lineHeight:"1.6"}}>{note.text}</span>
                                      <div style={{marginTop:"5px",color:T.textFaint,fontSize:"11px"}}>{note.author} · {note.timestamp}</div>
                                    </div>
                                    <button onClick={e=>{e.stopPropagation();deleteNote(c.sdfId,ni);}} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:"18px",lineHeight:1,padding:"0",flexShrink:0}} title="Delete note">×</button>
                                  </div>
                                ))}
                                {showNoteFor===c.id&&(
                                  <div style={{background:T.surface,border:"1px solid "+T.borderMid,borderRadius:"7px",padding:"16px",marginTop:"8px",boxShadow:"0 2px 8px rgba(20,30,60,0.06)"}} onClick={e=>e.stopPropagation()}>
                                    <textarea value={noteInput.text} onChange={e=>setNoteInput(p=>({...p,text:e.target.value}))}
                                      placeholder="Enter verification details, field observation, market context, or source of information…"
                                      style={{width:"100%",background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:"5px",padding:"10px 12px",color:T.text,fontFamily:"Lato,sans-serif",fontSize:"13px",outline:"none",resize:"vertical",minHeight:"80px",marginBottom:"12px",lineHeight:"1.6"}}
                                    />
                                    <div style={{display:"flex",gap:"10px",alignItems:"center",flexWrap:"wrap"}}>
                                      <input type="text" value={noteInput.author} onChange={e=>setNoteInput(p=>({...p,author:e.target.value}))} placeholder="Your name (optional)"
                                        style={{flex:1,minWidth:"140px",background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:"5px",padding:"8px 12px",color:T.text,fontFamily:"Lato,sans-serif",fontSize:"12px",outline:"none"}}
                                      />
                                      <label style={{display:"flex",alignItems:"center",gap:"7px",cursor:"pointer",color:T.textMid,fontSize:"12px",userSelect:"none",fontWeight:600}}>
                                        <input type="checkbox" checked={noteInput.verified} onChange={e=>setNoteInput(p=>({...p,verified:e.target.checked}))}/>
                                        Mark as Verified
                                      </label>
                                      <button onClick={e=>{e.stopPropagation();submitNote();}} style={{background:T.navy,color:"#fff",border:"none",borderRadius:"5px",padding:"8px 18px",fontFamily:"Lato,sans-serif",fontWeight:700,fontSize:"12px",cursor:"pointer",letterSpacing:"0.04em"}}>Save Note</button>
                                      <button onClick={e=>{e.stopPropagation();setShowNoteFor(null);}} style={{background:"none",border:"1px solid "+T.border,borderRadius:"5px",padding:"8px 14px",color:T.textMid,fontFamily:"Lato,sans-serif",fontSize:"12px",cursor:"pointer"}}>Cancel</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {sorted.length>300&&<div style={{padding:"10px 16px",color:T.textFaint,fontSize:"11px",borderTop:"1px solid "+T.border,background:T.surfaceAlt,fontStyle:"italic"}}>Showing 300 of {displayComps.length.toLocaleString()} — export CSV for full dataset</div>}
            {displayComps.length===0&&allComps.length>0&&<div style={{padding:"48px",textAlign:"center",color:T.textFaint,fontSize:"13px"}}>No records match your search criteria. Try broadening your filter.</div>}
          </div>
        )}

        {/* ── STATISTICS TAB ── */}
        {activeTab==="stats"&&allComps.length>0&&(
          <div style={{animation:"fadeUp 0.3s ease"}}>
            {/* FMV summary cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px",marginBottom:"20px"}}>
              {[[`✓  ${stats.clean.toLocaleString()}  Arm's Length`,"No FMV concerns detected",T.okGreen,T.okBg,T.okBorder],[`?  ${stats.warned.toLocaleString()}  Verify`,"Potential non-arm's length indicator",T.warnAmber,T.warnBg,T.warnBorder],[`⚠  ${stats.flagged.toLocaleString()}  Flagged`,"Likely non-arm's length transaction",T.flagRed,T.flagBg,T.flagBorder]].map(([label,desc,color,bg,border])=>(
                <div key={label} style={{background:bg,border:"1px solid "+border,borderRadius:"7px",padding:"18px 20px",boxShadow:"0 1px 4px rgba(20,30,60,0.04)"}}>
                  <div style={{color,fontSize:"18px",fontWeight:900,marginBottom:"5px",fontFamily:"Merriweather,serif"}}>{label}</div>
                  <div style={{color:T.textLight,fontSize:"12px"}}>{desc}</div>
                </div>
              ))}
            </div>
            {/* Key metrics */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:"10px",marginBottom:"20px"}}>
              {[["Total Records",stats.count.toLocaleString(),T.navy],["Multi-Tract",stats.multiTract.toLocaleString(),T.okGreen],["Avg Sale Price",fmt$(Math.round(stats.avgPrice)),T.gold],["Median Sale Price",fmt$(Math.round(stats.medPrice)),T.gold],["Avg Acreage",fmtAc(+stats.avgAcres.toFixed(2)),T.navy],["Avg $/Acre",fmtPAc(Math.round(stats.avgPPAc)),T.okGreen],["Median $/Acre",fmtPAc(Math.round(stats.medPPAc)),T.okGreen],["Total Volume",fmt$(Math.round(stats.totalVolume)),"#7a4a8a"]].map(([label,value,color])=>(
                <div key={label} style={{background:T.surface,border:"1px solid "+T.border,borderRadius:"7px",padding:"16px 18px",boxShadow:"0 1px 4px rgba(20,30,60,0.04)"}}>
                  <div style={{color:T.textFaint,fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"6px",fontWeight:600}}>{label}</div>
                  <div style={{color,fontSize:"20px",fontWeight:900,fontFamily:"Merriweather,serif"}}>{value}</div>
                </div>
              ))}
            </div>
            {/* Category breakdown */}
            {topCats.length>0&&(
              <div style={{background:T.surface,border:"1px solid "+T.border,borderRadius:"7px",padding:"20px 22px",marginBottom:"14px",boxShadow:"0 1px 4px rgba(20,30,60,0.04)"}}>
                <div style={{color:T.textFaint,fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700,marginBottom:"16px"}}>Property Category Breakdown</div>
                {topCats.map(([cat,count])=>{const pct=Math.round((count/filtered.length)*100);return(
                  <div key={cat} style={{marginBottom:"12px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                      <span style={{color:T.textMid,fontSize:"13px",fontWeight:600}}>{cat}</span>
                      <span style={{color:T.gold,fontSize:"12px",fontWeight:700}}>{count.toLocaleString()} · {pct}%</span>
                    </div>
                    <div style={{background:T.navyTint,borderRadius:"3px",height:"4px"}}><div style={{background:T.navy,width:pct+"%",height:"100%",borderRadius:"3px",transition:"width 0.4s ease"}}/></div>
                  </div>
                );})}
              </div>
            )}
            {/* Acreage distribution */}
            <div style={{background:T.surface,border:"1px solid "+T.border,borderRadius:"7px",padding:"20px 22px",boxShadow:"0 1px 4px rgba(20,30,60,0.04)"}}>
              <div style={{color:T.textFaint,fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700,marginBottom:"16px"}}>Acreage Distribution</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:"8px"}}>
                {[[0,5,"< 5 ac"],[5,20,"5–20 ac"],[20,50,"20–50 ac"],[50,100,"50–100 ac"],[100,500,"100–500 ac"],[500,Infinity,"500+ ac"]].map(([lo,hi,label])=>{
                  const n=filtered.filter(c=>c.acreage>=lo&&c.acreage<hi).length;
                  const pct=filtered.length?Math.round((n/filtered.length)*100):0;
                  return(
                    <div key={label} style={{textAlign:"center",background:T.navyTint,borderRadius:"6px",padding:"14px 8px",border:"1px solid "+T.border}}>
                      <div style={{color:T.navy,fontSize:"20px",fontWeight:900,fontFamily:"Merriweather,serif",marginBottom:"4px"}}>{n}</div>
                      <div style={{color:T.textMid,fontSize:"10px",fontWeight:600,marginBottom:"3px"}}>{label}</div>
                      <div style={{color:T.textFaint,fontSize:"10px"}}>{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── IMPORT MODAL (ADMIN ONLY) ── */}
      {showImport&&(
        <div className="modal-overlay" onClick={()=>setShowImport(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
              <div>
                <h2 style={{fontFamily:"Merriweather,serif",fontSize:"18px",color:T.navy,fontWeight:700}}>Import Transaction Data</h2>
                <p style={{color:T.textLight,fontSize:"12px",marginTop:"2px"}}>Administrator access only</p>
              </div>
              <button onClick={()=>setShowImport(false)} style={{background:"none",border:"none",color:T.textFaint,cursor:"pointer",fontSize:"22px",lineHeight:1}}>×</button>
            </div>
            <div onClick={()=>fileRef.current.click()} onDrop={handleDrop} onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)}
              style={{background:dragOver?T.navyTint:T.surfaceAlt,border:"2px dashed "+(dragOver?T.navy:T.borderMid),borderRadius:"7px",padding:"32px 20px",textAlign:"center",cursor:"pointer",marginBottom:"16px",transition:"all 0.2s"}}>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/>
              {importing
                ?<div><div className="spin" style={{fontSize:"24px",color:T.navy,marginBottom:"8px"}}>↻</div><p style={{color:T.navy,fontWeight:700,fontSize:"13px"}}>Importing & consolidating…</p></div>
                :<div>
                  <div style={{fontSize:"32px",marginBottom:"10px"}}>📁</div>
                  <p style={{color:T.textMid,fontSize:"13px",fontWeight:600,marginBottom:"4px"}}>Drop Gateway SDF Excel export here</p>
                  <p style={{color:T.textFaint,fontSize:"11px"}}>or click to browse · .xlsx .xls .csv · duplicates auto-skipped by SDF_ID</p>
                </div>
              }
            </div>
            <p style={{color:T.textLight,fontSize:"11px",lineHeight:"1.7",marginBottom:"16px"}}>
              Download exports from <a href="https://gatewaysdf.ifionline.org/search" target="_blank" rel="noreferrer" style={{color:T.navy,fontWeight:700}}>gatewaysdf.ifionline.org</a>. Transactions are stored persistently and shared with all users. Duplicate SDF IDs are automatically skipped.
            </p>
            {importLog.length>0&&(
              <div>
                <p style={{color:T.navy,fontSize:"11px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"8px"}}>Import History</p>
                {importLog.slice(0,6).map((entry,i)=>(
                  <div key={i} style={{background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:"5px",padding:"9px 13px",marginBottom:"6px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <span style={{color:T.textMid,fontSize:"12px",fontWeight:600}}>{entry.fileName}</span>
                      <span style={{color:T.textFaint,fontSize:"11px",marginLeft:"10px"}}>{new Date(entry.importedAt).toLocaleDateString()}</span>
                    </div>
                    <div style={{display:"flex",gap:"12px",fontSize:"11px"}}>
                      <span style={{color:T.okGreen,fontWeight:700}}>+{entry.newCount} added</span>
                      {entry.dupeCount>0&&<span style={{color:T.textFaint}}>{entry.dupeCount} skipped</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SETTINGS MODAL ── */}
      {showSettings&&(
        <div className="modal-overlay" onClick={()=>setShowSettings(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px"}}>
              <h2 style={{fontFamily:"Merriweather,serif",fontSize:"18px",color:T.navy,fontWeight:700}}>Settings</h2>
              <button onClick={()=>setShowSettings(false)} style={{background:"none",border:"none",color:T.textFaint,cursor:"pointer",fontSize:"22px",lineHeight:1}}>×</button>
            </div>
            <div style={{marginBottom:"24px"}}>
              <label style={{display:"block",color:T.navy,fontSize:"12px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"6px"}}>Google Maps API Key</label>
              <p style={{color:T.textLight,fontSize:"12px",lineHeight:"1.6",marginBottom:"10px"}}>Used for Street View photos in MD-26 comp sheets. Enable the Street View Static API in Google Cloud Console. Cost ~$0.007/request.</p>
              <input type="text" value={googleApiKey} onChange={e=>setGoogleApiKey(e.target.value)} placeholder="AIzaSy…"
                style={{width:"100%",background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:"5px",padding:"10px 13px",color:T.text,fontFamily:"Lato,sans-serif",fontSize:"13px",outline:"none",marginBottom:"12px"}}
              />
              <button onClick={async()=>{await window.storage.set(settingsKey,JSON.stringify({googleApiKey}));showToast("Settings saved");}}
                style={{background:T.navy,color:"#fff",border:"none",borderRadius:"5px",padding:"9px 20px",fontFamily:"Lato,sans-serif",fontWeight:700,fontSize:"13px",cursor:"pointer"}}>
                Save Settings
              </button>
            </div>
            <div style={{borderTop:"1px solid "+T.border,paddingTop:"20px"}}>
              <label style={{display:"block",color:T.navy,fontSize:"12px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"6px"}}>Indiana Map Parcel Aerial</label>
              <p style={{color:T.textLight,fontSize:"12px",lineHeight:"1.6"}}>Aerial parcel images are sourced from IndianaMap (maps.indiana.edu) — a public state service requiring no API key. MD-26 exports include a direct parcel viewer link when a Google Maps key is not configured.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast&&(
        <div style={{position:"fixed",bottom:"24px",right:"24px",background:toast.type==="error"?T.flagBg:T.okBg,border:"1px solid "+(toast.type==="error"?T.flagBorder:T.okBorder),color:toast.type==="error"?T.flagRed:T.okGreen,padding:"12px 18px",borderRadius:"7px",fontFamily:"Lato,sans-serif",fontWeight:600,fontSize:"13px",animation:"fadeUp 0.3s ease",maxWidth:"500px",boxShadow:"0 6px 24px rgba(20,30,60,0.12)",zIndex:999}}>
          {toast.msg}
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer style={{textAlign:"center",padding:"24px",color:T.textFaint,fontSize:"11px",borderTop:"1px solid "+T.border,marginTop:"32px"}}>
        ParcelComp · Powered by <a href="https://consultcre.com" target="_blank" rel="noreferrer" style={{color:T.navy,fontWeight:700,textDecoration:"none"}}>CRE Consulting</a> · Indiana SDF · DLGF Code List 60 · <a href="https://parcelcomp.com" target="_blank" rel="noreferrer" style={{color:T.navy,fontWeight:700,textDecoration:"none"}}>parcelcomp.com</a>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MD-26 HTML EXPORT
// ─────────────────────────────────────────────────────────────
function buildMD26HTML(compDataArr,googleApiKey){
  const pages=compDataArr.map(({comp,aiFields:af,township,county})=>{
    const svApiKey=googleApiKey&&googleApiKey.startsWith("AIza");
    const svUrl=svApiKey?"https://maps.googleapis.com/maps/api/streetview?size=380x260&location="+encodeURIComponent(comp.address+", Indiana")+"&key="+googleApiKey:null;
    const parcelNum=(comp.parcel||"").trim();
    const fmvNote=comp.fmvBadge?"NOT ARM'S LENGTH: "+(comp.fmvFlags||[]).map(g=>g.reason).join("; "):"Appears arm's length";
    const fmt=n=>n>0?"$"+Number(n).toLocaleString():"—";
    const fmtAcL=n=>n>0?Number(n).toFixed(2)+" ac":"—";
    const row=(l1,v1,l2,v2)=>`<tr><td class="label" style="width:130px">${l1}</td><td class="value">${v1||""}</td>${l2!==undefined?`<td class="label">${l2}</td><td class="value">${v2||""}</td>`:""}</tr>`;
    const photoHtml=svUrl?`<img src="${svUrl}" style="width:100%;height:220px;object-fit:cover;" onerror="this.style.display=none">`:`<div class="no-photo">Street View unavailable<br>Add Google API key in Settings</div>`;
    const dataTable=[row("Date Sold",comp.saleDate||"","Act. Price",fmt(comp.salePrice||0)),row("Size",fmtAcL(comp.acreage||0),"Per Acre",fmt(comp.pricePerAcre||0)),row("Vendor",(comp.sellerName||"")+(comp.sellerCompany?" / "+comp.sellerCompany:""),"Vendee",(comp.buyerName||"")+(comp.buyerCompany?" / "+comp.buyerCompany:"")),row("Address",comp.address||"","City",comp.taxDistrictName||""),row("Legal Desc",comp.allParcels||comp.parcel||"","Doc #",comp.sdfId||""),row("Consideration",fmt(comp.salePrice||0),"Verified By",comp.preparerName||""),row("Condition",(af||{}).conditionOfSale||fmvNote,"H+B Use",(af||{}).highestBestUse||comp.propertyCategory||"")].join("");
    const landTable=[row("Dimensions",(af||{}).dimensionsSize||fmtAcL(comp.acreage||0)),row("Improvements",(af||{}).landImprovements||""),row("Services",(af||{}).availableServices||""),row("Topography",(af||{}).topography||"","Drainage",(af||{}).drainage||""),row("Soils",(af||{}).qualityOfSoils||"")].join("");
    const footer=[row("County",county,"Township",township),row("Type",comp.propertyCategory||"","Comp No.",comp.sdfId||""),row("Appraiser","")].join("");
    const fmvBanner=comp.fmvBadge?`<div class="fmv-banner ${comp.fmvBadge}">${comp.fmvBadge==="flag"?"NOT ARM'S LENGTH":"VERIFY ARM'S LENGTH"}: ${(comp.fmvFlags||[]).map(g=>g.reason).join(" | ")}</div>`:"";
    return`<div class="page"><div class="header"><div class="header-title">SALES OF COMPARABLE PROPERTIES</div><div class="header-sub">UNIMPROVED LAND COMPARABLE</div><div class="header-form">MD-26 · ParcelComp · CRE Consulting</div></div><table class="photo-table"><tr><td class="photo-label">Photo View</td><td class="photo-cell">${photoHtml}</td><td class="photo-label">Sketch/Aerial</td><td class="photo-cell"><div class="no-photo">IndianaMap Parcel Aerial<br>Parcel: ${parcelNum||"N/A"}<br>maps.indiana.edu</div></td></tr></table><table class="data-table">${dataTable}</table><div class="section-header">DESCRIPTION of LAND</div><table class="data-table">${landTable}</table><div style="height:60px;border-bottom:1px solid #000;font-size:11px;padding:4px">${comp.fmvFlags&&comp.fmvFlags.length?"FMV Notes: "+(comp.fmvFlags||[]).map(g=>g.reason).join(" | "):""}</div><table class="data-table">${footer}</table>${fmvBanner}</div>`;
  });
  const css=`body{font-family:Arial,sans-serif;font-size:11px;margin:0;color:#000}.page{width:7.5in;margin:.5in auto;page-break-after:always;border:1px solid #ccc;padding-bottom:12px}.header{text-align:center;padding:8px 0 4px;border-bottom:2px solid #1a2744}.header-title{font-weight:bold;font-size:14px;color:#1a2744}.header-sub{font-weight:bold;font-size:12px}.header-form{font-size:10px;color:#b8932a;font-style:italic}.photo-table{width:100%;border-collapse:collapse;margin-bottom:8px}.photo-label{width:70px;font-size:9px;vertical-align:top;padding:4px;font-weight:bold}.photo-cell{border:1px solid #000;height:240px;width:calc(50% - 70px);vertical-align:top;overflow:hidden}.no-photo{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:#f8f8f8;color:#888;font-size:10px;text-align:center;padding:12px}.data-table{width:100%;border-collapse:collapse;margin-bottom:6px}.label{font-size:10px;padding:2px 6px;vertical-align:bottom;white-space:nowrap;font-weight:bold;color:#333}.value{border-bottom:1px solid #000;font-size:10px;padding:2px 4px;vertical-align:bottom}.section-header{background:#1a2744;color:#fff;font-weight:bold;font-size:10px;padding:3px 8px;margin:6px 0 4px;letter-spacing:.08em}.fmv-banner{margin:8px 0 0;padding:6px 10px;font-size:10px;font-weight:bold;border-radius:3px}.fmv-banner.flag{background:#fff0f0;color:#b53a3a;border:1px solid #e8c4c4}.fmv-banner.warn{background:#fff8f0;color:#b87a1a;border:1px solid #e8d4b0}@media print{.page{border:none;margin:0;width:100%}@page{size:letter;margin:.5in}}`;
  return`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ParcelComp MD-26</title><style>${css}</style></head><body>${pages.join("")}<div style="text-align:center;color:#999;font-size:9px;padding:20px">ParcelComp · CRE Consulting · parcelcomp.com · Generated ${new Date().toLocaleDateString()}</div></body></html>`;
}