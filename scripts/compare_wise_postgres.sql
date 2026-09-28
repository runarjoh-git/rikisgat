-- ============================================================================
-- SAMANBURÐUR Á WISE LAUSNUM: EXCEL (OPNIRREIKNINGAR.IS) VS POSTGRESQL (RÍKISGÁT)
-- Keyrið þessar fyrirspurnir í Query Tool í pgAdmin 4 á gagnagrunninum 'rikisgat'
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SKREF 1: Finna rétt birgi_id fyrir Wise Lausnir
-- ----------------------------------------------------------------------------
SELECT id, nafn, kt 
FROM birgjar 
WHERE nafn ILIKE '%wise%'
ORDER BY id;

-- Athugið: Ef það eru mörg afbrigði af nafninu (t.d. 'Wise lausnir ehf.', 'Wise'), 
-- takið niður öll ID-in eða notið nafnasíuna 'ILIKE %wise%'.


-- ----------------------------------------------------------------------------
-- SKREF 2: Heildartölur (Heildarfjöldi reikninga og heildarupphæð)
-- Berið þessar tölur saman við samtöluna neðst í Excel skjalinu
-- ----------------------------------------------------------------------------
SELECT 
    COUNT(*) AS fjoldi_reikninga_db,
    SUM(r.upphaed) AS heildarupphaed_kr_db,
    MIN(r.dags) AS elsti_reikningur,
    MAX(r.dags) AS nyjasti_reikningur
FROM reikningar r
JOIN birgjar b ON r.birgi_id = b.id
WHERE b.nafn ILIKE '%wise%'
  AND r.dags >= '2017-01-01'
  AND r.dags <= '2026-07-31';


-- ----------------------------------------------------------------------------
-- SKREF 3: Skipting eftir árum (2017 - 2026)
-- Tilvalið ef heildartalan stemmir ekki: sýnir á hvaða ári mismunurinn liggur
-- ----------------------------------------------------------------------------
SELECT 
    EXTRACT(YEAR FROM r.dags) AS ar,
    COUNT(*) AS fjoldi_reikninga,
    SUM(r.upphaed) AS samtals_kr,
    ROUND(AVG(r.upphaed), 0) AS medal_reikningur_kr
FROM reikningar r
JOIN birgjar b ON r.birgi_id = b.id
WHERE b.nafn ILIKE '%wise%'
  AND r.dags >= '2017-01-01'
  AND r.dags <= '2026-07-31'
GROUP BY ar
ORDER BY ar ASC;


-- ----------------------------------------------------------------------------
-- SKREF 4: Skipting eftir stofnunum (Top viðskiptavinir)
-- ----------------------------------------------------------------------------
SELECT 
    s.nafn AS stofnun,
    COUNT(*) AS fjoldi_reikninga,
    SUM(r.upphaed) AS heildarupphaed_kr
FROM reikningar r
JOIN birgjar b ON r.birgi_id = b.id
JOIN stofnanir s ON r.stofnun_id = s.id
WHERE b.nafn ILIKE '%wise%'
  AND r.dags >= '2017-01-01'
  AND r.dags <= '2026-07-31'
GROUP BY s.nafn
ORDER BY heildarupphaed_kr DESC;


-- ============================================================================
-- SKREF 5: NÁKVÆMUR LÍNUSAMANBURÐUR (Finna nákvæmlega hvaða reikninga vantar)
-- Ef þú vistar Excel skjalið sem CSV (t.d. C:/Users/Public/wise_excel.csv):
-- ============================================================================

/*
-- A. Búa til tímabundna samanburðartöflu:
DROP TABLE IF EXISTS temp_wise_excel;
CREATE TEMP TABLE temp_wise_excel (
    stofnun TEXT,
    birgir TEXT,
    dags DATE,
    reikningsnumer TEXT,
    upphaed NUMERIC,
    tegund TEXT
);

-- B. Flytja CSV skrána inn (aðlagaðu dálka eftir röðinni í þínu skjali):
-- COPY temp_wise_excel FROM 'C:/Users/Public/wise_excel.csv' WITH (FORMAT csv, HEADER true, DELIMITER ';', ENCODING 'UTF8');

-- C. Finna reikninga sem eru í Excel en VANTAR í PostgreSQL:
SELECT e.*
FROM temp_wise_excel e
LEFT JOIN (
    SELECT r.numer, r.dags, r.upphaed, s.nafn AS stofnun
    FROM reikningar r
    JOIN birgjar b ON r.birgi_id = b.id
    JOIN stofnanir s ON r.stofnun_id = s.id
    WHERE b.nafn ILIKE '%wise%'
) db ON (e.reikningsnumer = db.numer OR (e.dags = db.dags AND e.upphaed = db.upphaed))
WHERE db.numer IS NULL;

-- D. Finna reikninga sem eru í PostgreSQL en EKKI í Excel:
SELECT db.*
FROM (
    SELECT r.numer, r.dags, r.upphaed, s.nafn AS stofnun
    FROM reikningar r
    JOIN birgjar b ON r.birgi_id = b.id
    JOIN stofnanir s ON r.stofnun_id = s.id
    WHERE b.nafn ILIKE '%wise%'
      AND r.dags >= '2017-01-01' AND r.dags <= '2026-07-31'
) db
LEFT JOIN temp_wise_excel e ON (e.reikningsnumer = db.numer OR (e.dags = db.dags AND e.upphaed = db.upphaed))
WHERE e.reikningsnumer IS NULL;
*/
