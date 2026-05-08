import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FilterState } from '../types';

interface GaokaoStore {
  selectedProvinces: string[];
  filterState: FilterState;
  toggleProvince: (provinceId: string) => void;
  setSelectedProvinces: (ids: string[]) => void;
  setFilterState: (state: Partial<FilterState>) => void;
}

export const useStore = create<GaokaoStore>()(
  persist(
    (set, get) => ({
      selectedProvinces: ['beijing', 'henan', 'shanghai', 'guangdong'],
      filterState: {
        selectedProvinces: [],
        sortBy: 'undergraduateRate',
        sortOrder: 'desc',
        regionFilter: [],
        difficultyFilter: [],
        difficultyLevel: undefined,
        region: undefined,
        minUndergraduateRate: undefined,
      },
      toggleProvince: (provinceId: string) => {
        const { selectedProvinces } = get();
        if (selectedProvinces.includes(provinceId)) {
          if (selectedProvinces.length > 1) {
            set({ selectedProvinces: selectedProvinces.filter(id => id !== provinceId) });
          }
        } else if (selectedProvinces.length < 6) {
          set({ selectedProvinces: [...selectedProvinces, provinceId] });
        }
      },
      setSelectedProvinces: (ids: string[]) => {
        set({ selectedProvinces: ids.slice(0, 6) });
      },
      setFilterState: (state: Partial<FilterState>) => {
        set({ filterState: { ...get().filterState, ...state } });
      },
    }),
    { name: 'gaokao-storage', partialize: (state) => ({ selectedProvinces: state.selectedProvinces }) }
  )
);
