export interface IndianCityEntry {
  canonicalName: string;
  state: string;
  aliases: string[];
  latitude: number;
  longitude: number;
  disambiguationNote?: string;
}

export const INDIAN_CITIES_CATALOG: IndianCityEntry[] = [
  {
    canonicalName: 'Pune',
    state: 'Maharashtra',
    aliases: ['poona', 'pnq'],
    latitude: 18.5204,
    longitude: 73.8567,
  },
  {
    canonicalName: 'Ahilyanagar',
    state: 'Maharashtra',
    aliases: ['ahmednagar', 'ahmadnagar', 'ahn'],
    latitude: 19.0948,
    longitude: 74.748,
    disambiguationNote: 'Formerly known as Ahmednagar (Maharashtra).',
  },
  {
    canonicalName: 'Pimpri-Chinchwad',
    state: 'Maharashtra',
    aliases: ['pcmc', 'pimpri', 'chinchwad'],
    latitude: 18.6298,
    longitude: 73.7997,
  },
  {
    canonicalName: 'Mumbai',
    state: 'Maharashtra',
    aliases: ['bombay', 'bom'],
    latitude: 19.076,
    longitude: 72.8777,
  },
  {
    canonicalName: 'Thane',
    state: 'Maharashtra',
    aliases: ['thane west'],
    latitude: 19.2183,
    longitude: 72.9781,
  },
  {
    canonicalName: 'Navi Mumbai',
    state: 'Maharashtra',
    aliases: ['vashi', 'belapur', 'nerul'],
    latitude: 19.033,
    longitude: 73.0297,
  },
  {
    canonicalName: 'Nashik',
    state: 'Maharashtra',
    aliases: ['nasik'],
    latitude: 19.9975,
    longitude: 73.7898,
  },
  {
    canonicalName: 'Nagpur',
    state: 'Maharashtra',
    aliases: ['nag'],
    latitude: 21.1458,
    longitude: 79.0882,
  },
  {
    canonicalName: 'Chhatrapati Sambhajinagar',
    state: 'Maharashtra',
    aliases: ['aurangabad', 'sambhajinagar'],
    latitude: 19.8762,
    longitude: 75.3433,
    disambiguationNote:
      'Maharashtra city formerly named Aurangabad (distinct from Aurangabad, Bihar).',
  },
  {
    canonicalName: 'Aurangabad (Bihar)',
    state: 'Bihar',
    aliases: ['aurangabad bihar'],
    latitude: 24.7521,
    longitude: 84.3742,
    disambiguationNote:
      'Bihar district headquarters (distinct from Chhatrapati Sambhajinagar, Maharashtra).',
  },
  {
    canonicalName: 'Kolhapur',
    state: 'Maharashtra',
    aliases: ['klh'],
    latitude: 16.705,
    longitude: 74.2433,
  },
  {
    canonicalName: 'Solapur',
    state: 'Maharashtra',
    aliases: ['sholapur'],
    latitude: 17.6599,
    longitude: 75.9064,
  },
  {
    canonicalName: 'Satara',
    state: 'Maharashtra',
    aliases: [],
    latitude: 17.6805,
    longitude: 74.0183,
  },
  {
    canonicalName: 'Delhi',
    state: 'NCT Delhi',
    aliases: ['new delhi', 'ncr'],
    latitude: 28.6139,
    longitude: 77.209,
  },
  {
    canonicalName: 'Bengaluru',
    state: 'Karnataka',
    aliases: ['bangalore', 'blr'],
    latitude: 12.9716,
    longitude: 77.5946,
  },
  {
    canonicalName: 'Hyderabad',
    state: 'Telangana',
    aliases: ['hyd'],
    latitude: 17.385,
    longitude: 78.4867,
  },
  {
    canonicalName: 'Chennai',
    state: 'Tamil Nadu',
    aliases: ['madras'],
    latitude: 13.0827,
    longitude: 80.2707,
  },
  {
    canonicalName: 'Kolkata',
    state: 'West Bengal',
    aliases: ['calcutta'],
    latitude: 22.5726,
    longitude: 88.3639,
  },
  {
    canonicalName: 'Ahmedabad',
    state: 'Gujarat',
    aliases: ['amdavad'],
    latitude: 23.0225,
    longitude: 72.5714,
  },
  {
    canonicalName: 'Jaipur',
    state: 'Rajasthan',
    aliases: ['pink city'],
    latitude: 26.9124,
    longitude: 75.7873,
  },
  {
    canonicalName: 'Surat',
    state: 'Gujarat',
    aliases: [],
    latitude: 21.1702,
    longitude: 72.8311,
  },
  {
    canonicalName: 'Lucknow',
    state: 'Uttar Pradesh',
    aliases: [],
    latitude: 26.8467,
    longitude: 80.9462,
  },
];

export function searchIndianCities(query: string): IndianCityEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return INDIAN_CITIES_CATALOG.slice(0, 10);

  return INDIAN_CITIES_CATALOG.filter(
    (entry) =>
      entry.canonicalName.toLowerCase().includes(q) ||
      entry.state.toLowerCase().includes(q) ||
      entry.aliases.some((alias) => alias.includes(q))
  );
}

export function findCityMetadata(cityName: string): IndianCityEntry | null {
  const normalized = cityName.trim().toLowerCase();
  if (!normalized) return null;
  return (
    INDIAN_CITIES_CATALOG.find(
      (c) => c.canonicalName.toLowerCase() === normalized || c.aliases.some((a) => a === normalized)
    ) ?? null
  );
}

export function normalizeCityCanonicalName(cityName: string): string {
  const match = findCityMetadata(cityName);
  return match ? match.canonicalName : cityName.trim();
}
