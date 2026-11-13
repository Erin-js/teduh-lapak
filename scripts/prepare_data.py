"""Export the existing analysis; never fabricate coordinates or field observations."""
import csv
import json
import statistics
from pathlib import Path
from shapely.geometry import shape, mapping
from shapely.ops import transform
from pyproj import Transformer

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'Visualisasi_Infografis_Final'
OUT = ROOT / 'public' / 'data'
OUT.mkdir(parents=True, exist_ok=True)

def read_csv(name):
    with (SOURCE / name).open(encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))

data = json.loads((SOURCE / 'HASIL_KLASTER_SPASIAL.geojson').read_text(encoding='utf-8'))
# The GeoJSON declares EPSG:32648 and contains negative northings. Respect its
# declared CRS; the srs_id attribute is inconsistent. Verify Jakarta bounds below.
project = Transformer.from_crs(32648, 4326, always_xy=True).transform
features, areas = [], []
lst_median = statistics.median(f['properties']['median_lst_c'] for f in data['features'])
ndvi_median = statistics.median(f['properties']['median_ndvi'] for f in data['features'])
for f in data['features']:
    p = f['properties']
    geom = transform(project, shape(f['geometry']).simplify(7, preserve_topology=True))
    center = geom.representative_point()
    assert 106 < center.x < 108 and -7 < center.y < -5, 'Unexpected CRS / Jakarta bounds'
    hot, low = p['median_lst_c'] >= lst_median, p['median_ndvi'] < ndvi_median
    category = 0 if hot and low else 1 if hot else 2 if low else 3
    props = {
        'id': str(p['kdepum']), 'name': p['wadmkd'].title(),
        'district': p['wadmkc'].title(), 'city': p['wadmkk'].title(),
        'lst': round(p['median_lst_c'], 3), 'ndvi': round(p['median_ndvi'], 5),
        'coverage': round(p['cakupan_persen'], 2), 'category': category,
        'cluster': int(p['klaster']),
        'lisa': {'HH': 'High-High', 'LL': 'Low-Low', 'HL': 'High-Low', 'LH': 'Low-High'}.get(p['lisa_fdr'].split(':')[0], 'Tidak signifikan'),
        'density': round(p['kepadatan_wni_km2']),
        'senior': round(p['persen_65plus_wni'], 2),
        'center': [round(center.x, 6), round(center.y, 6)]
    }
    features.append({'type': 'Feature', 'id': props['id'], 'properties': props, 'geometry': mapping(geom)})
    areas.append(props)

locations = []
for row in read_csv('data/pkl_pulogadung_2023.csv'):
    area = next(a for a in areas if a['name'].lower() == row['kelurahan'].lower() and a['district'].lower() == 'pulo gadung')
    locations.append({
        'id': row['kode_lokasi'].replace(' ', '-').lower(), 'code': row['kode_lokasi'],
        'name': row['alamat'], 'areaId': area['id'], 'area': area['name'],
        'vendors': int(row['pedagang_tercatat']), 'trade': row['jenis_dagangan'],
        'open': int(row['jam_buka']), 'close': int(row['jam_tutup']),
        'year': int(row['tahun']), 'source': row['sumber']
    })
hours = [{'hour': int(x['jam_wib']), 'temperature': round(float(x['T2M']), 2)} for x in read_csv('data/hasil_profil_jam.csv')]
summary = json.loads((SOURCE/'RINGKASAN_CLUSTER_SPASIAL.json').read_text(encoding='utf-8'))
assert len(areas) == 261 and sum(x['category'] == 0 for x in areas) == 89
assert sum(x['vendors'] for x in locations) == 436
for name, obj in [
    ('jakarta.geojson', {'type': 'FeatureCollection', 'features': features}),
    ('catalog.json', {'areas': areas, 'locations': locations, 'hours': hours,
                      'thresholds': {'lst': lst_median, 'ndvi': ndvi_median}, 'summary': summary})
]:
    (OUT/name).write_text(json.dumps(obj, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(f'Exported {len(areas)} kelurahan, {len(locations)} Loksem; all coordinates verified within Jakarta.')
