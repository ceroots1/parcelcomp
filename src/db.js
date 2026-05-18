update transactions t
set tax_district_name = (
  select concat(
    case t.tax_district_raw::integer
      when 38 then 'ABOITE TOWNSHIP (11)'
      when 39 then 'ADAMS TOWNSHIP (12)'
      when 40 then 'ADAMS TOWNSHIP-TRANSPORTATION'
      when 41 then 'EEL RIVER TOWNSHIP'
      when 42 then 'LAFAYETTE TOWNSHIP'
      when 43 then 'LAKE TOWNSHIP'
      when 44 then 'MAUMEE TOWNSHIP'
      when 45 then 'MILAN TOWNSHIP'
      when 46 then 'MONROE TOWNSHIP'
      when 47 then 'PERRY TOWNSHIP'
      when 48 then 'PLEASANT TOWNSHIP'
      when 49 then 'SCIPIO TOWNSHIP'
      when 50 then 'SMITH TOWNSHIP'
      when 51 then 'ST. JOSEPH TOWNSHIP'
      when 52 then 'UNION TOWNSHIP'
      when 53 then 'WASHINGTON TOWNSHIP'
      when 54 then 'WAYNE TOWNSHIP'
      when 55 then 'WHITLEY TOWNSHIP'
      else 'DISTRICT ' || t.tax_district_raw
    end,
    ' (ALLEN CO.)'
  )
)
where t.parcel like '02%'
and t.tax_district_raw::integer between 38 and 55;
