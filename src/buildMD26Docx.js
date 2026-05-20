import {
  Document, Paragraph, Table, TableRow, TableCell, TextRun,
  AlignmentType, WidthType, BorderStyle, HeightRule,
  ShadingType, Packer, PageBreak, TableLayoutType,
} from 'docx'

// Letter page — 0.5 in margins each side → 7.5 in content = 10 800 twips
const PW = 10800

// Border presets (IBorderOptions shape)
const NB  = { style: BorderStyle.NONE,   size: 0,  color: 'FFFFFF', space: 0 }
const OB  = { style: BorderStyle.SINGLE, size: 8,  color: '000000', space: 0 }
const IB  = { style: BorderStyle.SINGLE, size: 4,  color: 'AAAAAA', space: 0 }
const LB  = { style: BorderStyle.SINGLE, size: 6,  color: '000000', space: 1 }
const DB  = { style: BorderStyle.SINGLE, size: 4,  color: 'CCCCCC', space: 0 }
const TLB = { style: BorderStyle.SINGLE, size: 16, color: '1A2744', space: 1 }

// ── Helpers ────────────────────────────────────────────────────

// Label (tiny bold gray) + value (bottom-underlined) cell for borderless row tables
function lv(label, value, width, borderRight = false) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: 60, bottom: 40, left: 90, right: 90 },
    borders: { top: NB, bottom: NB, left: NB, right: borderRight ? DB : NB },
    children: [
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: label, bold: true, size: 14, color: '777777' })],
      }),
      new Paragraph({
        spacing: { before: 0, after: 30 },
        border: { bottom: LB },
        children: [new TextRun({ text: String(value ?? ''), size: 20 })],
      }),
    ],
  })
}

// Same content as lv but no cell-level border override — used inside tables that
// supply their own outer/inner borders (photo row, footer)
function lvB(label, value, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: 60, bottom: 40, left: 90, right: 90 },
    children: [
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: label, bold: true, size: 14, color: '777777' })],
      }),
      new Paragraph({
        spacing: { before: 0, after: 30 },
        border: { bottom: LB },
        children: [new TextRun({ text: String(value ?? ''), size: 20 })],
      }),
    ],
  })
}

// Single-row, fully-borderless wrapper table (used for transaction field rows)
function rowTable(cells) {
  return new Table({
    width: { size: PW, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    borders: { top: NB, bottom: NB, left: NB, right: NB, insideH: NB, insideV: NB },
    rows: [new TableRow({ cells })],
  })
}

// Navy section-header paragraph
function secHdr(text) {
  return new Paragraph({
    spacing: { before: 100, after: 60 },
    shading: { type: ShadingType.SOLID, color: '1A2744', fill: '1A2744' },
    children: [new TextRun({ text, bold: true, size: 18, color: 'FFFFFF', allCaps: true })],
  })
}

// ── Public API ─────────────────────────────────────────────────

export async function buildMD26Docx(compDataArr, notesMap = {}) {
  const children = []

  compDataArr.forEach(({ comp, aiFields: af = {} }, idx) => {

    // ── Derived values ──────────────────────────────────────
    const countyM  = (comp.taxDistrictName || '').match(/(\w+(?:\s+\w+)?)\s+CO\.?/i)
    const county   = countyM ? countyM[1].trim() : ''
    const tshipM   = (comp.taxDistrictName || '').match(/^(.+?)\s+\w+(?:\s+\w+)?\s+CO\.?/i)
    const township = tshipM ? tshipM[1].trim() : (comp.taxDistrictName || '')

    const addrParts = (comp.address || '').split(',')
    const city = addrParts.length >= 2
      ? addrParts[1].replace(/\s+IN\s*\d.*/i, '').trim()
      : ''

    const fmt$  = n => n > 0 ? '$' + Number(n).toLocaleString('en-US') : ''
    const fmtAc = n => n > 0 ? Number(n).toFixed(2) + ' ac' : ''

    const condSale = comp.fmvBadge === 'flag'
      ? "NOT ARM'S LENGTH: " + (comp.fmvFlags || []).map(f => f.reason).join('; ')
      : comp.fmvBadge === 'warn'
        ? 'VERIFY: ' + (comp.fmvFlags || []).map(f => f.reason).join('; ')
        : af.conditionOfSale || "Arm's Length"

    const vendor = [comp.sellerName, comp.sellerCompany].filter(Boolean).join(' / ')
    const vendee = [comp.buyerName, comp.buyerCompany].filter(Boolean).join(' / ')

    const notes       = notesMap[comp.sdfId] || []
    const commentLines = notes.length > 0
      ? notes.map(n => `[${n.author} – ${n.timestamp}]: ${n.text}`)
      : [' ']

    // ── Column widths (twips) ───────────────────────────────
    const Q   = Math.floor(PW / 4)         // 2700  — quarter
    const H   = Math.floor(PW / 2)         // 5400  — half
    const T   = Math.floor(PW / 3)         // 3600  — third
    const T3  = PW - T - T                 // 3600  — last third (absorbs rounding)
    const R5A = Math.floor(PW * 0.40)      // 4320  — row-5 col A
    const R5B = Math.floor(PW * 0.40)      // 4320  — row-5 col B
    const R5C = PW - R5A - R5B             // 2160  — row-5 col C (Date Ver.)

    // ── Title ───────────────────────────────────────────────
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      border: { bottom: TLB },
      children: [new TextRun({
        text: 'SALES OF COMPARABLE PROPERTIES  /  UNIMPROVED LAND COMPARABLE  /  MD-26',
        bold: true, size: 22, color: '1A2744',
      })],
    }))

    // ── Photo row (2.5 in tall, bordered, center-divided) ───
    children.push(new Table({
      width: { size: PW, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      borders: { top: OB, bottom: OB, left: OB, right: OB, insideV: OB, insideH: NB },
      rows: [new TableRow({
        height: { value: 3600, rule: HeightRule.ATLEAST },
        cells: [
          new TableCell({
            width: { size: H, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 40 },
                children: [new TextRun({ text: 'Photo View', bold: true, size: 16, color: '888888' })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: '(paste street view photo here)', size: 14, color: 'BBBBBB', italics: true })],
              }),
            ],
          }),
          new TableCell({
            width: { size: H, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 40 },
                children: [new TextRun({ text: 'Sketch / Aerial', bold: true, size: 16, color: '888888' })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: '(paste sketch or aerial here)', size: 14, color: 'BBBBBB', italics: true })],
              }),
            ],
          }),
        ],
      })],
    }))

    // ── Transaction fields ──────────────────────────────────
    // Row 1: Date Sold | Act. Price | Size | /Per Acre
    children.push(rowTable([
      lv('Date Sold',  comp.saleDate || '',     Q, true),
      lv('Act. Price', fmt$(comp.salePrice),    Q, true),
      lv('Size',       fmtAc(comp.acreage),     Q, true),
      lv('/Per Acre',  fmt$(comp.pricePerAcre), Q, false),
    ]))
    // Row 2: Vendor | Vendee
    children.push(rowTable([
      lv('Vendor', vendor, H, true),
      lv('Vendee', vendee, H, false),
    ]))
    // Row 3: Property Address | City
    children.push(rowTable([
      lv('Property Address', comp.address || '', H, true),
      lv('City',             city,               H, false),
    ]))
    // Row 4: Legal Description | Document #
    children.push(rowTable([
      lv('Legal Description', comp.allParcels || comp.parcel || '', H, true),
      lv('Document #',        comp.sdfId || '',                     H, false),
    ]))
    // Row 5: Rec. Consideration | Sale Info Verified By | Date Ver.
    children.push(rowTable([
      lv('Rec. Consideration',    fmt$(comp.salePrice),    R5A, true),
      lv('Sale Info Verified By', comp.preparerName || '', R5B, true),
      lv('Date Ver.',             '',                      R5C, false),
    ]))
    // Row 6: Financing | Zoning
    children.push(rowTable([
      lv('Financing', '',                           H, true),
      lv('Zoning',    comp.propertyClassDesc || '', H, false),
    ]))
    // Row 7: Condition of Sale | Highest & Best Use
    children.push(rowTable([
      lv('Condition of Sale',  condSale,                                        H, true),
      lv('Highest & Best Use', af.highestBestUse || comp.propertyCategory || '', H, false),
    ]))

    // ── DESCRIPTION OF LAND ────────────────────────────────
    children.push(secHdr('DESCRIPTION OF LAND'))

    children.push(rowTable([
      lv('Dimensions / Size', af.dimensionsSize || fmtAc(comp.acreage), PW, false),
    ]))
    children.push(rowTable([
      lv('Land Improvements',
        af.landImprovements ||
          'Drives  |  Walks  |  Landscaping  |  Trees  |  Well  |  Septic  |  Fence  |  Pond',
        PW, false),
    ]))
    children.push(rowTable([
      lv('Available Services',
        af.availableServices || 'Road  |  City Water  |  City Sewer  |  Gas  |  Other',
        PW, false),
    ]))
    children.push(rowTable([
      lv('Land Topography', af.topography || '',     T,  true),
      lv('Drainage',        af.drainage || '',       T,  true),
      lv('Quality of Soils',af.qualityOfSoils || '', T3, false),
    ]))

    // Comments (with saved notes)
    children.push(new Table({
      width: { size: PW, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      borders: { top: NB, bottom: NB, left: NB, right: NB, insideH: NB, insideV: NB },
      rows: [new TableRow({
        height: { value: 1440, rule: HeightRule.ATLEAST },
        cells: [new TableCell({
          width: { size: PW, type: WidthType.DXA },
          margins: { top: 60, bottom: 40, left: 90, right: 90 },
          borders: { top: NB, bottom: NB, left: NB, right: NB },
          children: [
            new Paragraph({
              spacing: { before: 0, after: 0 },
              children: [new TextRun({ text: 'Comments', bold: true, size: 14, color: '777777' })],
            }),
            ...commentLines.map(line => new Paragraph({
              spacing: { before: 0, after: 30 },
              border: { bottom: LB },
              children: [new TextRun({ text: line, size: 20 })],
            })),
          ],
        })],
      })],
    }))

    // ── Footer table ───────────────────────────────────────
    children.push(new Paragraph({ spacing: { before: 80, after: 0 }, children: [new TextRun('')] }))

    const FT  = Math.floor(PW / 3)
    const FT3 = PW - FT - FT

    children.push(new Table({
      width: { size: PW, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      borders: { top: OB, bottom: OB, left: OB, right: OB, insideH: IB, insideV: IB },
      rows: [
        new TableRow({ cells: [
          lvB("Appraiser's Name",  '',                        FT),
          lvB('Broker No.',        '',                        FT),
          lvB('Appraisal Lic. No.','',                        FT3),
        ]}),
        new TableRow({ cells: [
          lvB('County',            county,                    FT),
          lvB('Township',          township,                  FT),
          lvB('Type Property',     comp.propertyCategory || '',FT3),
        ]}),
        new TableRow({ cells: [
          lvB('Project No.',       '',                        FT),
          lvB('Insp. Date',        '',                        FT),
          lvB('Comp. No.',         comp.sdfId || '',          FT3),
        ]}),
      ],
    }))

    // Page break between comps (omit after last)
    if (idx < compDataArr.length - 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }))
    }
  })

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },          // Letter
          margin: { top: 720, right: 720, bottom: 720, left: 720 }, // 0.5 in
        },
      },
      children,
    }],
  })

  return Packer.toBlob(doc)
}
