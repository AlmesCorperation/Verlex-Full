import { UGCItem } from '../types';

const STORAGE_KEY = 'verlex_ugc_catalog_items';

const initialUgcItems: UGCItem[] = [
  {
    id: 'ugc_flame_hoodie',
    name: 'Neon Flame Hoodie',
    type: 'shirt',
    category: 'Shirts',
    creator: 'Builderman',
    price: 35,
    currency: 'V$',
    pattern: 'Flame',
    primaryColor: '#e74c3c',
    secondaryColor: '#f1c40f',
    description: 'Blazing neon fire hoodie with custom sleeve decals.',
    createdAt: Date.now() - 86400000 * 2,
    salesCount: 142,
  },
  {
    id: 'ugc_cyber_pants',
    name: 'Cyberpunk Armor Pants',
    type: 'pants',
    category: 'Pants',
    creator: 'Clockwork',
    price: 25,
    currency: 'V$',
    pattern: 'Cyber',
    primaryColor: '#2c3e50',
    secondaryColor: '#00f0ff',
    description: 'High-tech tactical cargo pants with glowing neon blue seams.',
    createdAt: Date.now() - 86400000 * 3,
    salesCount: 98,
  },
  {
    id: 'ugc_galaxy_tshirt',
    name: 'Galaxy Nebula Graphic Tee',
    type: 'tshirt',
    category: 'T-Shirts',
    creator: 'Shedletsky',
    price: 15,
    currency: 'V$',
    pattern: 'Galaxy',
    primaryColor: '#8e44ad',
    secondaryColor: '#3498db',
    description: 'Deep space cosmic galaxy printed front graphic.',
    createdAt: Date.now() - 86400000 * 5,
    salesCount: 210,
  },
];

class UgcService {
  private items: UGCItem[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.items = this.loadItems();
  }

  private loadItems(): UGCItem[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse UGC items:', e);
    }
    return [...initialUgcItems];
  }

  public getUgcItems(): UGCItem[] {
    return [...this.items];
  }

  public publishUgcItem(item: Omit<UGCItem, 'id' | 'createdAt' | 'salesCount'>): UGCItem {
    const newItem: UGCItem = {
      ...item,
      id: `ugc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: Date.now(),
      salesCount: 0,
    };

    this.items.unshift(newItem);
    this.save();
    this.notify();
    return newItem;
  }

  public incrementSales(id: string): void {
    const item = this.items.find((i) => i.id === id);
    if (item) {
      item.salesCount += 1;
      this.save();
      this.notify();
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }
}

export const ugcService = new UgcService();
