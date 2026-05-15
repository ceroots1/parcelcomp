import { supabase } from './supabaseClient'

// ── TRANSACTIONS ──────────────────────────────────────────────

export async function loadDB() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('sale_date', { ascending: false })

  if (error) {
    console.error('loadDB error:', error)
    return []
  }

  return (data || []).map(row => ({
    id:                row.id,
    sdfId:             row.sdf_id,
    parcel:            row.parcel,
    allParcels:        row.all_parcels,
    address:           row.address,
    propertyClassCode: row.property_class_code,
    taxDistrictRaw:    row.tax_district_raw,
    neighborhood:      row.neighborhood,
    saleDate:          row.sale_date,
    conveyanceDate:    row.conveyance_date,
    transferDate:      row.transfer_date,
    dateReceived:      row.date_received,
    salePrice:         Number(row.sale_price) || 0,
    acreage:           Number(row.acreage) || 0,
    pricePerAcre:      Number(row.price_per_acre) || 0,
    avLand:            Number(row.av_land) || 0,
    avImprovement:     Number(row.av_improvement) || 0,
    avTotal:           Number(row.av_total) || 0,
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
    all_parcels:         c.allParcels || c.parcel,
    address:             c.address,
    property_class_code: c.propertyClassCode,
    tax_district_raw:    c.taxDistrictRaw,
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