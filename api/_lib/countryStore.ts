import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseQuotaExhausted, handleFirebaseError } from './firebase.js';

export interface CustomCountry {
  id: string;
  name: string;
  code: string;
  prefix: string;
  flag: string;
  active: boolean;
  createdAt?: number;
}

export const DEFAULT_COUNTRIES: CustomCountry[] = [
  { id: 'CTRY-1', name: 'Azerbaijan', code: 'AZ', prefix: '+994', flag: '🇦🇿', active: true },
  { id: 'CTRY-2', name: 'United States', code: 'US', prefix: '+1', flag: '🇺🇸', active: true },
  { id: 'CTRY-3', name: 'United Kingdom', code: 'GB', prefix: '+44', flag: '🇬🇧', active: true },
  { id: 'CTRY-4', name: 'Germany', code: 'DE', prefix: '+49', flag: '🇩🇪', active: true },
  { id: 'CTRY-5', name: 'France', code: 'FR', prefix: '+33', flag: '🇫🇷', active: true },
  { id: 'CTRY-6', name: 'Spain', code: 'ES', prefix: '+34', flag: '🇪🇸', active: true },
  { id: 'CTRY-7', name: 'Netherlands', code: 'NL', prefix: '+31', flag: '🇳🇱', active: true },
  { id: 'CTRY-8', name: 'Bangladesh', code: 'BD', prefix: '+880', flag: '🇧🇩', active: true },
  { id: 'CTRY-9', name: 'Indonesia', code: 'ID', prefix: '+62', flag: '🇮🇩', active: true },
  { id: 'CTRY-10', name: 'Brazil', code: 'BR', prefix: '+55', flag: '🇧🇷', active: true },
  { id: 'CTRY-11', name: 'Ivory Coast', code: 'CI', prefix: '+225', flag: '🇨🇮', active: true },
  { id: 'CTRY-12', name: 'Iraq', code: 'IQ', prefix: '+964', flag: '🇮🇶', active: true },
];

export class CountryStore {
  private static cachedCountries: CustomCountry[] | null = null;
  private static lastFetch = 0;
  private static TTL = 2000;

  public static async getAll(): Promise<CustomCountry[]> {
    const now = Date.now();
    if (this.cachedCountries && now - this.lastFetch < this.TTL) {
      return this.cachedCountries;
    }

    if (isFirebaseQuotaExhausted()) {
      return DEFAULT_COUNTRIES;
    }

    try {
      const colRef = collection(db, 'custom_countries');
      const snap = await getDocs(colRef);
      const list: CustomCountry[] = [];

      snap.forEach((d) => {
        const data = d.data() as CustomCountry;
        if (data && data.name) {
          list.push(data);
        }
      });

      if (list.length === 0) {
        // Seed default countries into Firestore if empty
        for (const c of DEFAULT_COUNTRIES) {
          try {
            await setDoc(doc(db, 'custom_countries', c.id), c);
          } catch (_) {}
        }
        this.cachedCountries = DEFAULT_COUNTRIES;
      } else {
        // Ensure defaults are present in map
        const map = new Map<string, CustomCountry>();
        DEFAULT_COUNTRIES.forEach((c) => map.set(c.id, c));
        list.forEach((c) => map.set(c.id, c));
        this.cachedCountries = Array.from(map.values());
      }

      this.lastFetch = now;
      return this.cachedCountries;
    } catch (e: any) {
      handleFirebaseError(e);
      return DEFAULT_COUNTRIES;
    }
  }

  public static async save(country: Partial<CustomCountry>): Promise<CustomCountry> {
    const id = country.id || `CTRY-${Date.now()}`;
    const name = String(country.name || '').trim();
    const code = (country.code || name.substring(0, 2)).toUpperCase().trim();
    let prefix = String(country.prefix || '+1').trim();
    if (prefix && !prefix.startsWith('+')) prefix = `+${prefix}`;

    const newCountry: CustomCountry = {
      id,
      name,
      code,
      prefix,
      flag: country.flag || '🌐',
      active: country.active !== undefined ? country.active : true,
      createdAt: country.createdAt || Date.now(),
    };

    if (isFirebaseQuotaExhausted()) {
      return newCountry;
    }

    try {
      await setDoc(doc(db, 'custom_countries', id), newCountry);
      this.cachedCountries = null; // Invalidate cache
    } catch (e: any) {
      handleFirebaseError(e);
    }

    return newCountry;
  }

  public static async delete(id: string): Promise<boolean> {
    if (isFirebaseQuotaExhausted()) {
      return true;
    }

    try {
      await deleteDoc(doc(db, 'custom_countries', id));
      this.cachedCountries = null;
      return true;
    } catch (e: any) {
      handleFirebaseError(e);
      return false;
    }
  }
}
