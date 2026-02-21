import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { useState } from 'react';

const CITIES = [
  'Jakarta Pusat',
  'Jakarta Selatan',
  'Jakarta Barat',
  'Jakarta Timur',
  'Jakarta Utara',
  'Bogor',
  'Depok',
  'Tangerang',
  'Bekasi',
  'Bandung',
  'Medan',
  'Surabaya',
  'Semarang',
  'Yogyakarta',
  'Makassar',
];

export function LocationSelector({ locations, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredCities = CITIES.filter((city) =>
    city.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddLocation = (city) => {
    if (!locations.includes(city)) {
      onChange([...locations, city]);
    }
    setSearch('');
  };

  const handleRemoveLocation = (city) => {
    onChange(locations.filter((l) => l !== city));
  };

  return (
    <div>
      <Label className="text-foreground mb-2 block">
        Lokasi Praktek <span className="text-destructive">*</span>
      </Label>

      {locations.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {locations.map((location) => (
            <div
              key={location}
              className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 border border-primary/30"
            >
              <span className="text-sm font-medium text-primary">{location}</span>
              <button
                type="button"
                onClick={() => handleRemoveLocation(location)}
                className="text-primary hover:text-primary/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          placeholder="Cari kota/kabupaten..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="mt-2"
        />

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {filteredCities.length > 0 ? (
              filteredCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleAddLocation(city)}
                  disabled={locations.includes(city)}
                  className="w-full text-left px-4 py-2 hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm text-foreground hover:text-foreground transition-colors"
                >
                  {city}
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                Tidak ada hasil
              </div>
            )}
          </div>
        )}

        {open && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[9]"
          />
        )}
      </div>
    </div>
  );
}
